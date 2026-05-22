import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Sidebar, { type NavSection } from "@/app/dashboard/_components/Sidebar";
import DashboardLayout from "@/app/dashboard/_components/DashboardLayout";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
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

  if (profile?.role !== "manager") redirect("/dashboard");

  // Pending counts for badge indicators
  const { count: pendingCount } = await supabase
    .from("pending_registrations")
    .select("id", { count: "exact", head: true })
    .eq("manager_id", user.id)
    .eq("status", "pending");

  const { count: pwCount } = await supabase
    .from("password_reset_requests")
    .select("id", { count: "exact", head: true })
    .eq("manager_id", user.id)
    .eq("status", "pending");

  const serviceClient2 = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { count: pendingBookings } = await serviceClient2
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .is("deleted_at", null);

  let approvedExpenses = 0;
  try {
    const { count } = await serviceClient2
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("recorded_by", user.id)
      .eq("status", "approved");
    approvedExpenses = count ?? 0;
  } catch {}

  const name         = profile.full_name || profile.username || "Manager";
  const initials     = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const totalPending = (pendingCount ?? 0) + (pwCount ?? 0) + (pendingBookings ?? 0);

  const NAV: NavSection[] = [
    {
      label: "Overview",
      items: [
        { href: "/dashboard/manager", icon: "fa-th-large", label: "Dashboard" },
      ],
    },
    {
      label: "Work",
      items: [
        {
          href: "/dashboard/manager/bookings",
          icon: "fa-calendar-check",
          label: "Bookings",
          badge: (pendingBookings ?? 0) > 0 ? String(pendingBookings) : undefined,
          badgeColor: "var(--gold)",
        },
        { href: "/dashboard/manager/students", icon: "fa-user-graduate", label: "Students" },
        { href: "/dashboard/manager/members",  icon: "fa-id-card",       label: "Members"  },
        {
          href: "/dashboard/manager/expenses",
          icon: "fa-file-invoice-dollar",
          label: "Expenses",
          badge:      approvedExpenses > 0 ? String(approvedExpenses) : undefined,
          badgeColor: "#16a34a",
        },
      ],
    },
    {
      label: "Team",
      items: [
        { href: "/dashboard/manager/team",   icon: "fa-users", label: "My Team" },
        { href: "/dashboard/manager/invite", icon: "fa-link",  label: "Invite"  },
        {
          href: "/dashboard/manager/approvals",
          icon: "fa-clock",
          label: "Approvals",
          badge: (pendingCount ?? 0) > 0 ? String(pendingCount) : undefined,
          badgeColor: "var(--gold)",
        },
        {
          href: "/dashboard/manager/password-requests",
          icon: "fa-key",
          label: "Pwd Requests",
          badge: (pwCount ?? 0) > 0 ? String(pwCount) : undefined,
          badgeColor: "var(--teal)",
        },
      ],
    },
    {
      label: "Site",
      items: [
        { href: "/", icon: "fa-globe", label: "View Website", target: "_blank" },
      ],
    },
  ];

  const topbarRight = (
    <>
      {totalPending > 0 && (
        <Link
          href="/dashboard/manager/approvals"
          className="tb-btn"
          title={`${totalPending} pending actions`}
          style={{ position: "relative", color: "var(--gold)" }}
        >
          <i className="fas fa-bell" />
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            background: "var(--gold)", color: "#000",
            borderRadius: "50%", width: "16px", height: "16px",
            fontSize: ".6rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {totalPending}
          </span>
        </Link>
      )}
      <Link href="/" className="tb-btn" title="Back to site" target="_blank">
        <i className="fas fa-arrow-up-right-from-square" />
      </Link>
    </>
  );

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          role="Manager"
          userName={name}
          userInitials={initials}
          portalLabel="Manager Portal"
          navSections={NAV}
        />
      }
      topbarTitle="Manager Portal"
      topbarBreadcrumb="Manager"
      topbarRight={topbarRight}
    >
      {children}
    </DashboardLayout>
  );
}
