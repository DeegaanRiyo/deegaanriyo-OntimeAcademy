import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["owner", "manager", "receptionist"];

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
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

  const { data: booking, error: bErr } = await svc
    .from("bookings")
    .select(`
      id, visitor_name, visitor_phone, booking_date,
      start_time, end_time, estimated_cost, notes, created_at,
      booked_by,
      spaces(name)
    `)
    .eq("id", params.id)
    .single();

  if (bErr || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Fetch recorder profile
  let recorder: { full_name: string } | null = null;
  if (booking.booked_by) {
    const { data: rec } = await svc
      .from("profiles").select("full_name").eq("id", booking.booked_by).single();
    if (rec) recorder = { full_name: rec.full_name };
  }

  const { data: payments } = await svc
    .from("booking_payments")
    .select("amount, method, reference")
    .eq("booking_id", params.id)
    .order("created_at");

  const amount_paid   = (payments ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const pay_method    = payments?.[0]?.method ?? null;
  const pay_reference = payments?.[0]?.reference ?? null;

  return NextResponse.json({
    booking: {
      ...(booking as any),
      spaces:        Array.isArray(booking.spaces) ? (booking.spaces[0] ?? null) : booking.spaces,
      recorder,
      amount_paid,
      pay_method,
      pay_reference,
    },
  });
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
    amount_paid,
    payment_method,
    payment_reference,
  } = body;

  // ── Record extra payment without changing status ──────────────────────────
  if (action === "record_payment") {
    const amt = Number(amount_paid);
    if (!amount_paid || isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: "Enter a valid payment amount." }, { status: 400 });
    }
    const method = payment_method === "bank_transfer" ? "bank_transfer" : "cash";

    const { error: payErr } = await svc.from("booking_payments").insert({
      booking_id:  params.id,
      amount:      Math.round(amt),
      method,
      reference:   payment_reference ?? null,
      recorded_by: user.id,
    });
    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const allowed = ["confirmed", "active", "completed", "cancelled", "rejected"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // ── Verify booking exists ────────────────────────────────────────────────
  const { data: current, error: fetchErr } = await svc
    .from("bookings")
    .select("id")
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

  // Delete associated payments first to avoid FK constraint violation
  const { error: payErr } = await svc
    .from("booking_payments")
    .delete()
    .eq("booking_id", params.id);

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  const { error } = await svc
    .from("bookings")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
