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
        spaces(id, name, slug),
        walk_in_payments(amount)
      `)
      .order("booking_date", { ascending: false })
      .order("start_time"),

    admin
      .from("spaces")
      .select("id, name, slug")
      .order("name"),
  ]);

  const bookings = (bookingsRaw ?? []).map((b: any) => ({
    ...b,
    spaces:     Array.isArray(b.spaces)           ? (b.spaces[0] ?? null)    : b.spaces,
    total_paid: (b.walk_in_payments ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
  }));

  // ── KPI counts ────────────────────────────────────────────────────────────────
  const total     = bookings.length;
  const pending   = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const todayBkgs = bookings.filter((b) => b.booking_date === today).length;
  const monthBkgs = bookings.filter((b) => b.created_at >= monthStart).length;

  return (
    <BookingsClient
      bookings={bookings}
      spaces={spacesRaw ?? []}
      kpi={{ total, pending, confirmed, cancelled, today: todayBkgs, thisMonth: monthBkgs }}
    />
  );
}
