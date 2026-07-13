import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/forgot-password
// Public — no auth required.
// Staff enter their username → request lands in Manager's queue.
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json() as { username?: string };
    if (!username?.trim())
      return NextResponse.json({ error: "Username is required" }, { status: 400 });

    const supabase = createAdminClient();

    // Look up the profile by username
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_active, username")
      .eq("username", username.trim().toLowerCase())
      .single();

    // Always return success to avoid username enumeration
    // (don't tell the caller whether the username exists)
    if (!profile || !["teacher", "social_media", "member", "receptionist"].includes(profile.role)) {
      return NextResponse.json({ success: true });
    }

    // Don't create duplicate pending requests
    const { data: existing } = await supabase
      .from("password_reset_requests")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) return NextResponse.json({ success: true }); // already queued

    // Find the manager (the one active manager manages all staff below them)
    const { data: manager } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "manager")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!manager) return NextResponse.json({ success: true }); // no manager configured yet

    // Create the reset request in the Manager's queue
    await supabase.from("password_reset_requests").insert({
      user_id:    profile.id,
      username:   profile.username,
      full_name:  profile.full_name || profile.username,
      role:       profile.role,
      manager_id: manager.id,
      status:     "pending",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
