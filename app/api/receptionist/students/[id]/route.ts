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

/** PATCH — receptionist updates course_name OR records a balance payment */
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

    if (!["receptionist", "admin", "owner", "manager"].includes(caller?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      course_name?:   string | null;
      settle_amount?: number;
    };

    // ── Record a balance payment ──────────────────────────────────────────────
    if (body.settle_amount != null) {
      const amt = Number(body.settle_amount);
      if (!amt || amt <= 0) {
        return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
      }

      // Fetch current amount to add to it
      const { data: reg, error: fetchErr } = await admin
        .from("student_registrations")
        .select("amount, total_due")
        .eq("id", id)
        .single();

      if (fetchErr || !reg) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 });
      }

      const newAmount = (reg.amount ?? 0) + amt;

      const { error: updateErr } = await admin
        .from("student_registrations")
        .update({ amount: newAmount })
        .eq("id", id);

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      return NextResponse.json({ success: true, new_amount: newAmount });
    }

    // ── Update course name ────────────────────────────────────────────────────
    const { error } = await admin
      .from("student_registrations")
      .update({ course_name: body.course_name ?? null })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
