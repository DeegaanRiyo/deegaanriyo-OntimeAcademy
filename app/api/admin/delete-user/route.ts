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

export async function DELETE(request: NextRequest) {
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

    // Owner can delete manager/receptionist.
    // Manager can delete teacher/social_media/member (enforced below).
    if (!["owner", "manager"].includes(callerProfile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 2. Parse body ──────────────────────────────────────
    const { userId } = await request.json() as { userId?: string };
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const adminClient = createServiceClient();

    // ── 3. Fetch target profile for safety checks ──────────
    const { data: target } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    // Profile already gone — treat as already deleted and return success
    // (can happen if a previous attempt partially succeeded)
    if (!target) {
      await adminClient.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json({ success: true });
    }

    // Owner can only delete manager or receptionist
    if (callerProfile?.role === "owner" && !["manager", "receptionist"].includes(target.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Manager can only delete teacher, social_media, member
    if (callerProfile?.role === "manager" && !["teacher", "social_media", "member"].includes(target.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Never allow deleting an owner account
    if (target.role === "owner") {
      return NextResponse.json({ error: "Owner accounts cannot be deleted" }, { status: 403 });
    }

    // ── 4. Delete auth user (cascades to profiles via ON DELETE CASCADE) ──
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      // Auth user may already be gone — clean up orphaned profile and succeed
      if (deleteError.message.toLowerCase().includes("not found") ||
          deleteError.message.toLowerCase().includes("does not exist")) {
        await adminClient.from("profiles").delete().eq("id", userId);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
