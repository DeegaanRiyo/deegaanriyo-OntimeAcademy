import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Verify the caller is an authenticated owner
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden — owner only" }, { status: 403 });
    }

    // Parse body
    const body = await request.json() as { email: string; role: "admin" | "teacher" };
    const { email, role } = body;

    if (!email || !["admin", "teacher"].includes(role)) {
      return NextResponse.json({ error: "Invalid email or role" }, { status: 400 });
    }

    // Send invite via Supabase Admin API
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data:        { role },
      redirectTo:  `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=invite`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Pre-set the role in profiles if the user row was created
    if (data?.user?.id) {
      await adminClient
        .from("profiles")
        .upsert({ id: data.user.id, email, role, full_name: "" })
        .eq("id", data.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
