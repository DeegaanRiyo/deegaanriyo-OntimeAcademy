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

// GET — walk-in payments visible to the current user based on role:
//   receptionist → their own payments only
//   manager / owner → all payments (used separately on their dashboards)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = serviceClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    const role = caller?.role;
    if (!["receptionist", "manager", "owner", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let query = admin
      .from("walk_in_payments")
      .select("id, type, customer_name, customer_phone, amount, method, reference, notes, created_at")
      .gte("created_at", monthStart)
      .order("created_at", { ascending: false });

    // Receptionist only sees what they recorded
    if (role === "receptionist") {
      query = query.eq("recorded_by", user.id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ payments: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = serviceClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "manager", "owner", "admin"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      type, customer_name, customer_phone, amount, method, reference,
      cash_amount, mpesa_amount, notes: userNotes
    } = body;

    if (!type || !customer_name || !customer_phone || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build structured notes for split payment if applicable
    let metaParts: string[] = [];
    if (method === "both") {
      metaParts.push(`cash=${cash_amount ?? 0}`);
      metaParts.push(`mpesa=${mpesa_amount ?? 0}`);
      if (reference) metaParts.push(`mpesa_ref=${reference}`);
    }

    const notesString = userNotes
      ? (metaParts.length ? `${metaParts.join(". ")}. ${userNotes}` : userNotes)
      : metaParts.join(". ");

    const { data, error } = await admin
      .from("walk_in_payments")
      .insert({
        type,
        customer_name,
        customer_phone,
        amount,
        method,
        reference,
        notes: notesString || null,
        recorded_by: user.id
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
