import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — list all courses for the authenticated teacher
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("courses")
    .select("*, lessons(count)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create a new course
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = getServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (!["teacher", "admin", "owner"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title, description, price, thumbnail_url, mode,
    category, level, duration, outcomes, prerequisites,
    language, max_students, has_certificate,
  } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  // Generate slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    + "-" + Date.now().toString(36);

  const { data, error } = await supabase
    .from("courses")
    .insert({
      teacher_id:      user.id,
      title:           title.trim(),
      slug,
      description:     description?.trim() || null,
      price:           Number(price) || 0,
      thumbnail_url:   thumbnail_url?.trim() || null,
      mode:            mode || "online",
      is_published:    false,
      category:        category?.trim() || null,
      level:           level || null,
      duration:        duration?.trim() || null,
      outcomes:        outcomes?.trim() || null,
      prerequisites:   prerequisites?.trim() || null,
      language:        language?.trim() || "English",
      max_students:    max_students ? Number(max_students) : null,
      has_certificate: has_certificate ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error("CREATE COURSE ERROR:", JSON.stringify(error));
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
