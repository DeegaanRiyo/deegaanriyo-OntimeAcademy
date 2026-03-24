import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// ── GET: fetch single member ─────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!["admin", "owner"].includes(profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("members")
      .select(
        "id, slug, profession, bio, is_active, subscription_start, subscription_end, profiles(full_name, email, phone)"
      )
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH: update member profile/subscription ────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!["admin", "owner"].includes(profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      full_name?: string;
      phone?: string;
      profession?: string;
      bio?: string;
      subscription_start?: string;
      subscription_end?: string;
      is_active?: boolean;
    };

    const adminClient = createServiceClient();

    // Update profiles table
    const profileUpdates: Record<string, unknown> = {};
    if (body.full_name !== undefined) profileUpdates.full_name = body.full_name;
    if (body.phone !== undefined) profileUpdates.phone = body.phone || null;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await adminClient
        .from("profiles")
        .update(profileUpdates)
        .eq("id", params.id);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
    }

    // Update members table
    const memberUpdates: Record<string, unknown> = {};
    if (body.profession !== undefined) memberUpdates.profession = body.profession || null;
    if (body.bio !== undefined) memberUpdates.bio = body.bio || null;
    if (body.subscription_start !== undefined)
      memberUpdates.subscription_start = body.subscription_start || null;
    if (body.subscription_end !== undefined)
      memberUpdates.subscription_end = body.subscription_end || null;
    if (body.is_active !== undefined) memberUpdates.is_active = body.is_active;

    if (Object.keys(memberUpdates).length > 0) {
      const { error: memberError } = await adminClient
        .from("members")
        .update(memberUpdates)
        .eq("id", params.id);

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
