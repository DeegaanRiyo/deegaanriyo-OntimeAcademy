import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import CourseEditor from "@/components/dashboard/teacher/CourseEditor";

type Ctx = { params: { id: string } };

export default async function TeacherCourseDetailPage({ params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await serviceClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "teacher") redirect("/dashboard");

  const { data: course } = await supabase
    .from("courses")
    .select("*, lessons(*, quizzes(*))")
    .eq("id", params.id)
    .eq("teacher_id", user.id)
    .single();

  if (!course) notFound();

  // Sort lessons by order_index
  course.lessons = (course.lessons ?? []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );

  // Enrolment count
  const { count: enrolCount } = await supabase
    .from("enrolments").select("id", { count: "exact", head: true }).eq("course_id", params.id);

  return (
    <div>
      <CourseEditor course={course} enrolCount={enrolCount ?? 0} />
    </div>
  );
}
