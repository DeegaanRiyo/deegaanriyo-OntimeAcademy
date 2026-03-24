import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Sidebar, { type NavSection } from "@/app/dashboard/_components/Sidebar";
import DashboardLayout from "@/app/dashboard/_components/DashboardLayout";

const NAV: NavSection[] = [
  {
    label: "Learning",
    items: [
      { href: "/dashboard/student",         icon: "fa-th-large",       label: "Overview"   },
      { href: "/dashboard/student/courses", icon: "fa-graduation-cap", label: "My Courses" },
      { href: "/dashboard/student/profile", icon: "fa-user-circle",    label: "My Profile" },
    ],
  },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
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

  if (profile?.role !== "student") redirect("/dashboard");

  const name     = profile.full_name || profile.email || "Student";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          role="Student"
          userName={name}
          userInitials={initials}
          portalLabel="Student Portal"
          navSections={NAV}
        />
      }
      topbarTitle="Student Portal"
      topbarBreadcrumb="Student"
    >
      {children}
    </DashboardLayout>
  );
}
