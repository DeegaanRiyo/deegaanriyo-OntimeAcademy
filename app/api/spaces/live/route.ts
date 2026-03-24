import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 0;

function getEATDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}
function getEATTimeString(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
function computeEndTime(startTime: string, hours: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const totalMin = h * 60 + m + hours * 60;
  return `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
}

export async function GET() {
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: spaces, error: spacesErr } = await service
    .from("spaces")
    .select("id, name, slug, is_available, hourly_rate")
    .order("name");

  if (spacesErr) return NextResponse.json({ error: spacesErr.message }, { status: 500 });

  const today   = getEATDateString();
  const nowTime = getEATTimeString();

  // Confirmed/active bookings for today
  const { data: confirmed } = await service
    .from("bookings")
    .select("id, space_id, visitor_name, visitor_phone, setup, start_time, end_time, hours, status, booking_date")
    .eq("booking_date", today)
    .in("status", ["confirmed", "active"])
    .order("start_time");

  // ALL pending bookings (any date) that haven't been actioned
  const { data: pending } = await service
    .from("bookings")
    .select("id, space_id, visitor_name, visitor_phone, start_time, hours, booking_date, estimated_cost")
    .eq("status", "pending")
    .order("booking_date")
    .order("start_time");

  const confirmedBookings = confirmed ?? [];
  const pendingBookings   = pending   ?? [];

  const result = (spaces ?? []).map((space) => {
    const spaceConfirmed = confirmedBookings.filter((b) => b.space_id === space.id);
    const spacePending   = pendingBookings.filter((b)   => b.space_id === space.id);

    const current = spaceConfirmed.find((b) => {
      const end = b.end_time ?? computeEndTime(b.start_time, b.hours ?? 1);
      return b.start_time <= nowTime && end > nowTime;
    });
    const upcoming = spaceConfirmed.find((b) => b.start_time > nowTime);

    return {
      ...space,
      todayBookings: spaceConfirmed,
      pendingCount:  spacePending.length,
      pendingList:   spacePending,
      current: current ? {
        id: current.id,
        client: current.visitor_name,
        phone: current.visitor_phone,
        setup: current.setup,
        startTime: current.start_time,
        endTime: current.end_time ?? computeEndTime(current.start_time, current.hours ?? 1),
        status: current.status,
      } : null,
      upcoming: upcoming ? {
        id: upcoming.id,
        client: upcoming.visitor_name,
        setup: upcoming.setup,
        startTime: upcoming.start_time,
        endTime: upcoming.end_time ?? computeEndTime(upcoming.start_time, upcoming.hours ?? 1),
      } : null,
      nowTime,
      today,
    };
  });

  return NextResponse.json({ spaces: result });
}
