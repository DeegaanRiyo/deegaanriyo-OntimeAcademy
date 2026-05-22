import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = getServiceClient();

    const { data: profile } = await adminClient
      .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, rejection_reason } = await request.json() as {
      action?:           "approve" | "reject";
      rejection_reason?: string;
    };

    if (!["approve", "reject"].includes(action ?? "")) {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }

    const { data: reg } = await adminClient
      .from("pending_registrations")
      .select("*")
      .eq("id", params.id)
      .eq("manager_id", user.id)
      .eq("status", "pending")
      .single();

    if (!reg) return NextResponse.json({ error: "Registration not found or already reviewed" }, { status: 404 });

    if (action === "reject") {
      await adminClient
        .from("pending_registrations")
        .update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString(), rejection_reason: rejection_reason ?? null })
        .eq("id", params.id);

      return NextResponse.json({ success: true, action: "rejected" });
    }

    // Check username not already taken
    const { data: existing } = await adminClient
      .from("profiles").select("id").eq("username", reg.username).maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Username already taken — ask the applicant to choose another" }, { status: 409 });
    }

    // Create Supabase auth user
    const email = `${reg.username}@ontimecws.app`;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password:       reg.password_temp,
      email_confirm:  true,
      user_metadata:  {
        full_name: reg.full_name,
        username:  reg.username,
        role:      reg.requested_role,
        is_active: true,
      },
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    const userId = authData.user?.id;
    if (!userId)  return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 });

    await adminClient.from("profiles").update({
      username:  reg.username,
      full_name: reg.full_name,
      phone:     reg.phone ?? null,
    }).eq("id", userId);

    await adminClient.from("pending_registrations").update({
      status:        "approved",
      reviewed_by:   user.id,
      reviewed_at:   new Date().toISOString(),
      password_temp: "",
    }).eq("id", params.id);

    return NextResponse.json({ success: true, action: "approved", userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
