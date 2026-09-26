import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/receptionist/delete-member
// Soft-deletes a member (sets deleted_at, keeps payment history)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "owner", "manager", "admin"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { profile_id } = await req.json() as { profile_id: string };

    if (!profile_id) {
      return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
    }

    // Verify member exists
    const { data: member } = await admin
      .from("members").select("id").eq("id", profile_id).single();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Soft delete
    const { error: delErr } = await admin
      .from("members")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", profile_id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
