import { createClient as createServiceClient } from "@supabase/supabase-js";
import Link from "next/link";
import StaffTabsClient, { type StaffMember } from "./StaffTabsClient";

export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function OwnerTeamPage() {
  const admin = service();

  const [
    { data: staffRaw },
    { data: teachersRaw },
    { data: coursesRaw },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, username, email, role, is_active, created_at")
      .in("role", ["manager", "receptionist", "social_media"])
      .order("created_at", { ascending: true }),

    admin
      .from("profiles")
      .select("id, full_name, username, email, is_active, created_at")
      .eq("role", "teacher")
      .order("created_at", { ascending: true }),

    admin
      .from("courses")
      .select("id, teacher_id, title, mode, is_published, price"),
  ]);

  const courses    = (coursesRaw ?? []) as any[];
  const staff      = (staffRaw   ?? []) as any[];
  const teachersDb = (teachersRaw ?? []) as any[];

  // Build teacher→courses map
  const teacherCourseMap: Record<string, any[]> = {};
  for (const c of courses) {
    if (!teacherCourseMap[c.teacher_id]) teacherCourseMap[c.teacher_id] = [];
    teacherCourseMap[c.teacher_id].push(c);
  }

  // Split by role
  const toMember = (s: any, extraCourses?: any[]): StaffMember => ({
    id:         s.id,
    full_name:  s.full_name,
    username:   s.username,
    email:      s.email,
    role:       s.role,
    is_active:  s.is_active ?? true,
    created_at: s.created_at,
    courses:    extraCourses,
  });

  const managers      = staff.filter((s) => s.role === "manager").map((s) => toMember(s));
  const receptionists = staff.filter((s) => s.role === "receptionist").map((s) => toMember(s));
  const contentTeam   = staff.filter((s) => s.role === "social_media").map((s) => toMember(s));
  const teachers      = teachersDb.map((t) =>
    toMember({ ...t, role: "teacher" }, (teacherCourseMap[t.id] ?? []).map((c) => ({
      id: c.id, title: c.title, mode: c.mode, is_published: c.is_published, price: c.price,
    })))
  );

  const total = managers.length + receptionists.length + teachers.length + contentTeam.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Staff</h2>
          <p>All team members across every role — {total} total</p>
        </div>
        <div className="sec-actions">
          <Link href="/dashboard/owner/team/new" className="btn-primary" style={{ textDecoration: "none" }}>
            <i className="fas fa-plus" /> Add Member
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { label: "Managers",      count: managers.length,      color: "var(--teal2)" },
          { label: "Receptionists", count: receptionists.length, color: "#3b82f6"      },
          { label: "Teachers",      count: teachers.length,      color: "#8b5cf6"      },
          { label: "Content Team",  count: contentTeam.length,   color: "var(--gold)"  },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: "120px",
            background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px",
            padding: "14px 16px", borderTop: `3px solid ${color}`,
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      <StaffTabsClient
        managers={managers}
        receptionists={receptionists}
        teachers={teachers}
        contentTeam={contentTeam}
      />
    </div>
  );
}
