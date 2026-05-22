import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

const MEMBERSHIP_FEE = 7500;

// GET /api/receptionist/members
// Returns all co-working members with subscription + payment summary
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = serviceClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "owner", "manager", "admin"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. All members rows (only real subscribers) + joined profile fields
    const { data: membersData, error: membersErr } = await admin
      .from("members")
      .select("id, is_active, subscription_start, subscription_end, profession, profile:profiles!members_id_fkey(id, full_name, email, phone)")
      .order("created_at", { ascending: false });

    if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 });

    // 2. All membership payments (most recent first)
    const { data: payments, error: paymentsErr } = await admin
      .from("membership_payments")
      .select("id, profile_id, amount, method, reference, created_at, recorded_by")
      .order("created_at", { ascending: false });

    if (paymentsErr) return NextResponse.json({ error: paymentsErr.message }, { status: 500 });

    // 3. Resolve recorder names
    const recorderIds = [...new Set((payments ?? []).map((p) => p.recorded_by).filter(Boolean))];
    const recorderNames: Record<string, string> = {};
    if (recorderIds.length > 0) {
      const { data: recProfiles } = await admin
        .from("profiles").select("id, full_name").in("id", recorderIds);
      for (const r of recProfiles ?? []) recorderNames[r.id] = r.full_name;
    }

    // 4. Group payments by profile_id — member.id IS the profile UUID
    const paymentsByProfile: Record<string, any[]> = {};
    for (const p of payments ?? []) {
      if (!paymentsByProfile[p.profile_id]) paymentsByProfile[p.profile_id] = [];
      paymentsByProfile[p.profile_id].push(p);
    }

    // 5. Build member rows
    const members = (membersData ?? []).map((m: any) => {
      const p: any             = m.profile ?? {};
      const profilePayments: any[] = paymentsByProfile[m.id] ?? [];

      // Payments since the current subscription start
      const subStart = m.subscription_start ?? null;
      const periodPayments = subStart
        ? profilePayments.filter((pay) => pay.created_at.slice(0, 10) >= subStart)
        : profilePayments;

      const periodPaid  = periodPayments.reduce((s: number, pay: any) => s + (pay.amount ?? 0), 0);
      const totalPaid   = profilePayments.reduce((s: number, pay: any) => s + (pay.amount ?? 0), 0);
      const outstanding = Math.max(0, MEMBERSHIP_FEE - periodPaid);

      const latestPayment = profilePayments[0] ?? null;

      const recordedById = latestPayment?.recorded_by ?? null;
      return {
        id:                 m.id,
        name:               p.full_name ?? "",
        phone:              p.phone     ?? "",
        email:              p.email     ?? null,
        profile_id:         m.id,
        profession:         m.profession ?? null,
        amount:             MEMBERSHIP_FEE,
        total_paid:         totalPaid,
        period_paid:        periodPaid,
        outstanding,
        method:             latestPayment?.method ?? "cash",
        reference:          latestPayment?.reference ?? null,
        notes:              null,
        payment_date:       subStart ?? latestPayment?.created_at?.slice(0, 10) ?? "",
        sub_start:          subStart,
        due_date:           m.subscription_end ?? null,
        recorded_by_name:   recordedById ? (recorderNames[recordedById] ?? null) : null,
        payment_created_at: latestPayment?.created_at ?? null,
      };
    });

    return NextResponse.json({ members });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
