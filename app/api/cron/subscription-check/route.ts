// ─── Vercel Cron — Daily Subscription Check ───────────────────────────────────
// Schedule: 0 5 * * *  →  5:00 AM UTC = 8:00 AM EAT every day
//
// What it does (in order):
//   1. Sends 5-day email reminder to members expiring in 5 days
//   2. Sends 1-day email reminder to members expiring tomorrow
//   3. Deactivates members whose subscription_end is in the past
//      and sends them an expiry notice
//
// Security: Vercel automatically sends  Authorization: Bearer {CRON_SECRET}
// when triggering the cron. Any other caller without the secret gets 401.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  sendFiveDayReminder,
  sendOneDayReminder,
  sendExpiredNotice,
} from "@/lib/email";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// Returns a YYYY-MM-DD date string offset by `days` from today
function dateOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function GET(request: NextRequest) {
  // ── 1. Auth check ────────────────────────────────────────
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const today  = dateOffset(0);
  const in5    = dateOffset(5);
  const in1    = dateOffset(1);

  const results = {
    reminders_5day:  0,
    reminders_1day:  0,
    deactivated:     0,
    errors:          [] as string[],
  };

  // ── 2. Fetch all active members with profile data ─────────
  // Join members + profiles to get email, full_name, subscription_end
  const { data: members } = await supabase
    .from("members")
    .select(`
      id,
      subscription_end,
      is_active,
      profiles!inner (
        full_name,
        email
      )
    `)
    .eq("is_active", true)
    .not("subscription_end", "is", null);

  if (!members || members.length === 0) {
    return NextResponse.json({ ...results, message: "No active members with subscriptions." });
  }

  for (const member of members) {
    const profile     = (member as any).profiles;
    const name        = profile?.full_name || "Member";
    const email       = profile?.email;
    const expiry      = member.subscription_end as string;

    if (!email || !expiry) continue;

    try {
      // ── 5-day reminder ──────────────────────────────────
      if (expiry === in5) {
        await sendFiveDayReminder(email, name, formatDate(expiry));
        results.reminders_5day++;
      }

      // ── 1-day reminder ──────────────────────────────────
      else if (expiry === in1) {
        await sendOneDayReminder(email, name, formatDate(expiry));
        results.reminders_1day++;
      }

      // ── Expired — deactivate + notify ───────────────────
      else if (expiry < today) {
        // Deactivate in members table (removes from public directory + blocks benefits)
        // We do NOT touch profiles.is_active — member can still log in and
        // see their expired dashboard, which shows the WhatsApp renewal CTA.
        const { error: deactivateError } = await supabase
          .from("members")
          .update({ is_active: false })
          .eq("id", member.id);

        if (deactivateError) {
          results.errors.push(`Deactivate failed for ${member.id}: ${deactivateError.message}`);
          continue;
        }

        await sendExpiredNotice(email, name);
        results.deactivated++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.errors.push(`Email failed for ${email}: ${msg}`);
    }
  }

  console.log("[cron/subscription-check]", results);
  return NextResponse.json({ success: true, date: today, ...results });
}
