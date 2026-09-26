import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH /api/receptionist/edit-member
export async function PATCH(req: NextRequest) {
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

    const body = await req.json() as {
      profile_id:      string;
      full_name?:      string;
      phone?:          string;
      email?:          string;
      profession?:     string;
      membership_fee?: number;
    };

    const { profile_id, full_name, phone, email, profession, membership_fee } = body;

    if (!profile_id) {
      return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
    }

    // Update profile fields
    const profileUpdate: Record<string, any> = {};
    if (full_name?.trim())  profileUpdate.full_name = full_name.trim();
    if (phone?.trim())      profileUpdate.phone     = phone.trim();
    if (email !== undefined) profileUpdate.email     = email?.trim() || null;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: pErr } = await admin
        .from("profiles").update(profileUpdate).eq("id", profile_id);
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    // Update member fields
    const memberUpdate: Record<string, any> = {};
    if (profession !== undefined) memberUpdate.profession     = profession?.trim() || null;
    if (membership_fee !== undefined && membership_fee >= 0) memberUpdate.membership_fee = Math.round(membership_fee);

    if (Object.keys(memberUpdate).length > 0) {
      const { error: mErr } = await admin
        .from("members").update(memberUpdate).eq("id", profile_id);
      if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
