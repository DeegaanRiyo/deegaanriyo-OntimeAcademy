import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "member")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as {
      full_name?: string;
      phone?: string;
      profession?: string;
      bio?: string;
      portfolio_url?: string;
      linkedin_url?: string;
      twitter_url?: string;
      is_public?: boolean;
    };

    // Update profiles table
    const profileUpdates: Record<string, string | null> = {};
    if (body.full_name !== undefined) profileUpdates.full_name = body.full_name;
    if (body.phone !== undefined) profileUpdates.phone = body.phone;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id);

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        );
      }
    }

    // Update members table
    const memberUpdates: Record<string, string | boolean | null> = {};
    if (body.profession !== undefined)
      memberUpdates.profession = body.profession;
    if (body.bio !== undefined) memberUpdates.bio = body.bio;
    if (body.portfolio_url !== undefined)
      memberUpdates.portfolio_url = body.portfolio_url || null;
    if (body.linkedin_url !== undefined)
      memberUpdates.linkedin_url = body.linkedin_url || null;
    if (body.twitter_url !== undefined)
      memberUpdates.twitter_url = body.twitter_url || null;
    if (body.is_public !== undefined) memberUpdates.is_public = body.is_public;

    if (Object.keys(memberUpdates).length > 0) {
      const { error: memberError } = await supabase
        .from("members")
        .update(memberUpdates)
        .eq("id", user.id);

      if (memberError) {
        return NextResponse.json(
          { error: memberError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
