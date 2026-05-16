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

/** PATCH /api/receptionist/walk-in-payments/[id]
 *  Updates a physical_class payment record — used by the Edit Student modal
 *  to correct category, fees, payment amount/method, and personal info.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = serviceClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "admin", "owner"].includes(caller?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      full_name?:           string;
      phone?:               string;
      email?:               string | null;
      class_name?:          string;
      student_type?:        "new" | "returning";
      course_fee_monthly?:  number;
      registration_fee?:    number;
      total_due?:           number;
      amount?:              number;
      method?:              "cash" | "mpesa" | "both";
      cash_amount?:         number;
      mpesa_amount?:        number;
      mpesa_reference?:     string;
      notes?:               string;
    };

    // Fetch current record so we can preserve fields we're not changing
    const { data: current, error: fetchErr } = await admin
      .from("walk_in_payments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const class_name         = body.class_name         ?? current.class_name         ?? "";
    const student_type       = body.student_type        ?? "new";
    const course_fee_monthly = body.course_fee_monthly  ?? 0;
    const registration_fee   = body.registration_fee    ?? 0;
    const total_due          = body.total_due            ?? 0;
    const method             = body.method               ?? current.method;
    const amount             = body.amount               ?? current.amount;
    const mpesa_reference    = body.mpesa_reference      ?? current.reference ?? "";
    const cash_amount        = body.cash_amount          ?? 0;
    const mpesa_amount       = body.mpesa_amount         ?? 0;
    const userNotes          = body.notes                ?? "";

    // Rebuild structured notes string
    const metaParts: string[] = [
      `Class: ${class_name}`,
      `student_type=${student_type}`,
      `monthly=${course_fee_monthly}`,
      `reg_fee=${registration_fee}`,
      `total_due=${total_due}`,
    ];

    if (method === "both") {
      metaParts.push(`cash=${cash_amount}`);
      metaParts.push(`mpesa=${mpesa_amount}`);
    }

    if (mpesa_reference) {
      metaParts.push(`mpesa_ref=${mpesa_reference}`);
    }

    const notesString = userNotes
      ? `${metaParts.join(". ")}. ${userNotes}`
      : metaParts.join(". ");

    const updates: Record<string, unknown> = {
      notes:     notesString,
      amount,
      method,
      reference: mpesa_reference || null,
    };

    if (body.full_name !== undefined) updates.customer_name  = body.full_name;
    if (body.phone     !== undefined) updates.customer_phone = body.phone;
    if (body.email     !== undefined) updates.customer_email = body.email;

    const { error: updateErr } = await admin
      .from("walk_in_payments")
      .update(updates)
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
