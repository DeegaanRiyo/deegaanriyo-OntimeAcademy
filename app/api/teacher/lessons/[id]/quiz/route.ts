import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

// GET — fetch quiz for a lesson (if exists)
export async function GET(_req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("lesson_id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data); // null if no quiz
}

// POST — create or replace quiz for a lesson
export async function POST(req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { question, options, correct_index } = body;

  if (!question?.trim())       return NextResponse.json({ error: "Question is required" }, { status: 400 });
  if (!Array.isArray(options) || options.length < 2)
    return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
  if (typeof correct_index !== "number")
    return NextResponse.json({ error: "correct_index is required" }, { status: 400 });

  // Delete existing quiz first (one quiz per lesson)
  await supabase.from("quizzes").delete().eq("lesson_id", params.id);

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      lesson_id:     params.id,
      question:      question.trim(),
      options:       options.map((o: string) => o.trim()),
      correct_index: Number(correct_index),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE — remove quiz from lesson
export async function DELETE(_req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("quizzes").delete().eq("lesson_id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
