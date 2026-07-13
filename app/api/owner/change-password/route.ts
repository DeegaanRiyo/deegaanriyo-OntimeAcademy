import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest) {
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

    const { userId, newPassword } = await request.json() as {
      userId?:      string;
      newPassword?: string;
    };

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (!newPassword || newPassword.length < 6)
      return NextResponse.json({ error: "newPassword must be at least 6 characters" }, { status: 400 });

    const adminClient = createAdminClient();

    const { data: target } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!["manager", "receptionist"].includes(target.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
