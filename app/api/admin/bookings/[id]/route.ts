import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  // 1. Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["admin", "owner"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body as { status?: string };

  // 3. Validate status
  if (!["confirmed", "rejected"].includes(status ?? "")) {
    return NextResponse.json(
      { error: 'status must be "confirmed" or "rejected"' },
      { status: 400 }
    );
  }

  // 4. Update booking
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", params.id);

  if (error) {
    console.error("[admin/bookings PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }

  // 5. Return success
  return NextResponse.json({ success: true });
}
