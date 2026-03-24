// ─── POST /api/payments/mpesa/initiate ───────────────────────────────────────
// Triggers an M-Pesa STK Push for a course enrolment.
// Returns { checkoutRequestId } on success — front-end polls /status/[id].
// Returns { free: true } immediately for KES 0 courses (skips payment).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { initiateSTKPush } from "@/lib/daraja";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "student") {
    return NextResponse.json({ error: "Students only" }, { status: 403 });
  }

  const body = await req.json();
  const { course_id, phone } = body as { course_id?: string; phone?: string };
  if (!course_id || !phone) {
    return NextResponse.json({ error: "course_id and phone are required" }, { status: 400 });
  }

  // Verify the course exists and is published
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, price")
    .eq("id", course_id)
    .eq("is_published", true)
    .single();
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Free course — enrol directly, no payment needed
  if (course.price === 0) {
    const admin = serviceClient();
    await admin
      .from("enrolments")
      .upsert({ student_id: user.id, course_id }, { onConflict: "student_id,course_id" });
    return NextResponse.json({ free: true, course_id });
  }

  // Block duplicate enrolments
  const { data: alreadyEnrolled } = await supabase
    .from("enrolments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", course_id)
    .single();
  if (alreadyEnrolled) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }

  // Initiate STK Push
  let stkResult;
  try {
    stkResult = await initiateSTKPush(
      phone,
      course.price,
      "OntimeCourse",
      "CourseEnrolment"
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("STK PUSH ERROR:", msg);
    console.error("ENV CHECK — KEY:", !!process.env.DARAJA_CONSUMER_KEY, "SECRET:", !!process.env.DARAJA_CONSUMER_SECRET, "SHORTCODE:", process.env.DARAJA_SHORTCODE, "CALLBACK:", process.env.DARAJA_CALLBACK_URL);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Persist pending payment record (service role bypasses RLS)
  const admin = serviceClient();
  const { error: insertErr } = await admin.from("payments").insert({
    student_id:          user.id,
    course_id,
    amount:              course.price,
    phone,
    merchant_request_id: stkResult.MerchantRequestID,
    checkout_request_id: stkResult.CheckoutRequestID,
    status:              "pending",
  });
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    checkoutRequestId: stkResult.CheckoutRequestID,
    message: stkResult.CustomerMessage,
  });
}
