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

export async function POST(request: NextRequest) {
  try {
    // Auth check
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

    // Parse body
    const body = (await request.json()) as {
      full_name: string;
      email: string;
      phone?: string;
      profession?: string;
      subscription_start: string;
      subscription_end: string;
    };

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

    const adminClient = createServiceClient();

    // Invite user by email
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(body.email, {
        data: { role: "member" },
        redirectTo: `${SITE_URL}/auth/callback?type=invite`,
      });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    const userId = inviteData?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Failed to create user account." },
        { status: 500 }
      );
    }

    // Upsert profile
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: userId,
      email: body.email,
      full_name: body.full_name,
      phone: body.phone ?? null,
      role: "member",
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Generate slug
    const slug =
      body.full_name.toLowerCase().replace(/\s+/g, "-") +
      "-" +
      userId.slice(0, 6);

    // Insert member record
    const { error: memberError } = await adminClient.from("members").insert({
      id: userId,
      slug,
      profession: body.profession ?? null,
      subscription_start: body.subscription_start,
      subscription_end: body.subscription_end,
      is_active: true,
      is_public: false,
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
