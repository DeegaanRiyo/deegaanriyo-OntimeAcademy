import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

// GET — list lessons for a course
export async function GET(_req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("lessons")
    .select("*, quizzes(*)")
    .eq("course_id", params.id)
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — add a lesson to a course
export async function POST(req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify course ownership
  const { data: course } = await supabase
    .from("courses").select("id").eq("id", params.id).eq("teacher_id", user.id).single();
  if (!course) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, video_url } = body;
  if (!title?.trim())     return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!video_url?.trim()) return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });

  // Get next order_index
  const { count } = await supabase
    .from("lessons").select("*", { count: "exact", head: true }).eq("course_id", params.id);

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      course_id:   params.id,
      title:       title.trim(),
      vimeo_url:   video_url.trim(),   // column is vimeo_url in DB; stores YouTube URL
      order_index: (count ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
