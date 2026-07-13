import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["owner", "admin"].includes(caller?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Delete payment records first (profile_id = member's profile id)
    const { error: payError } = await admin
      .from("membership_payments")
      .delete()
      .eq("profile_id", id);

    if (payError) return NextResponse.json({ error: payError.message }, { status: 500 });

    // Delete the membership subscription record
    const { error: deleteError } = await admin
      .from("members")
      .delete()
      .eq("id", id);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    // Delete the profile row
    await admin.from("profiles").delete().eq("id", id);

    // Delete the auth account (if one exists — walk-in members won't have one)
    await admin.auth.admin.deleteUser(id).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
