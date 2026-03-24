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

export async function PATCH(request: NextRequest) {
  try {
    // ── 1. Verify caller ───────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!["owner", "manager"].includes(callerProfile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 2. Parse body ──────────────────────────────────────
    const { userId, newPassword } = await request.json() as {
      userId?:      string;
      newPassword?: string;
    };

    if (!userId)      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (!newPassword || newPassword.length < 6)
      return NextResponse.json({ error: "newPassword must be at least 6 characters" }, { status: 400 });

    const adminClient = createServiceClient();

    // ── 3. Role scope check ────────────────────────────────
    const { data: target } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (callerProfile?.role === "owner" && !["manager", "receptionist"].includes(target.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (callerProfile?.role === "manager" && !["teacher", "social_media", "member"].includes(target.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (target.role === "owner") {
      return NextResponse.json({ error: "Owner passwords cannot be changed here" }, { status: 403 });
    }

    // ── 4. Update password via admin API ───────────────────
    const { error } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
