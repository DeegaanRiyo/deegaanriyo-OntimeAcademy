import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import EmptyState from "@/components/dashboard/EmptyState";

export default async function TeacherCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await serviceClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "teacher") redirect("/dashboard");

  const { data: courses } = await supabase
    .from("courses")
    .select("*, lessons(count)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>My Courses</h2>
          <p>Create and manage your Academy courses.</p>
        </div>
        <div className="sec-actions">
          <Link href="/dashboard/teacher/courses/new" className="btn-sm btn-primary">
            <i className="fas fa-plus" /> New Course
          </Link>
        </div>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="fas fa-graduation-cap"
            title="No courses yet"
            description="Create your first course to get started."
            action={
              <Link href="/dashboard/teacher/courses/new" className="btn-sm btn-primary" style={{ marginTop: "8px" }}>
                <i className="fas fa-plus" /> Create Course
              </Link>
            }
          />
        </div>
      ) : (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Mode</th>
                  <th>Price</th>
                  <th>Lessons</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course: any) => (
                  <tr key={course.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: ".85rem" }}>{course.title}</div>
                      <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "2px" }}>
                        {course.description?.slice(0, 60) || "No description"}…
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${course.mode === "online" ? "tl" : course.mode === "physical" ? "gd" : "pu"}`}>
                        {course.mode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {course.price > 0 ? `KES ${course.price.toLocaleString()}` : <span style={{ color: "var(--muted)" }}>Free</span>}
                    </td>
                    <td style={{ color: "var(--muted)" }}>
                      {course.lessons?.[0]?.count ?? 0} lessons
                    </td>
                    <td>
                      {course.is_published
                        ? <span className="badge gr"><span className="badge-dot" />Published</span>
                        : <span className="badge"><span className="badge-dot" />Draft</span>}
                    </td>
                    <td>
                      <div className="td-action">
                        <Link href={`/dashboard/teacher/courses/${course.id}`} className="act-btn" title="Manage">
                          <i className="fas fa-pencil-alt" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
