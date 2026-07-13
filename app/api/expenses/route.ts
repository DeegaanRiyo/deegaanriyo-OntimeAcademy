/**
 * Expenses API
 *
 * Run this SQL in Supabase to create the required table:
 *
 * CREATE TABLE expenses (
 *   id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
 *   title            text        NOT NULL,
 *   category         text        NOT NULL DEFAULT 'other',
 *   amount           numeric     NOT NULL CHECK (amount > 0),
 *   payment_method   text,
 *   reference        text,
 *   notes            text,
 *   recorded_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
 *   recorded_at      timestamptz DEFAULT now(),
 *   status           text        NOT NULL DEFAULT 'issued',
 *   requires_approval boolean    NOT NULL DEFAULT false,
 *   approved_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
 *   approved_at      timestamptz,
 *   issued_at        timestamptz,
 *   rejection_reason text
 * );
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const APPROVAL_THRESHOLD = 5000;

// ─── POST — manager records or requests an expense ────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, category, amount, payment_method, reference, notes } = await req.json();

  if (!title?.trim() || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "Title and a valid amount are required." }, { status: 400 });
  }

  const amt               = Number(amount);
  const requiresApproval  = amt >= APPROVAL_THRESHOLD;
  const now               = new Date().toISOString();

  const { data, error } = await admin
    .from("expenses")
    .insert({
      title:             title.trim(),
      category:          category || "other",
      amount:            amt,
      payment_method:    requiresApproval ? null : (payment_method || "cash"),
      reference:         reference?.trim() || null,
      notes:             notes?.trim()     || null,
      recorded_by:       user.id,
      status:            requiresApproval ? "pending" : "issued",
      requires_approval: requiresApproval,
      issued_at:         requiresApproval ? null : now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data }, { status: 201 });
}

// ─── GET — list expenses ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();

  if (!["manager", "owner", "admin"].includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = admin
    .from("expenses")
    .select("id, title, category, amount, payment_method, reference, notes, recorded_at, status, requires_approval, approved_at, issued_at, rejection_reason, recorded_by, approved_by")
    .order("recorded_at", { ascending: false });

  // Manager sees only their own; owner/admin see all
  if (profile?.role === "manager") {
    query = (query as any).eq("recorded_by", user.id);
  }

  if (status) query = (query as any).eq("status", status);

  const { data: expenses, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve recorder/approver names
  const profileIds = new Set<string>();
  for (const e of expenses ?? []) {
    if (e.recorded_by) profileIds.add(e.recorded_by);
    if (e.approved_by) profileIds.add(e.approved_by);
  }

  let profileMap: Record<string, string> = {};
  if (profileIds.size > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(profileIds));
    for (const p of profiles ?? []) profileMap[p.id] = p.full_name ?? "—";
  }

  const enriched = (expenses ?? []).map((e) => ({
    ...e,
    recorder_name: e.recorded_by ? (profileMap[e.recorded_by] ?? "—") : "—",
    approver_name: e.approved_by ? (profileMap[e.approved_by] ?? "—") : null,
  }));

  return NextResponse.json({ expenses: enriched });
}

// ─── PATCH — owner approves/rejects | manager issues ─────────────────────────

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();

  const body = await req.json();
  const { id, action } = body;
  if (!id || !action) return NextResponse.json({ error: "Missing id or action." }, { status: 400 });

  const now = new Date().toISOString();

  // ── Owner: approve or reject
  if (action === "approve" || action === "reject") {
    if (!["owner", "admin"].includes(profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const update = action === "approve"
      ? { status: "approved", approved_by: user.id, approved_at: now }
      : { status: "rejected", rejection_reason: body.rejection_reason?.trim() || "No reason provided" };

    const { data, error } = await admin.from("expenses").update(update).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ expense: data });
  }

  // ── Manager: issue an approved expense
  if (action === "issue") {
    if (profile?.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { payment_method, reference } = body;
    const { data, error } = await admin
      .from("expenses")
      .update({
        status:         "issued",
        payment_method: payment_method || "cash",
        reference:      reference?.trim() || null,
        issued_at:      now,
      })
      .eq("id", id)
      .eq("status", "approved")
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Expense not found or not approved." }, { status: 404 });
    return NextResponse.json({ expense: data });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
