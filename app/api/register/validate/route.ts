import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// GET /api/register/validate?token=abc123
// Returns token info if valid, error if not.
// Called by the /register page on mount before showing the form.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false, reason: "No token provided" }, { status: 400 });

  const supabase = createServiceClient();

  const { data } = await supabase
    .from("invite_tokens")
    .select("id, invited_role, invite_note, used, expires_at")
    .eq("token", token)
    .single();

  if (!data)           return NextResponse.json({ valid: false, reason: "Invalid invite link." });
  if (data.used)       return NextResponse.json({ valid: false, reason: "This invite link has already been used." });
  if (new Date(data.expires_at) < new Date())
                       return NextResponse.json({ valid: false, reason: "This invite link has expired. Ask your manager for a new one." });

  return NextResponse.json({
    valid:        true,
    invited_role: data.invited_role,
    invite_note:  data.invite_note,
  });
}
