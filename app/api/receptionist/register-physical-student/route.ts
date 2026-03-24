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
      full_name:   string;
      phone:       string;
      email?:      string;
      class_name:  string;   // description of the physical class/course
      amount:      number;
      method:      "cash" | "bank_transfer";
      reference?:  string;
      notes?:      string;
    };

    const { full_name, phone, email, class_name, amount, method, reference, notes } = body;

    if (!full_name || !phone || !class_name || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    // Record walk-in payment — no auth account created (deferred to later)
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
        reference:       reference ?? null,
        notes:           notes
                           ? `Class: ${class_name}. ${notes}`
                           : `Class: ${class_name}`,
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
