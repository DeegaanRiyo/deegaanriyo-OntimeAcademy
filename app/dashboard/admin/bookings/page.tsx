import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookingsClient from "@/components/dashboard/admin/BookingsClient";

export const metadata = { title: "Bookings — Admin" };

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "owner"].includes(profile?.role ?? "")) redirect("/dashboard");

  const { data } = await supabase
    .from("bookings")
    .select("id, visitor_name, visitor_email, visitor_phone, booking_date, start_time, hours, estimated_cost, status, created_at, spaces(name)")
    .order("created_at", { ascending: false });

  const bookings = (data ?? []) as any[];

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Bookings</h2>
          <p>{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
        </div>
      </div>
      <BookingsClient initialBookings={bookings} />
    </div>
  );
}
