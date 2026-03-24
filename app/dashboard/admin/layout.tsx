import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Sidebar, { type NavSection } from "@/app/dashboard/_components/Sidebar";
import DashboardLayout from "@/app/dashboard/_components/DashboardLayout";

const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard/admin", icon: "fa-th-large", label: "Dashboard" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/dashboard/admin/members", icon: "fa-building", label: "CWS Members" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/dashboard/admin/bookings", icon: "fa-calendar-alt", label: "Bookings" },
      { href: "/dashboard/admin/spaces",   icon: "fa-door-open",    label: "Spaces"   },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/", icon: "fa-globe", label: "View Website", badge: "Live", badgeColor: "var(--gold)", target: "_blank" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (profile?.role !== "admin") redirect("/dashboard");

  const name     = profile.full_name || profile.email || "Admin";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const topbarRight = (
    <>
      <div className="tb-search">
        <i className="fas fa-search" />
        <input type="text" placeholder="Search…" />
      </div>
      <div className="tb-btn">
        <i className="fas fa-bell" />
        <span className="tb-notif" />
      </div>
      <Link href="/" className="tb-btn" title="Back to site" target="_blank">
        <i className="fas fa-arrow-up-right-from-square" />
      </Link>
    </>
  );

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          role="Admin"
          userName={name}
          userInitials={initials}
          portalLabel="Admin Dashboard"
          navSections={NAV}
        />
      }
      topbarTitle="Admin Dashboard"
      topbarBreadcrumb="Admin"
      topbarRight={topbarRight}
    >
      {children}
    </DashboardLayout>
  );
}
