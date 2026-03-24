import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Verify caller is owner ──────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = getServiceClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 2. Parse + validate body ───────────────────────────
    const body = await request.json() as {
      full_name?: string;
      username?:  string;
      password?:  string;
      role?:      string;
    };

    const { full_name, username, password, role } = body;

    if (!full_name?.trim())
      return NextResponse.json({ error: "full_name is required" }, { status: 400 });
    if (!username?.trim())
      return NextResponse.json({ error: "username is required" }, { status: 400 });
    if (!password || password.length < 6)
      return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 });
    if (!["manager", "receptionist"].includes(role ?? ""))
      return NextResponse.json({ error: "role must be manager or receptionist" }, { status: 400 });

    // Username: lowercase letters, numbers, underscores only
    if (!/^[a-z0-9_]+$/.test(username.trim())) {
      return NextResponse.json(
        { error: "username may only contain lowercase letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    // ── 3. Check username is not already taken ─────────────
    const { data: existing } = await adminClient
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    // ── 4. Create Supabase auth user ───────────────────────
    // Staff never use this email — it's a synthetic address so
    // Supabase Auth has something to store. email_confirm skips
    // the verification email entirely.
    const email = `${username.trim()}@ontimecws.app`;

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          username:  username.trim(),
          role,
          is_active: true,
        },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 });
    }

    // ── 5. Set username on profile ─────────────────────────
    // The trigger creates the profile row, but doesn't know
    // about username — update it explicitly.
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ username: username.trim(), full_name: full_name.trim() })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    revalidatePath("/dashboard/owner/team");
    return NextResponse.json({ success: true, userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
