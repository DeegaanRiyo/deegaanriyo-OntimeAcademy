import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic"; // never cache — walk-in data changes frequently

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

const DEFAULT_MEMBERSHIP_FEE = 7500;

function extractClassName(notes: string | null): string {
  if (!notes) return "";
  const match = notes.match(/^Class:\s*([^.]+)/);
  return match ? match[1].trim() : "";
}

function extractMeta(notes: string | null, key: string): string | null {
  if (!notes) return null;
  const match = notes.match(new RegExp(`${key}=([^.\\s]+)`));
  return match ? match[1].trim() : null;
}

function extractMetaNumber(notes: string | null, key: string): number {
  const v = extractMeta(notes, key);
  return v ? Number(v) : 0;
}

// A registration record carries joined_at or total_due in its notes
function isRegistrationRecord(notes: string | null): boolean {
  return extractMeta(notes, "joined_at") !== null || extractMeta(notes, "total_due") !== null;
}

// Normalise to date-only string for safe comparison regardless of timezone offset
function toDateOnly(iso: string): string {
  return iso.substring(0, 10);
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

    // Fetch all payments oldest-first so ascending order gives us registration anchor logic
    const { data: payments, error } = await admin
      .from("walk_in_payments")
      .select("id, type, customer_name, customer_phone, customer_email, profile_id, membership_fee, amount, method, reference, notes, created_at")
      .in("type", ["membership", "physical_class", "online_class"])
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ── Membership: track first payment record + running total per profile_id ───
    const memberMap      = new Map<string, any>();    // profile_id → first payment record
    const memberPayByPid = new Map<string, number>(); // profile_id → total paid (all time)

    // ── Physical/Zoom: collect ALL payments per phone:class key ─────────────────
    const physAllByKey        = new Map<string, any[]>(); // key → all payment records
    const physUnattribByPhone = new Map<string, any[]>(); // phone → payments with no class
    const latestKeyByPhone    = new Map<string, string>(); // phone → most recent key

    for (const p of payments ?? []) {
      if (p.type === "membership") {
        const key = p.profile_id as string;
        if (!key) continue;
        memberPayByPid.set(key, (memberPayByPid.get(key) ?? 0) + (p.amount ?? 0));
        if (!memberMap.has(key)) memberMap.set(key, p);
      } else {
        // physical_class or online_class
        const cls = extractClassName(p.notes);
        if (cls) {
          const key = `phone:${p.customer_phone}:${cls}`;
          const arr = physAllByKey.get(key) ?? [];
          arr.push(p);
          physAllByKey.set(key, arr);
          latestKeyByPhone.set(p.customer_phone, key); // ascending → last write = most recent
        } else {
          const arr = physUnattribByPhone.get(p.customer_phone) ?? [];
          arr.push(p);
          physUnattribByPhone.set(p.customer_phone, arr);
        }
      }
    }

    // ── Physical: use LATEST registration record as enrolment anchor ─────────
    // A re-enrolled student may have multiple registration records for the same
    // phone+class key. We use the LATEST one, and only count payments from its
    // joined_at date onwards to prevent historical payment cross-contamination.
    const physRegMap      = new Map<string, any>();    // key → latest reg record
    const physTotalMap    = new Map<string, number>(); // key → total paid since current enrolment
    const physLatestDate  = new Map<string, string>(); // key → most recent payment date

    for (const [key, list] of physAllByKey) {
      const regRecords = list.filter(p => isRegistrationRecord(p.notes));
      // Ascending order → last element = most recent registration
      const latestReg  = regRecords.length > 0 ? regRecords[regRecords.length - 1] : list[0];
      physRegMap.set(key, latestReg);

      const joinedAtRaw = extractMeta(latestReg.notes, "joined_at") ?? latestReg.created_at;
      const enrolStart  = toDateOnly(joinedAtRaw);

      const currentPayments = list.filter(p => toDateOnly(p.created_at) >= enrolStart);
      const total = currentPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
      physTotalMap.set(key, total);

      const latestPayment = currentPayments[currentPayments.length - 1];
      physLatestDate.set(key, latestPayment?.created_at ?? latestReg.created_at);
    }

    // ── Add unattributed payments (Add Payment records) to latest enrolment ───
    // Use the registration record's full ISO timestamp as the cutoff — not just
    // the date — so retroactively-entered payments from the same calendar day are
    // excluded. "Add Payment" records are always entered AFTER the student is
    // registered, so only those with created_at > latestReg.created_at are new.
    for (const [phone, unattrib] of physUnattribByPhone) {
      const key = latestKeyByPhone.get(phone);
      if (!key) continue;
      const latestReg = physRegMap.get(key);
      if (!latestReg) continue;
      const addAmt = unattrib
        .filter(p => p.created_at > latestReg.created_at)  // strictly after registration
        .reduce((s, p) => s + (p.amount ?? 0), 0);
      if (addAmt > 0) physTotalMap.set(key, (physTotalMap.get(key) ?? 0) + addAmt);
    }

    // ── Subscription info for members ─────────────────────────────────────────
    const memberIds = Array.from(memberMap.keys());
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

    // ── Period-paid for members (within current subscription window) ──────────
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
        if (p.created_at >= sub.start) {
          periodPaidMap[p.profile_id] = (periodPaidMap[p.profile_id] ?? 0) + (p.amount ?? 0);
        }
      }
    }

    // ── Build result ──────────────────────────────────────────────────────────
    const result: any[] = [];

    // Membership records
    for (const [profileId, p] of memberMap) {
      const agreedFee  = p.membership_fee ?? DEFAULT_MEMBERSHIP_FEE;
      const totalPaid  = memberPayByPid.get(profileId) ?? p.amount;
      const sub        = subMap[profileId];
      let due_date:    string | null = null;
      let sub_start:   string | null = null;
      let period_paid: number        = totalPaid;
      let outstanding: number        = 0;

      if (sub) {
        due_date    = sub.end;
        sub_start   = sub.start;
        period_paid = periodPaidMap[profileId] ?? totalPaid;
        outstanding = Math.max(0, agreedFee - period_paid);
      } else {
        const d = new Date(p.created_at);
        d.setDate(d.getDate() + 30);
        due_date    = d.toISOString().slice(0, 10);
        sub_start   = p.created_at.slice(0, 10);
        period_paid = totalPaid;
        outstanding = Math.max(0, agreedFee - period_paid);
      }

      result.push({
        id: p.id, type: p.type, name: p.customer_name, phone: p.customer_phone,
        email: p.customer_email, profile_id: p.profile_id,
        membership_fee: agreedFee, amount: p.amount, total_paid: totalPaid,
        period_paid, outstanding, method: p.method, reference: p.reference,
        notes: p.notes, class_name: null, student_type: null,
        course_fee_monthly: null, registration_fee: null, total_due: null,
        cash_amount: null, mpesa_amount: null, mpesa_reference: null,
        joined_at: null, payment_date: p.created_at, last_payment_date: p.created_at,
        sub_start, due_date,
      });
    }

    // Physical / Zoom class records
    for (const [key, p] of physRegMap) {
      const totalPaid     = physTotalMap.get(key)   ?? p.amount;
      const lastPayDate   = physLatestDate.get(key) ?? p.created_at;
      const totalDueVal   = extractMetaNumber(p.notes, "total_due") || null;
      const outstanding   = totalDueVal ? Math.max(0, totalDueVal - totalPaid) : 0;

      result.push({
        id: p.id, type: p.type, name: p.customer_name, phone: p.customer_phone,
        email: p.customer_email, profile_id: p.profile_id,
        membership_fee: null, amount: p.amount, total_paid: totalPaid,
        period_paid: totalPaid, outstanding,
        method: p.method, reference: p.reference, notes: p.notes,
        class_name:         extractClassName(p.notes) || "",
        student_type:       extractMeta(p.notes, "student_type") ?? "new",
        course_fee_monthly: extractMetaNumber(p.notes, "monthly")  || null,
        registration_fee:   extractMetaNumber(p.notes, "reg_fee")  || null,
        total_due:          totalDueVal,
        cash_amount:        extractMetaNumber(p.notes, "cash")     || null,
        mpesa_amount:       extractMetaNumber(p.notes, "mpesa")    || null,
        mpesa_reference:    extractMeta(p.notes, "mpesa_ref"),
        joined_at:          extractMeta(p.notes, "joined_at") ?? p.created_at,
        payment_date:       p.created_at,
        last_payment_date:  lastPayDate,
        sub_start: null, due_date: null,
      });
    }

    // Sort: outstanding first, then most recent payment first
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
