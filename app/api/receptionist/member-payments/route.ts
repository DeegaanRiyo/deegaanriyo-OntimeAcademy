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

// GET /api/receptionist/member-payments?profile_id=xxx
// If profile_id is present: Returns profile, member subscription, and all membership payments for receipt.
// If profile_id is missing: Returns all membership payments for the current month.
export async function GET(req: NextRequest) {
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

    const profileId = new URL(req.url).searchParams.get("profile_id");

    if (profileId) {
      const [
        { data: profile, error: profileErr },
        { data: member },
        { data: payments },
      ] = await Promise.all([
        admin.from("profiles")
          .select("id, full_name, email, phone")
          .eq("id", profileId)
          .single(),

        admin.from("members")
          .select("subscription_start, subscription_end")
          .eq("id", profileId)
          .maybeSingle(),

        admin.from("membership_payments")
          .select("id, amount, method, reference, created_at")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false }),
      ]);

      if (profileErr || !profile) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      return NextResponse.json({ profile, member: member ?? null, payments: payments ?? [] });
    } else {
      // List all membership payments for this month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      
      const { data: payments, error } = await admin
        .from("membership_payments")
        .select(`
          id, profile_id, amount, method, reference, created_at,
          profiles!profile_id(full_name, email, phone),
          recorder:profiles!recorded_by(full_name)
        `)
        .gte("created_at", firstDay)
        .order("created_at", { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const flattened = (payments ?? []).map((p: any) => ({
        ...p,
        full_name:     p.profiles?.full_name,
        email:         p.profiles?.email,
        phone:         p.profiles?.phone,
        recorder_name: p.recorder?.full_name,
      }));

      return NextResponse.json({ payments: flattened });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
