// ─── POST /api/payments/mpesa/callback ───────────────────────────────────────
// Daraja calls this URL after the customer completes (or cancels) the STK prompt.
// Must respond with { ResultCode: 0, ResultDesc: "Accepted" } to acknowledge.
// No authentication — Safaricom does not send auth headers. Keep URL secret via
// env var (DARAJA_CALLBACK_URL) so it's not publicly guessable.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" });
  }

  const stk = body?.Body?.stkCallback;
  if (!stk?.CheckoutRequestID) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Unexpected payload" });
  }

  const checkoutRequestId: string = stk.CheckoutRequestID;
  const resultCode: number        = stk.ResultCode;

  const supabase = serviceClient();

  // ── Failed / Cancelled ────────────────────────────────────
  if (resultCode !== 0) {
    // resultCode 1032 = user cancelled the request
    const status = resultCode === 1032 ? "cancelled" : "failed";
    await supabase
      .from("payments")
      .update({
        status,
        failure_reason: stk.ResultDesc ?? "Payment failed",
        updated_at: new Date().toISOString(),
      })
      .eq("checkout_request_id", checkoutRequestId);

    console.log(`[mpesa/callback] ${status}`, checkoutRequestId, stk.ResultDesc);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // ── Successful payment ────────────────────────────────────
  const items: { Name: string; Value: unknown }[] =
    stk.CallbackMetadata?.Item ?? [];
  const get = (name: string) =>
    items.find((i) => i.Name === name)?.Value as string | undefined;

  const mpesaReceiptNumber = get("MpesaReceiptNumber");

  // Update payment → paid
  const { data: payment, error: updateErr } = await supabase
    .from("payments")
    .update({
      status:               "paid",
      mpesa_receipt_number: mpesaReceiptNumber,
      updated_at:           new Date().toISOString(),
    })
    .eq("checkout_request_id", checkoutRequestId)
    .select("student_id, course_id")
    .single();

  if (updateErr || !payment) {
    console.error("[mpesa/callback] payment update failed", updateErr);
    // Still acknowledge Daraja — we can reconcile manually
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // Create enrolment (upsert — safe to retry)
  const { error: enrolErr } = await supabase
    .from("enrolments")
    .upsert(
      { student_id: payment.student_id, course_id: payment.course_id },
      { onConflict: "student_id,course_id" }
    );

  if (enrolErr) {
    console.error("[mpesa/callback] enrolment upsert failed", enrolErr);
  } else {
    console.log(
      "[mpesa/callback] enrolled",
      payment.student_id,
      "→ course",
      payment.course_id,
      "receipt:", mpesaReceiptNumber
    );
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
