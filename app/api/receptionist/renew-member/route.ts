import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/receptionist/renew-member
// Renews a member's subscription starting from their old expiry date
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "owner", "manager", "admin"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      profile_id:        string;
      subscription_days?: number;   // override duration (defaults to member's stored value)
      amount?:           number;    // optional payment to record at renewal
      method?:           "cash" | "mpesa";
      reference?:        string;
    };

    const { profile_id, subscription_days, amount, method, reference } = body;

    if (!profile_id) {
      return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
    }

    // Fetch current member data
    const { data: member, error: memberErr } = await admin
      .from("members")
      .select("id, subscription_start, subscription_end, subscription_days, membership_fee, is_active")
      .eq("id", profile_id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Duration: use override, fall back to stored value, fall back to 30
    const days = subscription_days ?? member.subscription_days ?? 30;

    // New subscription starts from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newStart = today;
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + days);

    const newStartStr = newStart.toISOString().slice(0, 10);
    const newEndStr   = newEnd.toISOString().slice(0, 10);

    // Update member subscription
    const { error: updateErr } = await admin
      .from("members")
      .update({
        subscription_start: newStartStr,
        subscription_end:   newEndStr,
        subscription_days:  days,
        is_active:          true,
      })
      .eq("id", profile_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Optionally record a payment at the same time
    let paymentId: string | null = null;
    if (amount && amount > 0 && method) {
      const { data: payment, error: payErr } = await admin
        .from("membership_payments")
        .insert({
          profile_id,
          amount: Math.round(amount),
          method,
          reference: reference?.trim() || null,
          recorded_by: user.id,
        })
        .select("id")
        .single();

      if (payErr) {
        return NextResponse.json({ error: payErr.message }, { status: 500 });
      }
      paymentId = payment.id;
    }

    return NextResponse.json({
      success: true,
      subscription_start: newStartStr,
      subscription_end:   newEndStr,
      subscription_days:  days,
      payment_id:         paymentId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
