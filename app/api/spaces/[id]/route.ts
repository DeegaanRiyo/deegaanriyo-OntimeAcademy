import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify caller is owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden — owner only" }, { status: 403 });
    }

    const body = await request.json() as { hourly_rate?: number; is_available?: boolean };

    const { error } = await supabase
      .from("spaces")
      .update({
        ...(body.hourly_rate  !== undefined && { hourly_rate:  body.hourly_rate  }),
        ...(body.is_available !== undefined && { is_available: body.is_available }),
      })
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
