import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import ReceptionistDashboardClient from "./ReceptionistDashboardClient";

export const revalidate = 0;

function computeEnd(startTime: string, hours: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total  = h * 60 + m + hours * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default async function ReceptionistDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today   = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const nowTime = new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit", hour12: false });

  const [
    { data: confirmedRaw   },
    { data: todayRaw       },
    { data: spacesRaw      },
    { data: membersRaw     },
    { data: studentsRaw    },
    { data: allBookingsRaw },
    { data: profileRaw     },
  ] = await Promise.all([
    // Confirmed upcoming (not today and not past)
    service
      .from("bookings")
      .select("id")
      .eq("status", "confirmed")
      .is("deleted_at", null)
      .gt("booking_date", today),

    // Today's confirmed + active (for active-now calculation)
    service
      .from("bookings")
      .select("id, start_time, hours, status")
      .eq("booking_date", today)
      .is("deleted_at", null)
      .in("status", ["confirmed", "active"]),

    // All spaces for booking form
    service.from("spaces").select("id, name, slug").order("name"),

    // Member count — active members
    service.from("members").select("id").eq("is_active", true),

    // Student count from student_registrations (all-time)
    service.from("student_registrations").select("id"),

    // All-time booking count (exclude soft-deleted)
    service.from("bookings").select("id").is("deleted_at", null),

    // Receptionist's display name
    service.from("profiles").select("full_name").eq("id", user!.id).single(),
  ]);

  const todayBookings = todayRaw ?? [];

  const activeCount = todayBookings.filter((b: any) => {
    const end = computeEnd(b.start_time, b.hours ?? 1);
    return b.status === "active" || (b.status === "confirmed" && b.start_time <= nowTime && end > nowTime);
  }).length;

  const userName = (profileRaw as any)?.full_name ?? "Receptionist";

  return (
    <ReceptionistDashboardClient
      activeCount={activeCount}
      totalBookings={(allBookingsRaw ?? []).length}
      confirmedCount={(confirmedRaw ?? []).length}
      memberCount={(membersRaw ?? []).length}
      studentCount={(studentsRaw ?? []).length}
      allSpaces={spacesRaw ?? []}
      today={today}
      nowTime={nowTime}
      userName={userName}
    />
  );
}
