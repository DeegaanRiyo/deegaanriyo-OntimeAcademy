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

    // 1. All member profiles with their subscription row
    const { data: profiles, error: profilesErr } = await admin
      .from("profiles")
      .select("id, full_name, email, phone, members(is_active, subscription_start, subscription_end)")
      .eq("role", "member")
      .order("created_at", { ascending: false });

    if (profilesErr) return NextResponse.json({ error: profilesErr.message }, { status: 500 });

    // 2. All membership payments (most recent first)
    const { data: payments, error: paymentsErr } = await admin
      .from("membership_payments")
      .select("id, profile_id, amount, method, reference, created_at")
      .order("created_at", { ascending: false });

    if (paymentsErr) return NextResponse.json({ error: paymentsErr.message }, { status: 500 });

    // 3. Group payments by profile
    const paymentsByProfile: Record<string, any[]> = {};
    for (const p of payments ?? []) {
      if (!paymentsByProfile[p.profile_id]) paymentsByProfile[p.profile_id] = [];
      paymentsByProfile[p.profile_id].push(p);
    }

    // 4. Build member rows
    const members = (profiles ?? []).map((profile: any) => {
      const sub = Array.isArray(profile.members) ? profile.members[0] : profile.members;
      const profilePayments: any[] = paymentsByProfile[profile.id] ?? [];

      // Payments since the current subscription start
      const subStart = sub?.subscription_start ?? null;
      const periodPayments = subStart
        ? profilePayments.filter((p) => p.created_at.slice(0, 10) >= subStart)
        : profilePayments;

      const periodPaid  = periodPayments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
      const totalPaid   = profilePayments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
      const outstanding = Math.max(0, MEMBERSHIP_FEE - periodPaid);

      const latestPayment = profilePayments[0] ?? null;

      return {
        id:           profile.id,
        name:         profile.full_name,
        phone:        profile.phone ?? "",
        email:        profile.email ?? null,
        profile_id:   profile.id,
        amount:       MEMBERSHIP_FEE,
        total_paid:   totalPaid,
        period_paid:  periodPaid,
        outstanding,
        method:       latestPayment?.method ?? "cash",
        reference:    latestPayment?.reference ?? null,
        notes:        null,
        payment_date: subStart ?? latestPayment?.created_at?.slice(0, 10) ?? "",
        sub_start:    subStart,
        due_date:     sub?.subscription_end ?? null,
      };
    });

    return NextResponse.json({ members });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
