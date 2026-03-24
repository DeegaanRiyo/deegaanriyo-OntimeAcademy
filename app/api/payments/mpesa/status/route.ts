// ─── GET /api/payments/mpesa/status?id=CHECKOUT_REQUEST_ID ───────────────────
// Front-end polls this every ~3 s after initiating an STK Push.
// Returns { status, course_id, mpesa_receipt_number }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("payments")
    .select("status, course_id, mpesa_receipt_number, failure_reason")
    .eq("checkout_request_id", id)
    .eq("student_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
