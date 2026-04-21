import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["owner", "admin", "manager", "receptionist"];

function computeHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(1, Math.ceil(diff / 60));
}

// GET — list bookings (filter by date / space_id / status)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await service
    .from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED_ROLES.includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date     = searchParams.get("date");
  const spaceId  = searchParams.get("space_id");
  const status   = searchParams.get("status");

  let query = service
    .from("bookings")
    .select(`
      id, space_id, visitor_name, visitor_phone, setup,
      booking_date, start_time, end_time, hours,
      status, notes, booked_by, estimated_cost, created_at,
      spaces(name, slug),
      walk_in_payments(amount)
    `)
    .order("booking_date", { ascending: false })
    .order("start_time");

  if (date)    query = query.eq("booking_date", date);
  if (spaceId) query = query.eq("space_id", spaceId);
  if (status)  query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ bookings: data });
}

// POST — create a new booking (goes straight to confirmed)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await service
    .from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED_ROLES.includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    space_id, visitor_name, visitor_phone, setup,
    booking_date, start_time, end_time, notes,
    estimated_cost, amount_paid, payment_method, payment_reference,
  } = body;

  if (!space_id || !visitor_name || !visitor_phone || !booking_date || !start_time || !end_time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (end_time <= start_time) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const hours = computeHours(start_time, end_time);

  // Check for overlapping confirmed/active bookings on the same space
  const { data: conflicts } = await service
    .from("bookings")
    .select("id, visitor_name, start_time, end_time, hours")
    .eq("space_id", space_id)
    .eq("booking_date", booking_date)
    .in("status", ["confirmed", "active"]);

  for (const b of conflicts ?? []) {
    const bEnd = b.end_time ?? (() => {
      const [h, m] = (b.start_time as string).split(":").map(Number);
      const totalMin = h * 60 + m + (b.hours ?? 1) * 60;
      return `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
    })();
    // Overlap: new start < existing end AND new end > existing start
    if (start_time < bEnd && end_time > b.start_time) {
      return NextResponse.json(
        { error: `Conflicts with existing booking for ${b.visitor_name} at ${b.start_time}` },
        { status: 409 }
      );
    }
  }

  const { data, error } = await service
    .from("bookings")
    .insert({
      space_id,
      visitor_name,
      visitor_phone,
      setup:          setup || null,
      booking_date,
      start_time,
      end_time,
      hours,
      status:         "confirmed",
      notes:          notes || null,
      booked_by:      user.id,
      estimated_cost: estimated_cost ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If payment was collected at booking time, record it
  const amt = Number(amount_paid);
  if (data && amt > 0 && payment_method) {
    await service.from("walk_in_payments").insert({
      booking_id:     data.id,
      customer_name:  visitor_name,
      customer_phone: visitor_phone,
      amount:         amt,
      method:         payment_method,
      reference:      payment_reference || null,
      type:           "space_rental",
      recorded_by:    user.id,
    });
  }

  return NextResponse.json({ booking: data }, { status: 201 });
}
