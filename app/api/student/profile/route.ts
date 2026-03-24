import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const full_name: string = (body.full_name ?? "").trim();
  const avatar_url: string = (body.avatar_url ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: full_name || null, avatar_url: avatar_url || null })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
