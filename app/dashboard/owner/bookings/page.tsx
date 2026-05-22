import { createServerClient } from "@supabase/ssr";
import BookingsClient from "./BookingsClient";

export const dynamic = "force-dynamic";

function service() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export default async function OwnerBookingsPage() {
  const admin = service();

  const now          = new Date();
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const today        = now.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

  const [
    { data: bookingsRaw },
    { data: spacesRaw },
  ] = await Promise.all([
    admin
      .from("bookings")
      .select(`
        id, visitor_name, visitor_phone, setup,
        booking_date, start_time, end_time, hours,
        status, notes, booked_by, estimated_cost, created_at,
        spaces(id, name, slug)
      `)
      .is("deleted_at", null)
      .order("booking_date", { ascending: false })
      .order("start_time"),

    admin
      .from("spaces")
      .select("id, name, slug")
      .order("name"),
  ]);

  // Fetch payment totals from booking_payments
  const bookingIds = (bookingsRaw ?? []).map((b: any) => b.id);
  const { data: payments } = bookingIds.length > 0
    ? await admin.from("booking_payments").select("booking_id, amount").in("booking_id", bookingIds)
    : { data: [] };

  const payMap: Record<string, number> = {};
  for (const p of payments ?? []) {
    payMap[p.booking_id] = (payMap[p.booking_id] ?? 0) + (p.amount ?? 0);
  }

  // Fetch receptionist names for booked_by UUIDs
  const bookedByIds = [...new Set((bookingsRaw ?? []).map((b: any) => b.booked_by).filter(Boolean))];
  let bookedByNames: Record<string, string> = {};
  if (bookedByIds.length > 0) {
    const { data: recProfiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", bookedByIds);
    for (const p of recProfiles ?? []) {
      bookedByNames[p.id] = p.full_name;
    }
  }

  const bookings = (bookingsRaw ?? []).map((b: any) => ({
    ...b,
    spaces:          Array.isArray(b.spaces) ? (b.spaces[0] ?? null) : b.spaces,
    total_paid:      payMap[b.id] ?? 0,
    booked_by_name:  b.booked_by ? (bookedByNames[b.booked_by] ?? null) : null,
  }));

  // ── KPI counts ────────────────────────────────────────────────────────────────
  const total     = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const todayBkgs = bookings.filter((b) => b.booking_date === today).length;
  const monthBkgs = bookings.filter((b) => b.created_at >= monthStart).length;

  return (
    <BookingsClient
      bookings={bookings}
      spaces={spacesRaw ?? []}
      kpi={{ total, confirmed, cancelled, today: todayBkgs, thisMonth: monthBkgs }}
    />
  );
}
