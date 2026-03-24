import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CoursePlayer from "@/components/dashboard/student/CoursePlayer";

type Ctx = { params: { id: string } };

export default async function StudentCoursePlayerPage({ params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "student") redirect("/dashboard");

  // Course with lessons + quizzes
  const { data: course } = await supabase
    .from("courses")
    .select("*, lessons(*, quizzes(*))")
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  if (!course) notFound();

  course.lessons = (course.lessons ?? []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );

  // Enrolment
  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", params.id)
    .single();

  if (!enrolment) {
    // Not enrolled — redirect to courses page with the course highlighted
    redirect(`/courses/${course.slug ?? params.id}`);
  }

  // Lesson progress for this enrolment
  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("enrolment_id", enrolment.id);

  const progressMap: Record<string, boolean> = {};
  (progressRows ?? []).forEach((p: any) => {
    progressMap[p.lesson_id] = p.completed;
  });

  // Quiz attempts for this student
  const lessonIds = course.lessons.map((l: any) => l.id);
  const quizIds: string[] = [];
  course.lessons.forEach((l: any) => {
    if (l.quizzes?.length > 0) quizIds.push(l.quizzes[0].id);
  });

  let attemptMap: Record<string, { selected_index: number; is_correct: boolean }> = {};
  if (quizIds.length > 0) {
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, selected_index, is_correct")
      .eq("student_id", user.id)
      .in("quiz_id", quizIds);
    (attempts ?? []).forEach((a: any) => {
      attemptMap[a.quiz_id] = { selected_index: a.selected_index, is_correct: a.is_correct };
    });
  }

  return (
    <CoursePlayer
      course={course}
      enrolmentId={enrolment.id}
      progressMap={progressMap}
      attemptMap={attemptMap}
    />
  );
}
