import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const ALLOWED = ["receptionist", "manager", "owner", "admin"];

// ── POST — log a new walk-in visitor ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = service();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED.includes(profile?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, phone, email, interest, notes } = body;

  if (!name?.trim() || !phone?.trim() || !interest) {
    return NextResponse.json({ error: "Name, phone and interest are required." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("walk_in_visitors")
    .insert({
      name:        name.trim(),
      phone:       phone.trim(),
      email:       email?.trim() || null,
      interest,
      notes:       notes?.trim() || null,
      follow_up:   "pending",
      recorded_by: user.id,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

// ── GET — list visitors ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = service();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED.includes(profile?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const follow_up = searchParams.get("follow_up"); // optional filter

  let query = admin
    .from("walk_in_visitors")
    .select("id, name, phone, email, interest, notes, follow_up, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (follow_up) query = query.eq("follow_up", follow_up);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ visitors: data ?? [] });
}

// ── PATCH — update follow-up status ──────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = service();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!ALLOWED.includes(profile?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, follow_up } = await req.json();
  if (!id || !follow_up) return NextResponse.json({ error: "Missing id or follow_up" }, { status: 400 });

  const { error } = await admin
    .from("walk_in_visitors")
    .update({ follow_up })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
