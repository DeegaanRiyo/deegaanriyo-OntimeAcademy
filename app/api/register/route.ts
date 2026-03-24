import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// POST /api/register
// Public endpoint — no auth required.
// Validates invite token, saves to pending_registrations, burns the token.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      token?:     string;
      full_name?: string;
      email?:     string;
      phone?:     string;
      username?:  string;
      password?:  string;
    };

    const { token, full_name, email, phone, username, password } = body;

    // ── Validate required fields ───────────────────────────
    if (!token)                 return NextResponse.json({ error: "Missing token" },     { status: 400 });
    if (!full_name?.trim())     return NextResponse.json({ error: "Full name required" }, { status: 400 });
    if (!email?.trim())         return NextResponse.json({ error: "Email required" },     { status: 400 });
    if (!username?.trim())      return NextResponse.json({ error: "Username required" },  { status: 400 });
    if (!password || password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    if (!/^[a-z0-9_]+$/.test(username.trim()))
      return NextResponse.json({ error: "Username: lowercase letters, numbers, underscores only" }, { status: 400 });

    const supabase = createServiceClient();

    // ── Re-validate the token (server-side, single source of truth) ──
    const { data: tokenRow } = await supabase
      .from("invite_tokens")
      .select("id, invited_role, created_by, used, expires_at")
      .eq("token", token)
      .single();

    if (!tokenRow)                          return NextResponse.json({ error: "Invalid invite link." },            { status: 400 });
    if (tokenRow.used)                      return NextResponse.json({ error: "This invite link has already been used." }, { status: 400 });
    if (new Date(tokenRow.expires_at) < new Date())
                                            return NextResponse.json({ error: "This invite link has expired." },   { status: 400 });

    // ── Check username not already taken in profiles ───────
    const { data: existingProfile } = await supabase
      .from("profiles").select("id").eq("username", username.trim()).maybeSingle();
    if (existingProfile)
      return NextResponse.json({ error: "Username already taken. Please choose a different one." }, { status: 409 });

    // ── Check username not already in a pending registration ─
    const { data: existingPending } = await supabase
      .from("pending_registrations")
      .select("id").eq("username", username.trim()).eq("status", "pending").maybeSingle();
    if (existingPending)
      return NextResponse.json({ error: "Username already taken. Please choose a different one." }, { status: 409 });

    // ── Create pending registration ────────────────────────
    const { error: insertError } = await supabase
      .from("pending_registrations")
      .insert({
        full_name:      full_name.trim(),
        email:          email.trim().toLowerCase(),
        phone:          phone?.trim() || null,
        username:       username.trim(),
        password_temp:  password,          // held until manager approves
        requested_role: tokenRow.invited_role,
        invite_token_id: tokenRow.id,
        manager_id:     tokenRow.created_by,
        status:         "pending",
      });

    if (insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 });

    // ── Burn the token (single use) ────────────────────────
    await supabase
      .from("invite_tokens")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", tokenRow.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
