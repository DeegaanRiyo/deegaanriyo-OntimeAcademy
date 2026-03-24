import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Sidebar, { type NavSection } from "@/app/dashboard/_components/Sidebar";
import DashboardLayout from "@/app/dashboard/_components/DashboardLayout";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") redirect("/dashboard");

  const name     = profile.full_name || profile.email || "Chief Executive Officer";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  // Pending bookings badge
  const { count: pendingBookings } = await serviceClient
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // Pending corrections badge (may not exist yet)
  let pendingCorrections = 0;
  try {
    const { count } = await serviceClient
      .from("correction_notes")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCorrections = count ?? 0;
  } catch {}

  // Pending expense requests badge (may not exist yet)
  let pendingExpenses = 0;
  try {
    const { count } = await serviceClient
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("requires_approval", true);
    pendingExpenses = count ?? 0;
  } catch {}

  const dateStr = new Date().toLocaleDateString("en-KE", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  const NAV: NavSection[] = [
    {
      label: "Overview",
      items: [
        { href: "/dashboard/owner", icon: "fa-th-large", label: "Dashboard" },
      ],
    },
    {
      label: "People",
      items: [
        { href: "/dashboard/owner/team",     icon: "fa-users",         label: "Staff"    },
        { href: "/dashboard/owner/members",  icon: "fa-id-card",       label: "Members"  },
        { href: "/dashboard/owner/students", icon: "fa-user-graduate", label: "Students" },
      ],
    },
    {
      label: "Management",
      items: [
        { href: "/dashboard/owner/financials",  icon: "fa-wallet",    label: "Financials"  },
        {
          href: "/dashboard/owner/expenses",
          icon: "fa-file-invoice-dollar",
          label: "Expenses",
          badge:      pendingExpenses > 0 ? String(pendingExpenses) : undefined,
          badgeColor: "var(--gold)",
        },
        {
          href: "/dashboard/owner/corrections",
          icon: "fa-flag",
          label: "Corrections",
          badge:      pendingCorrections > 0 ? String(pendingCorrections) : undefined,
          badgeColor: "var(--gold)",
        },
        { href: "/dashboard/owner/settings",    icon: "fa-sliders-h", label: "Settings"    },
      ],
    },
    {
      label: "Site",
      items: [
        { href: "/", icon: "fa-globe", label: "View Website", badge: "Live", badgeColor: "var(--gold)", target: "_blank" },
      ],
    },
  ];

  const topbarRight = (
    <>
      <span className="tb-date">{dateStr}</span>
      {(pendingBookings ?? 0) > 0 && (
        <span className="tb-pending-pill">{pendingBookings} pending</span>
      )}
    </>
  );

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          role="Chief Executive Officer"
          userName={name}
          userInitials={initials}
          portalLabel="CEO Portal"
          navSections={NAV}
        />
      }
      topbarTitle="Dashboard"
      topbarBreadcrumb="CEO Portal"
      topbarRight={topbarRight}
    >
      {children}
    </DashboardLayout>
  );
}
