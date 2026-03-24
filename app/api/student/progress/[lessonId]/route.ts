import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { lessonId: string } };

// POST — mark a lesson as complete + optionally submit quiz answer
export async function POST(req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { course_id, quiz_id, selected_index } = body;

  if (!course_id) return NextResponse.json({ error: "course_id is required" }, { status: 400 });

  // Find enrolment
  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", course_id)
    .single();

  if (!enrolment) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

  // Upsert lesson progress
  const { error: progressError } = await supabase
    .from("lesson_progress")
    .upsert({
      enrolment_id: enrolment.id,
      lesson_id:    params.lessonId,
      completed:    true,
      completed_at: new Date().toISOString(),
    }, { onConflict: "enrolment_id,lesson_id" });

  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 });

  // Update last_accessed_at on enrolment
  await supabase
    .from("enrolments")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", enrolment.id);

  // Handle quiz answer if provided
  let quizResult: { is_correct: boolean } | null = null;
  if (quiz_id !== undefined && selected_index !== undefined) {
    const { data: quiz } = await supabase
      .from("quizzes").select("correct_index").eq("id", quiz_id).single();

    if (quiz) {
      const is_correct = Number(selected_index) === quiz.correct_index;
      await supabase
        .from("quiz_attempts")
        .upsert({
          student_id:     user.id,
          quiz_id,
          selected_index: Number(selected_index),
          is_correct,
        }, { onConflict: "student_id,quiz_id" });
      quizResult = { is_correct };
    }
  }

  return NextResponse.json({ success: true, quiz: quizResult });
}

// GET — get progress for a specific lesson
export async function GET(req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const course_id = searchParams.get("course_id");
  if (!course_id) return NextResponse.json({ error: "course_id required" }, { status: 400 });

  const { data: enrolment } = await supabase
    .from("enrolments").select("id").eq("student_id", user.id).eq("course_id", course_id).single();
  if (!enrolment) return NextResponse.json(null);

  const { data } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("enrolment_id", enrolment.id)
    .eq("lesson_id", params.lessonId)
    .maybeSingle();

  return NextResponse.json(data);
}
