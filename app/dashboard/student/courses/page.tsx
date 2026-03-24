import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/dashboard/EmptyState";

export default async function StudentCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "student") redirect("/dashboard");

  const { data: enrolments } = await supabase
    .from("enrolments")
    .select("id, enrolled_at, last_accessed_at, courses(id, title, slug, mode, thumbnail_url, price, is_published, lessons(count))")
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false });

  const enrolled = enrolments ?? [];

  // Get completed lessons per enrolment
  const enrolIds = enrolled.map((e) => e.id);
  let completedMap: Record<string, number> = {};
  if (enrolIds.length > 0) {
    const { data: prog } = await supabase
      .from("lesson_progress")
      .select("enrolment_id")
      .in("enrolment_id", enrolIds)
      .eq("completed", true);
    (prog ?? []).forEach((p: any) => {
      completedMap[p.enrolment_id] = (completedMap[p.enrolment_id] ?? 0) + 1;
    });
  }

  const modeLabel: Record<string, string> = { online: "Online", physical: "Physical", hybrid: "Hybrid" };
  const modeBadge: Record<string, string> = { online: "tl", physical: "gd", hybrid: "gr" };

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>My Courses</h2>
          <p>All courses you are enrolled in</p>
        </div>
        <div className="sec-actions">
          <Link href="/courses" className="btn-sm btn-primary">
            <i className="fas fa-search" /> Browse Courses
          </Link>
        </div>
      </div>

      {enrolled.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="fas fa-graduation-cap"
            title="No courses yet"
            description="You haven't enrolled in any courses yet."
            padding="64px 20px"
            action={
              <Link href="/courses" className="btn-sm btn-primary" style={{ marginTop: "8px" }}>
                <i className="fas fa-search" /> Browse Courses
              </Link>
            }
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "18px" }}>
          {enrolled.map((e: any) => {
            const course = e.courses;
            if (!course) return null;
            const totalLessons = course.lessons?.[0]?.count ?? 0;
            const completedLessons = completedMap[e.id] ?? 0;
            const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return (
              <Link key={e.id} href={`/dashboard/student/courses/${course.id}`}
                style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card" style={{ cursor: "pointer", transition: "all .3s", height: "100%" }}>
                  {/* Thumbnail / Header */}
                  <div style={{
                    height: 140, borderRadius: "12px 12px 0 0", overflow: "hidden",
                    background: course.thumbnail_url
                      ? `url(${course.thumbnail_url}) center/cover no-repeat`
                      : "linear-gradient(135deg,var(--teal),var(--teal2))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {!course.thumbnail_url && (
                      <i className="fas fa-play-circle" style={{ fontSize: "2.8rem", color: "rgba(255,255,255,.6)" }} />
                    )}
                  </div>

                  <div style={{ padding: "16px 18px 18px" }}>
                    {/* Mode badge */}
                    <span className={`badge ${modeBadge[course.mode] ?? "tl"}`} style={{ marginBottom: "8px", display: "inline-block" }}>
                      {modeLabel[course.mode] ?? course.mode}
                    </span>

                    <div style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: "6px", lineHeight: 1.35 }}>
                      {course.title}
                    </div>

                    <div style={{ fontSize: ".7rem", color: "var(--muted)", marginBottom: "14px" }}>
                      {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                      {e.last_accessed_at && ` · Last accessed ${new Date(e.last_accessed_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`}
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".68rem", color: "var(--muted)", marginBottom: "4px" }}>
                        <span>{completedLessons}/{totalLessons} lessons</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 999,
                          width: `${pct}%`,
                          background: pct === 100 ? "var(--green)" : "var(--teal)",
                          transition: "width .4s",
                        }} />
                      </div>
                    </div>

                    {pct === 100 && (
                      <div style={{ marginTop: "10px", fontSize: ".72rem", color: "var(--green)", fontWeight: 600 }}>
                        <i className="fas fa-check-circle" /> Completed
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
