import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "admin", "owner", "manager"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      student_type:        "new" | "current_old" | "zoom_virtual";
      customer_name:       string;
      customer_phone:      string;
      customer_email?:     string;
      joined_date?:        string;   // YYYY-MM-DD
      class_time?:         string;   // HH:MM (24-hr)
      course_name?:        string;
      course_fee_monthly?: number;
      registration_fee?:   number;
      total_due?:          number;
      amount:              number;           // amount paid now
      method:              "cash" | "mpesa" | "bank_transfer" | "both";
      reference?:          string;
      notes?:              string;
      teachers?:           { name: string; subject: string }[];
    };

    const {
      student_type, customer_name, customer_phone, customer_email,
      joined_date, class_time,
      course_name,
      course_fee_monthly, registration_fee, total_due,
      amount, method, reference, notes, teachers,
    } = body;

    if (!student_type || !customer_name || !customer_phone || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("student_registrations")
      .insert({
        student_type,
        customer_name,
        customer_phone,
        customer_email:      customer_email      ?? null,
        joined_date:         joined_date         ?? null,
        class_time:          class_time          ?? null,
        course_name:         course_name         ?? null,
        course_fee_monthly:  course_fee_monthly  ?? null,
        registration_fee:    registration_fee    ?? null,
        total_due:           total_due           ?? null,
        amount,
        method,
        reference:           reference           ?? null,
        notes:               notes               ?? null,
        teachers:            teachers && teachers.length > 0 ? teachers : null,
        recorded_by:         user.id,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, registration_id: data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
