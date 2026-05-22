import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import ManagerBookingsClient from "./ManagerBookingsClient";

export const revalidate = 0;

export default async function ManagerBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today   = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const nowTime = new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit", hour12: false });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

  const { data: bookings } = await service
    .from("bookings")
    .select(`
      id, visitor_name, visitor_phone, setup,
      booking_date, start_time, end_time, hours,
      status, notes, booked_by, estimated_cost, created_at,
      spaces(id, name, slug),
      booking_payments(amount)
    `)
    .is("deleted_at", null)
    .gte("booking_date", fromDate)
    .order("booking_date", { ascending: false })
    .order("start_time");

  const { data: allSpaces } = await service
    .from("spaces")
    .select("id, name, slug")
    .order("name");

  const normalised = (bookings ?? []).map((b: any) => ({
    ...b,
    spaces:     Array.isArray(b.spaces) ? (b.spaces[0] ?? null) : b.spaces,
    total_paid: (b.booking_payments ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
  }));

  return (
    <ManagerBookingsClient
      bookings={normalised}
      allSpaces={allSpaces ?? []}
      today={today}
      nowTime={nowTime}
    />
  );
}
