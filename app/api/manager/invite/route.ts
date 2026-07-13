import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles").select("role").eq("id", user.id).single();

    if (profile?.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { invited_role, invite_note } = await request.json() as {
      invited_role?: string;
      invite_note?:  string;
    };

    if (!["teacher", "social_media", "member"].includes(invited_role ?? "")) {
      return NextResponse.json({ error: "invited_role must be teacher, social_media, or member" }, { status: 400 });
    }

    const { data: token, error } = await adminClient
      .from("invite_tokens")
      .insert({
        invited_role,
        created_by:  user.id,
        invite_note: invite_note?.trim() || null,
      })
      .select("token, expires_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const link    = `${siteUrl}/register?token=${token.token}`;

    return NextResponse.json({ success: true, link, expires_at: token.expires_at });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createAdminClient();

    const { data: profile } = await serviceClient
      .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { tokenId } = await request.json() as { tokenId?: string };
    if (!tokenId) return NextResponse.json({ error: "tokenId is required" }, { status: 400 });

    const { error } = await serviceClient
      .from("invite_tokens")
      .delete()
      .eq("id", tokenId)
      .eq("created_by", user.id)
      .eq("used", false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
