import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function authorize() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = serviceClient();
  const { data: caller } = await admin
    .from("profiles").select("role").eq("id", user.id).single();

  if (!["receptionist", "admin", "owner", "manager"].includes(caller?.role ?? "")) return null;
  return { user, admin };
}

// GET /api/receptionist/visitors?follow_up=pending
export async function GET(req: NextRequest) {
  try {
    const ctx = await authorize();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const follow_up = req.nextUrl.searchParams.get("follow_up");

    let query = ctx.admin
      .from("walk_in_visitors")
      .select("id, name, phone, email, interest, notes, follow_up, created_at")
      .order("created_at", { ascending: false });

    if (follow_up && follow_up !== "all") {
      query = query.eq("follow_up", follow_up);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ visitors: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected error" }, { status: 500 });
  }
}

// POST /api/receptionist/visitors  — log a new visitor
export async function POST(req: NextRequest) {
  try {
    const ctx = await authorize();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, phone, email, interest, notes } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

    const validInterests = ["membership", "space_rental", "course", "general"];
    if (!validInterests.includes(interest)) {
      return NextResponse.json({ error: "Invalid interest value" }, { status: 400 });
    }

    const { data, error } = await ctx.admin
      .from("walk_in_visitors")
      .insert({
        name:        name.trim(),
        phone:       phone.trim(),
        email:       email?.trim() || null,
        interest,
        notes:       notes?.trim() || null,
        follow_up:   "pending",
        recorded_by: ctx.user.id,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected error" }, { status: 500 });
  }
}

// PATCH /api/receptionist/visitors  — update follow_up status
export async function PATCH(req: NextRequest) {
  try {
    const ctx = await authorize();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, follow_up } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const validStatuses = ["pending", "contacted", "converted", "not_interested"];
    if (!validStatuses.includes(follow_up)) {
      return NextResponse.json({ error: "Invalid follow_up value" }, { status: 400 });
    }

    const { error } = await ctx.admin
      .from("walk_in_visitors")
      .update({ follow_up })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected error" }, { status: 500 });
  }
}
