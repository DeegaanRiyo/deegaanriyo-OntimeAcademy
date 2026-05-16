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

const DEFAULT_MEMBERSHIP_FEE = 7500; // KES — fallback for records without membership_fee stored

/** Extracts "Python Bootcamp" from notes stored as "Class: Python Bootcamp. ..." */
function extractClassName(notes: string | null): string {
  if (!notes) return "";
  const match = notes.match(/^Class:\s*([^.]+)/);
  return match ? match[1].trim() : "";
}

/** Extracts a named key from structured notes, e.g. "student_type=new" → "new" */
function extractMeta(notes: string | null, key: string): string | null {
  if (!notes) return null;
  const match = notes.match(new RegExp(`${key}=([^.\\s]+)`));
  return match ? match[1].trim() : null;
}

function extractMetaNumber(notes: string | null, key: string): number {
  const v = extractMeta(notes, key);
  return v ? Number(v) : 0;
}

export async function GET() {
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

    // Fetch all walk-in payments (membership + physical_class)
    // We fetch the FIRST (earliest) payment per unique person as the "registration" record
    const { data: payments, error } = await admin
      .from("walk_in_payments")
      .select("id, type, customer_name, customer_phone, customer_email, profile_id, membership_fee, amount, method, reference, notes, created_at")
      .in("type", ["membership", "physical_class"])
      .order("created_at", { ascending: true }); // oldest first so we get the registration record first

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // De-duplicate: one entry per profile_id (members) or phone (physical students)
    // Keep the earliest as the "main" record; sum all payments
    const memberMap = new Map<string, any>();
    const allPaymentsByKey = new Map<string, number>(); // key → total paid

    for (const p of payments ?? []) {
      const key = p.profile_id ?? `phone:${p.customer_phone}`;
      // Track total paid per person
      allPaymentsByKey.set(key, (allPaymentsByKey.get(key) ?? 0) + (p.amount ?? 0));
      // First occurrence = registration record
      if (!memberMap.has(key)) memberMap.set(key, p);
    }

    // Fetch subscription info for member profile_ids
    const memberIds = Array.from(memberMap.values())
      .filter((p) => p.profile_id)
      .map((p) => p.profile_id);

    let subMap: Record<string, { start: string; end: string }> = {};
    if (memberIds.length > 0) {
      const { data: members } = await admin
        .from("members")
        .select("id, subscription_start, subscription_end")
        .in("id", memberIds);

      for (const m of members ?? []) {
        subMap[m.id] = { start: m.subscription_start, end: m.subscription_end };
      }
    }

    // For members: compute period_paid = sum of payments since sub_start
    // Fetch all membership payments per profile_id since sub_start
    let periodPaidMap: Record<string, number> = {};
    if (memberIds.length > 0) {
      const { data: periodPayments } = await admin
        .from("walk_in_payments")
        .select("profile_id, amount, created_at")
        .eq("type", "membership")
        .in("profile_id", memberIds);

      for (const p of periodPayments ?? []) {
        if (!p.profile_id) continue;
        const sub = subMap[p.profile_id];
        if (!sub) continue;
        // Only count payments within the current subscription period
        if (p.created_at >= sub.start) {
          periodPaidMap[p.profile_id] = (periodPaidMap[p.profile_id] ?? 0) + (p.amount ?? 0);
        }
      }
    }

    const result = Array.from(memberMap.values()).map((p) => {
      const key           = p.profile_id ?? `phone:${p.customer_phone}`;
      const totalPaid     = allPaymentsByKey.get(key) ?? p.amount;
      const agreedFee     = p.membership_fee ?? DEFAULT_MEMBERSHIP_FEE;

      let due_date:    string | null = null;
      let sub_start:   string | null = null;
      let period_paid: number        = totalPaid;
      let outstanding: number        = 0;

      if (p.profile_id && subMap[p.profile_id]) {
        due_date    = subMap[p.profile_id].end;
        sub_start   = subMap[p.profile_id].start;
        period_paid = periodPaidMap[p.profile_id] ?? totalPaid;
        outstanding = Math.max(0, agreedFee - period_paid);
      } else if (p.type === "membership") {
        const d = new Date(p.created_at);
        d.setDate(d.getDate() + 30);
        due_date    = d.toISOString().slice(0, 10);
        sub_start   = p.created_at.slice(0, 10);
        period_paid = totalPaid;
        outstanding = Math.max(0, agreedFee - period_paid);
      }

      const isPhysical = p.type === "physical_class";
      return {
        id:                  p.id,
        type:                p.type,
        name:                p.customer_name,
        phone:               p.customer_phone,
        email:               p.customer_email,
        profile_id:          p.profile_id,
        membership_fee:      agreedFee,
        amount:              p.amount,
        total_paid:          totalPaid,
        period_paid,
        outstanding,
        method:              p.method,
        reference:           p.reference,
        notes:               p.notes,
        class_name:          isPhysical ? extractClassName(p.notes) : null,
        student_type:        isPhysical ? (extractMeta(p.notes, "student_type") ?? "new") : null,
        course_fee_monthly:  isPhysical ? extractMetaNumber(p.notes, "monthly") : null,
        registration_fee:    isPhysical ? extractMetaNumber(p.notes, "reg_fee") : null,
        total_due:           isPhysical ? extractMetaNumber(p.notes, "total_due") : null,
        cash_amount:         isPhysical ? extractMetaNumber(p.notes, "cash") : null,
        mpesa_amount:        isPhysical ? extractMetaNumber(p.notes, "mpesa") : null,
        mpesa_reference:     isPhysical ? extractMeta(p.notes, "mpesa_ref") : null,
        joined_at:           isPhysical ? (extractMeta(p.notes, "joined_at") ?? p.created_at) : null,
        payment_date:        p.created_at,
        sub_start,
        due_date,
      };
    });

    // Sort result: outstanding first, then by created_at desc
    result.sort((a, b) => {
      if (a.outstanding > 0 && b.outstanding === 0) return -1;
      if (a.outstanding === 0 && b.outstanding > 0) return 1;
      return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
    });

    return NextResponse.json({ members: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
