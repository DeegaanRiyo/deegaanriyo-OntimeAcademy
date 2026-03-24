/**
 * Correction Notes API
 *
 * Run this SQL in Supabase to create the required table:
 *
 * CREATE TABLE correction_notes (
 *   id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
 *   record_type    text        NOT NULL,   -- 'booking' | 'student' | 'member' | 'payment'
 *   record_id      text        NOT NULL,
 *   record_label   text,
 *   note           text        NOT NULL,
 *   submitted_by   uuid        REFERENCES profiles(id),
 *   submitted_at   timestamptz DEFAULT now(),
 *   status         text        DEFAULT 'pending',  -- 'pending' | 'reviewed' | 'resolved'
 *   owner_response text,
 *   reviewed_at    timestamptz
 * );
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const SUBMITTERS = ["manager", "receptionist"];
const REVIEWERS  = ["owner", "admin"];

// ─── POST — submit a correction note ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await service
    .from("profiles").select("role").eq("id", user.id).single();

  if (!SUBMITTERS.includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { record_type, record_id, record_label, note, recorded_amount, correct_amount } = await req.json();

  if (!record_type || !record_id || !note?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await service
    .from("correction_notes")
    .insert({
      record_type,
      record_id:       String(record_id),
      record_label:    record_label    ?? null,
      note:            note.trim(),
      submitted_by:    user.id,
      recorded_amount: recorded_amount ?? null,
      correct_amount:  correct_amount  ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ correction: data }, { status: 201 });
}

// ─── GET — list corrections (owner/admin only) ────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await service
    .from("profiles").select("role").eq("id", user.id).single();

  if (!REVIEWERS.includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";

  const { data, error } = await service
    .from("correction_notes")
    .select(`
      id, record_type, record_id, record_label, note,
      submitted_at, status, owner_response, reviewed_at,
      recorded_amount, correct_amount,
      submitted_by_profile:profiles!correction_notes_submitted_by_fkey(full_name, role)
    `)
    .eq("status", status)
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ corrections: data ?? [] });
}

// ─── PATCH — mark as reviewed/resolved (owner/admin only) ────────────────────

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await service
    .from("profiles").select("role").eq("id", user.id).single();

  if (!REVIEWERS.includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status, owner_response } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 });

  const { data, error } = await service
    .from("correction_notes")
    .update({ status, owner_response: owner_response ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ correction: data });
}
