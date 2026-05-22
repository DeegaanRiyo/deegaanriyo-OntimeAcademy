import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["owner", "manager", "receptionist", "admin"];

// Converts HH:MM or HH:MM:SS → integer minutes. Safe for both DB and form values.
function toMinutes(t: string): number {
  const parts = t.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function computeHours(startTime: string, endTime: string): number {
  const diff = toMinutes(endTime) - toMinutes(startTime);
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
  const mine     = searchParams.get("mine") === "true";

  let query = service
    .from("bookings")
    .select(`
      id, space_id, visitor_name, visitor_phone,
      booking_date, start_time, end_time, hours,
      status, notes, booked_by, estimated_cost, created_at,
      spaces(id, name, slug)
    `)
    .order("booking_date", { ascending: false })
    .order("start_time");

  if (mine)    query = query.eq("booked_by", user.id);
  if (date)    query = query.eq("booking_date", date);
  if (spaceId) query = query.eq("space_id", spaceId);
  if (status)  query = query.eq("status", status);

  const { data: bookings, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ bookings: [] });
  }

  // Fetch payment totals separately — avoids PostgREST join issues with legacy table
  const bookingIds = bookings.map((b: any) => b.id);
  const { data: payments } = await service
    .from("booking_payments")
    .select("booking_id, amount, method, reference")
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });

  // Group payments by booking_id — first entry is most recent
  const payMap: Record<string, { total: number; method: string | null; reference: string | null }> = {};
  for (const p of payments ?? []) {
    if (!payMap[p.booking_id]) payMap[p.booking_id] = { total: 0, method: null, reference: null };
    payMap[p.booking_id].total += p.amount ?? 0;
    if (!payMap[p.booking_id].method) {
      payMap[p.booking_id].method    = p.method    ?? null;
      payMap[p.booking_id].reference = p.reference ?? null;
    }
  }

  // Resolve booked_by → profile name
  const bookedByIds = [...new Set(bookings.map((b: any) => b.booked_by).filter(Boolean))];
  const bookedByNames: Record<string, string> = {};
  if (bookedByIds.length > 0) {
    const { data: bkProfiles } = await service
      .from("profiles").select("id, full_name").in("id", bookedByIds);
    for (const r of bkProfiles ?? []) bookedByNames[r.id] = r.full_name;
  }

  const enriched = bookings.map((b: any) => ({
    ...b,
    spaces:         Array.isArray(b.spaces) ? (b.spaces[0] ?? null) : b.spaces,
    total_paid:     payMap[b.id]?.total     ?? 0,
    method:         payMap[b.id]?.method    ?? null,
    reference:      payMap[b.id]?.reference ?? null,
    booked_by_name: b.booked_by ? (bookedByNames[b.booked_by] ?? null) : null,
  }));

  return NextResponse.json({ bookings: enriched });
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

  if (toMinutes(end_time) <= toMinutes(start_time)) {
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
    const bEndMins = b.end_time
      ? toMinutes(b.end_time)
      : toMinutes(b.start_time) + (b.hours ?? 1) * 60;
    // Overlap: new start < existing end AND new end > existing start
    // All comparisons in integer minutes — immune to HH:MM vs HH:MM:SS mismatch.
    if (toMinutes(start_time) < bEndMins && toMinutes(end_time) > toMinutes(b.start_time)) {
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
  const amt = Math.round(Number(amount_paid) || 0);
  if (data && amt > 0 && payment_method) {
    const { error: payErr } = await service.from("booking_payments").insert({
      booking_id:  data.id,
      amount:      amt,
      method:      payment_method,
      reference:   payment_reference || null,
      recorded_by: user.id,
    });
    if (payErr) {
      // Booking was saved but payment failed — return the error so the client knows
      return NextResponse.json(
        { booking: data, payment_error: payErr.message },
        { status: 201 }
      );
    }
  }

  return NextResponse.json({ booking: data }, { status: 201 });
}
