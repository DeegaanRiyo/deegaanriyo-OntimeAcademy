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
      profile_id:  string;   // existing member profile
      amount:      number;
      method:      "cash" | "bank_transfer";
      reference?:  string;
      notes?:      string;
    };

    const { profile_id, amount, method, reference, notes } = body;

    if (!profile_id || !amount || amount <= 0 || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch member info for customer details
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", profile_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { data: payment, error: payError } = await admin
      .from("walk_in_payments")
      .insert({
        type:           "membership",
        customer_name:  profile.full_name,
        customer_phone: profile.phone ?? "",
        customer_email: profile.email ?? null,
        profile_id,
        amount,
        method,
        reference:      reference?.trim() || null,
        notes:          notes?.trim() || null,
        recorded_by:    user.id,
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
