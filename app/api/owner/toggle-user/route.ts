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

    const { userId, is_active } = await request.json() as {
      userId?:    string;
      is_active?: boolean;
    };

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (typeof is_active !== "boolean")
      return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });

    if (userId === user.id) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }

    const adminClient = createServiceClient();

    const { data: target } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!["manager", "receptionist"].includes(target.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ is_active })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      userId,
      { user_metadata: { is_active } }
    );

    if (metaError) {
      return NextResponse.json({ error: metaError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
