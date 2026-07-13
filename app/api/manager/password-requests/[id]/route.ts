import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action } = await request.json() as { action?: "approve" | "reject" };
    if (!["approve", "reject"].includes(action ?? "")) {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: pwReq } = await adminClient
      .from("password_reset_requests")
      .select("*, profiles!password_reset_requests_user_id_fkey(email)")
      .eq("id", params.id)
      .eq("manager_id", user.id)
      .eq("status", "pending")
      .single();

    if (!pwReq) return NextResponse.json({ error: "Request not found or already reviewed" }, { status: 404 });

    if (action === "reject") {
      await adminClient
        .from("password_reset_requests")
        .update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", params.id);

      return NextResponse.json({ success: true, action: "rejected" });
    }

    // Approve: generate password reset link
    const authEmail = `${pwReq.username}@ontimecws.app`;
    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { error: resetError } = await adminClient.auth.admin.generateLink({
      type:    "recovery",
      email:   authEmail,
      options: { redirectTo: `${siteUrl}/reset-password` },
    });

    if (resetError) return NextResponse.json({ error: resetError.message }, { status: 500 });

    await adminClient
      .from("password_reset_requests")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", params.id);

    return NextResponse.json({ success: true, action: "approved" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
