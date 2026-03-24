import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST — enrol student in a course
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { course_id } = await req.json();
  if (!course_id) return NextResponse.json({ error: "course_id is required" }, { status: 400 });

  // Verify course exists and is published
  const { data: course } = await supabase
    .from("courses").select("id, title, price").eq("id", course_id).eq("is_published", true).single();
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Paid courses must go through the M-Pesa payment flow
  // (the callback auto-creates the enrolment after payment is confirmed)
  if (course.price > 0) {
    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", course_id)
      .eq("status", "paid")
      .single();
    if (!payment) {
      return NextResponse.json(
        { error: "Payment required. Use /api/payments/mpesa/initiate to pay." },
        { status: 402 }
      );
    }
  }

  // Upsert enrolment (safe to call again if already enrolled)
  const { data, error } = await supabase
    .from("enrolments")
    .upsert({ student_id: user.id, course_id }, { onConflict: "student_id,course_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// GET — list student's enrolments
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("enrolments")
    .select("*, courses(id, title, slug, thumbnail_url, mode, lessons(count))")
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
