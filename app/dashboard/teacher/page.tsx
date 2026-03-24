import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!user) return null;

  const { data: profile } = await serviceClient
    .from("profiles").select("role, full_name, email").eq("id", user.id).single();

  // Stats
  const { data: courses } = await supabase
    .from("courses").select("id, is_published").eq("teacher_id", user.id);

  const total     = courses?.length ?? 0;
  const published = courses?.filter((c) => c.is_published).length ?? 0;
  const drafts    = total - published;

  const courseIds = courses?.map((c) => c.id) ?? [];
  const { count: students } = courseIds.length > 0
    ? await supabase.from("enrolments").select("id", { count: "exact", head: true }).in("course_id", courseIds)
    : { count: 0 };

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon tl"><i className="fas fa-graduation-cap" /></div>
          </div>
          <div className="kpi-num">{total}</div>
          <div className="kpi-label">Total Courses</div>
          <div className="kpi-sub">{drafts} draft{drafts !== 1 ? "s" : ""}</div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon gr"><i className="fas fa-eye" /></div>
            {published > 0 && <div className="kpi-change up"><i className="fas fa-check" /> Live</div>}
          </div>
          <div className="kpi-num">{published}</div>
          <div className="kpi-label">Published</div>
          <div className="kpi-sub">Visible to students</div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon pu"><i className="fas fa-users" /></div>
          </div>
          <div className="kpi-num">{students ?? 0}</div>
          <div className="kpi-label">Enrolled Students</div>
          <div className="kpi-sub">Across all courses</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginTop: "8px" }}>
        <div className="card-head">
          <h3><i className="fas fa-bolt" /> Quick Actions</h3>
        </div>
        <div className="qa-grid">
          {[
            { href: "/dashboard/teacher/courses/new", icon: "fa-plus-circle", title: "Create Course", sub: "Start a new course" },
            { href: "/dashboard/teacher/courses",     icon: "fa-list",        title: "My Courses",    sub: "Manage all your courses" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="qa-item">
              <div className="kpi-icon tl"><i className={`fas ${a.icon}`} /></div>
              <div>
                <div className="qa-title">{a.title}</div>
                <div className="qa-sub">{a.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
