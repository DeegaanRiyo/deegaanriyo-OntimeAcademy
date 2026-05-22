import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Sidebar, { type NavSection } from "@/app/dashboard/_components/Sidebar";
import DashboardLayout from "@/app/dashboard/_components/DashboardLayout";

const NAV: NavSection[] = [
  {
    label: "Menu",
    items: [
      { href: "/dashboard/receptionist",          icon: "fa-th-large",     label: "Overview"      },
      { href: "/dashboard/receptionist/students", icon: "fa-user-graduate", label: "Students"     },
      { href: "/dashboard/receptionist/members",  icon: "fa-id-card",       label: "Members"      },
      { href: "/dashboard/receptionist/bookings", icon: "fa-calendar-alt",  label: "Bookings"     },
      { href: "/dashboard/receptionist/visitors", icon: "fa-door-open",     label: "Walk-in"      },
      { href: "/",                                icon: "fa-globe",          label: "View Website", target: "_blank" },
      { href: "/dashboard/receptionist/profile",  icon: "fa-user-circle",   label: "Profile"      },
    ],
  },
];

export default async function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role, full_name, username")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "receptionist") redirect("/dashboard");

  const name     = profile.full_name || profile.username || "Receptionist";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          role="Receptionist"
          userName={name}
          userInitials={initials}
          portalLabel="Reception Portal"
          logoSuffix="CWS"
          navSections={NAV}
        />
      }
      topbarTitle="Reception Portal"
      topbarBreadcrumb="Receptionist"
    >
      {children}
    </DashboardLayout>
  );
}
