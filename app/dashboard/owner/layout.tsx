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

  // ── Badge counts ─────────────────────────────────────────────────────────────
  const { count: pendingBookings } = await serviceClient
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  let pendingCorrections = 0;
  try {
    const { count } = await serviceClient
      .from("correction_notes")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCorrections = count ?? 0;
  } catch {}

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

  // ── Navigation ───────────────────────────────────────────────────────────────
  const NAV: NavSection[] = [
    {
      label: "",
      items: [
        { href: "/dashboard/owner", icon: "fa-th-large", label: "Overview" },
      ],
    },
    {
      label: "People",
      items: [
        { href: "/dashboard/owner/students", icon: "fa-user-graduate", label: "Students"  },
        { href: "/dashboard/owner/members",  icon: "fa-id-card",       label: "Members"   },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          href:       "/dashboard/owner/bookings",
          icon:       "fa-calendar-check",
          label:      "Bookings",
          badge:      (pendingBookings ?? 0) > 0 ? String(pendingBookings) : undefined,
          badgeColor: "var(--gold)",
        },
        { href: "/dashboard/owner/financials", icon: "fa-wallet", label: "Financials" },
        {
          href:       "/dashboard/owner/expenses",
          icon:       "fa-file-invoice-dollar",
          label:      "Expenses",
          badge:      pendingExpenses > 0 ? String(pendingExpenses) : undefined,
          badgeColor: "var(--gold)",
        },
        {
          href:       "/dashboard/owner/corrections",
          icon:       "fa-flag",
          label:      "Corrections",
          badge:      pendingCorrections > 0 ? String(pendingCorrections) : undefined,
          badgeColor: "var(--gold)",
        },
      ],
    },
    {
      label: "Team",
      items: [
        { href: "/dashboard/owner/team", icon: "fa-users", label: "Team Members" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard/owner/profile", icon: "fa-user-circle", label: "My Profile" },
        { href: "/", icon: "fa-globe", label: "View Website", badge: "Live", badgeColor: "var(--gold)", target: "_blank" },
      ],
    },
  ];

  const topbarRight = (
    <>
      <span className="tb-date">{dateStr}</span>
      {(pendingBookings ?? 0) > 0 && (
        <a href="/dashboard/owner/bookings" style={{ textDecoration: "none" }}>
          <span className="tb-pending-pill">{pendingBookings} pending booking{(pendingBookings ?? 0) !== 1 ? "s" : ""}</span>
        </a>
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
