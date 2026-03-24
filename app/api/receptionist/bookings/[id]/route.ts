import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["owner", "admin", "manager", "receptionist"];

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = service();

  const { data: profile } = await svc
    .from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED_ROLES.includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    action,
    status,
    // Payment fields
    amount_paid,
    payment_method,
    payment_reference,
    visitor_name,
    visitor_phone,
  } = body;

  // ── Record extra payment without changing status ──────────────────────────
  if (action === "record_payment") {
    const amt = Number(amount_paid);
    if (!amount_paid || isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: "Enter a valid payment amount." }, { status: 400 });
    }
    const method = payment_method === "bank_transfer" ? "bank_transfer" : "cash";
    const { data: bk } = await svc
      .from("bookings")
      .select("visitor_name, visitor_phone")
      .eq("id", params.id)
      .single();

    const { error: payErr } = await svc.from("walk_in_payments").insert({
      type:           "space_rental",
      customer_name:  visitor_name  ?? bk?.visitor_name  ?? "",
      customer_phone: visitor_phone ?? bk?.visitor_phone ?? "",
      booking_id:     params.id,
      amount:         Math.round(amt),
      method,
      reference:      payment_reference ?? null,
      recorded_by:    user.id,
    });
    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const allowed = ["confirmed", "active", "completed", "cancelled", "rejected"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // ── Fetch current booking to check prior status ───────────────────────────
  const { data: current, error: fetchErr } = await svc
    .from("bookings")
    .select("id, status, space_id, visitor_name, visitor_phone, booking_date, estimated_cost")
    .eq("id", params.id)
    .single();

  if (fetchErr || !current) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // ── Update booking status ─────────────────────────────────────────────────
  const { data: updated, error: updateErr } = await svc
    .from("bookings")
    .update({ status })
    .eq("id", params.id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // ── Record payment when confirming a pending booking ──────────────────────
  if (
    status === "confirmed" &&
    current.status === "pending" &&
    amount_paid != null &&
    Number(amount_paid) > 0
  ) {
    const method = payment_method === "bank_transfer" ? "bank_transfer" : "cash";

    const { error: payErr } = await svc
      .from("walk_in_payments")
      .insert({
        type:           "space_rental",
        customer_name:  visitor_name  ?? current.visitor_name,
        customer_phone: visitor_phone ?? current.visitor_phone,
        booking_id:     params.id,
        amount:         Math.round(Number(amount_paid)),
        method,
        reference:      payment_reference ?? null,
        recorded_by:    user.id,
      });

    if (payErr) {
      // Payment insert failed — roll back the status change
      await svc.from("bookings").update({ status: "pending" }).eq("id", params.id);
      return NextResponse.json({ error: `Payment record failed: ${payErr.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ booking: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = service();

  const { data: profile } = await svc
    .from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED_ROLES.includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await svc
    .from("bookings")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
