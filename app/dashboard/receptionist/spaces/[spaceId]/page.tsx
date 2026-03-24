import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import SpaceDetailClient from "./SpaceDetailClient";

export const revalidate = 0;

export default async function SpaceDetailPage({ params }: { params: { spaceId: string } }) {
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: space } = await service
    .from("spaces")
    .select("id, name, slug, is_available, hourly_rate, description")
    .eq("id", params.spaceId)
    .single();

  if (!space) notFound();

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

  const { data: bookings } = await service
    .from("bookings")
    .select("id, visitor_name, visitor_phone, setup, booking_date, start_time, end_time, hours, status, notes, booked_by, estimated_cost, created_at")
    .eq("space_id", params.spaceId)
    .eq("booking_date", today)
    .in("status", ["pending", "confirmed", "active", "completed", "cancelled"])
    .order("start_time");

  // All spaces for booking form
  const { data: allSpaces } = await service
    .from("spaces")
    .select("id, name, slug")
    .order("name");

  return (
    <SpaceDetailClient
      space={space}
      todayBookings={bookings ?? []}
      allSpaces={allSpaces ?? []}
      today={today}
      basePath="/dashboard/receptionist"
    />
  );
}
