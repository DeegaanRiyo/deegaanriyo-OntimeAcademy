import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Sidebar, { type NavSection } from "@/app/dashboard/_components/Sidebar";
import DashboardLayout from "@/app/dashboard/_components/DashboardLayout";

const NAV: NavSection[] = [
  {
    label: "My Portal",
    items: [
      { href: "/dashboard/member",         icon: "fa-home",        label: "Home"       },
      { href: "/dashboard/member/profile", icon: "fa-user-circle", label: "My Profile" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/#pricing", icon: "fa-calendar-plus", label: "Book a Space" },
      { href: "/",         icon: "fa-globe",          label: "Public Site", target: "_blank" },
    ],
  },
];

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
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

  if (profile?.role !== "member") redirect("/dashboard");

  const name     = profile.full_name || profile.email || "Member";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const topbarRight = (
    <>
      <div className="tb-btn">
        <i className="fas fa-bell" />
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
          role="Member"
          userName={name}
          userInitials={initials}
          portalLabel="Member Portal"
          navSections={NAV}
        />
      }
      topbarTitle="Member Portal"
      topbarBreadcrumb="Member"
      topbarRight={topbarRight}
    >
      {children}
    </DashboardLayout>
  );
}
