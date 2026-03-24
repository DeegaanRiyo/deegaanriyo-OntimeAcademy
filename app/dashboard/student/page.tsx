import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/dashboard/EmptyState";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name, email").eq("id", user.id).single();
  if (profile?.role !== "student") redirect("/dashboard");

  // Enrolments with course info
  const { data: enrolments } = await supabase
    .from("enrolments")
    .select("id, enrolled_at, last_accessed_at, courses(id, title, slug, mode, thumbnail_url, lessons(count))")
    .eq("student_id", user.id)
    .order("last_accessed_at", { ascending: false, nullsFirst: false });

  const enrolled = enrolments ?? [];

  // Progress: completed lessons across all enrolments
  const enrolIds = enrolled.map((e) => e.id);
  const { count: completedLessons } = enrolIds.length > 0
    ? await supabase.from("lesson_progress").select("id", { count: "exact", head: true })
        .in("enrolment_id", enrolIds).eq("completed", true)
    : { count: 0 };

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon tl"><i className="fas fa-graduation-cap" /></div>
          </div>
          <div className="kpi-num">{enrolled.length}</div>
          <div className="kpi-label">Enrolled Courses</div>
          <div className="kpi-sub">Your active learning</div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon gr"><i className="fas fa-check-circle" /></div>
          </div>
          <div className="kpi-num">{completedLessons ?? 0}</div>
          <div className="kpi-label">Lessons Completed</div>
          <div className="kpi-sub">Keep going!</div>
        </div>
      </div>

      {/* Recent courses */}
      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-book-open" /> My Courses</h3>
          <Link href="/dashboard/student/courses" className="card-link">View all →</Link>
        </div>

        {enrolled.length === 0 ? (
          <EmptyState
            icon="fas fa-graduation-cap"
            title="No courses yet"
            description="You haven't enrolled in any courses yet."
            padding="48px 20px"
            action={
              <Link href="/courses" className="btn-sm btn-primary" style={{ marginTop: "8px" }}>
                <i className="fas fa-search" /> Browse Courses
              </Link>
            }
          />
        ) : (
          <div className="feed-list">
            {enrolled.slice(0, 5).map((e: any) => {
              const course = e.courses;
              if (!course) return null;
              return (
                <Link key={e.id} href={`/dashboard/student/courses/${course.id}`} className="feed-row" style={{ textDecoration: "none" }}>
                  <div className="kpi-icon tl">
                    <i className="fas fa-play" />
                  </div>
                  <div className="feed-text">
                    <div className="feed-name">{course.title}</div>
                    <div className="feed-meta">
                      {course.lessons?.[0]?.count ?? 0} lessons
                      {e.last_accessed_at && ` · Last accessed ${new Date(e.last_accessed_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`}
                    </div>
                  </div>
                  <i className="fas fa-chevron-right feed-time" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
