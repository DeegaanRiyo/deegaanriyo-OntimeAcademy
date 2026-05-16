import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = serviceClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "admin", "owner"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      full_name:           string;
      phone:               string;
      email?:              string;
      class_name:          string;
      student_type?:       "new" | "returning";
      course_fee_monthly?: number;
      registration_fee?:   number;
      total_due?:          number;
      amount:              number;   // total amount actually paid
      method:              "cash" | "mpesa" | "both";
      cash_amount?:        number;   // used when method = "both"
      mpesa_amount?:       number;   // used when method = "both"
      mpesa_reference?:    string;   // M-Pesa transaction code
      notes?:              string;
    };

    const {
      full_name, phone, email, class_name,
      student_type = "new",
      course_fee_monthly = 0,
      registration_fee = 0,
      total_due = 0,
      amount, method,
      cash_amount, mpesa_amount, mpesa_reference,
      notes,
    } = body;

    if (!full_name || !phone || !class_name || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    // Build a structured notes string that encodes all the extra fields
    // so they can be parsed back by the list API
    const metaParts: string[] = [
      `Class: ${class_name}`,
      `student_type=${student_type}`,
      `monthly=${course_fee_monthly}`,
      `reg_fee=${registration_fee}`,
      `total_due=${total_due}`,
    ];

    if (method === "both") {
      metaParts.push(`cash=${cash_amount ?? 0}`);
      metaParts.push(`mpesa=${mpesa_amount ?? 0}`);
    }

    if (mpesa_reference) {
      metaParts.push(`mpesa_ref=${mpesa_reference}`);
    }

    const notesString = notes
      ? `${metaParts.join(". ")}. ${notes}`
      : metaParts.join(". ");

    // Normalise method for storage: "both" stored as "both", mpesa as "mpesa"
    const { data: payment, error: payError } = await admin
      .from("walk_in_payments")
      .insert({
        type:            "physical_class",
        customer_name:   full_name,
        customer_phone:  phone,
        customer_email:  email ?? null,
        profile_id:      null,
        amount,
        method,
        reference:       mpesa_reference ?? null,
        notes:           notesString,
        recorded_by:     user.id,
      })
      .select("id")
      .single();

    if (payError) {
      return NextResponse.json({ error: payError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, payment_id: payment.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
