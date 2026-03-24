import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

// GET — fetch single course with lessons
export async function GET(_req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("courses")
    .select("*, lessons(*, quizzes(*))")
    .eq("id", params.id)
    .eq("teacher_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH — update course details or toggle publish
export async function PATCH(req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.title         !== undefined) updates.title         = body.title.trim();
  if (body.description   !== undefined) updates.description   = body.description?.trim() || null;
  if (body.price         !== undefined) updates.price         = Number(body.price);
  if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url?.trim() || null;
  if (body.mode          !== undefined) updates.mode          = body.mode;
  if (body.is_published  !== undefined) updates.is_published  = Boolean(body.is_published);

  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", params.id)
    .eq("teacher_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — delete course (cascades to lessons + quizzes)
export async function DELETE(_req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", params.id)
    .eq("teacher_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
