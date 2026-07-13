import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const status = request.nextUrl.searchParams.get("status") ?? "pending";

    const { data, error } = await adminClient
      .from("pending_registrations")
      .select("id, full_name, email, phone, username, requested_role, status, created_at")
      .eq("manager_id", user.id)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
