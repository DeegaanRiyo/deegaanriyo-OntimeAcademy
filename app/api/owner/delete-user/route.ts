import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await request.json() as { userId?: string };
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    if (userId === user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: target } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!target) {
      await adminClient.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json({ success: true });
    }

    if (!["manager", "receptionist"].includes(target.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
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
