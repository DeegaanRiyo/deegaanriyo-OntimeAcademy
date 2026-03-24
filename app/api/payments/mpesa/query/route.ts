// ─── POST /api/payments/mpesa/query ──────────────────────────────────────────
// Directly queries Safaricom for the latest status of a pending STK Push.
//
// WHY THIS EXISTS:
//   In sandbox (and any env where the callback URL isn't publicly reachable),
//   Safaricom can't POST to our callback endpoint. Payments stay "pending" in the
//   DB forever. This route lets the client ask Safaricom directly: "did it succeed?"
//   and update the DB + create the enrolment itself — no callback needed.
//
// USAGE:
//   Client alternates between:
//     - Every 3s: GET /api/payments/mpesa/status?id=X  (check DB)
//     - Every 6s: POST /api/payments/mpesa/query       (ask Safaricom)

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { querySTKStatus } from "@/lib/daraja";

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

  const { checkout_request_id } = await req.json() as { checkout_request_id?: string };
  if (!checkout_request_id) {
    return NextResponse.json({ error: "checkout_request_id is required" }, { status: 400 });
  }

  // Verify this payment belongs to the authenticated student
  const { data: payment } = await supabase
    .from("payments")
    .select("id, student_id, course_id, status")
    .eq("checkout_request_id", checkout_request_id)
    .eq("student_id", user.id)
    .single();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Already in a terminal state — no need to query Safaricom
  if (payment.status !== "pending") {
    return NextResponse.json({ status: payment.status });
  }

  // Ask Safaricom directly
  let result;
  try {
    result = await querySTKStatus(checkout_request_id);
  } catch (err) {
    // Safaricom query failed (network, bad creds, etc.) — return current DB status
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mpesa/query] STK query error:", msg);
    return NextResponse.json({ status: "pending", query_error: msg });
  }

  const resultCode = String(result.ResultCode);

  // ── Still processing ──────────────────────────────────────
  // ResultDesc "The transaction is being processed" or similar
  if (resultCode !== "0" && resultCode !== "1032") {
    // Could be pending or an error code — don't update DB yet
    return NextResponse.json({ status: "pending", result_desc: result.ResultDesc });
  }

  const admin = serviceClient();

  // ── Cancelled ─────────────────────────────────────────────
  if (resultCode === "1032") {
    await admin
      .from("payments")
      .update({ status: "cancelled", failure_reason: result.ResultDesc, updated_at: new Date().toISOString() })
      .eq("checkout_request_id", checkout_request_id);

    return NextResponse.json({ status: "cancelled", result_desc: result.ResultDesc });
  }

  // ── Paid (ResultCode === "0") ─────────────────────────────
  await admin
    .from("payments")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("checkout_request_id", checkout_request_id);

  // Create enrolment (upsert — idempotent)
  const { error: enrolErr } = await admin
    .from("enrolments")
    .upsert(
      { student_id: payment.student_id, course_id: payment.course_id },
      { onConflict: "student_id,course_id" }
    );

  if (enrolErr) {
    console.error("[mpesa/query] enrolment upsert failed:", enrolErr.message);
  } else {
    console.log("[mpesa/query] enrolled", payment.student_id, "→", payment.course_id);
  }

  return NextResponse.json({ status: "paid" });
}
