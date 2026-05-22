import { createServerClient } from "@supabase/ssr";
import StudentsTabClient, { type PhysicalStudent, type OnlineStudent } from "./StudentsTabClient";

export const dynamic = "force-dynamic";

function service() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export default async function OwnerStudentsPage() {
  const admin = service();

  const [
    { data: registrationsRaw },
    { data: flagsRaw },
    { data: studentsRaw },
    { data: enrolmentsRaw },
  ] = await Promise.all([
    // All staff-recorded student registrations, newest first
    admin
      .from("student_registrations")
      .select(`
        id, student_type, customer_name, customer_phone, customer_email,
        course_name,
        course_fee_monthly, registration_fee, total_due,
        amount, method, reference, notes, recorded_by, created_at,
        recorder:profiles!student_registrations_recorded_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false }),

    // Open correction notes for students (pending)
    admin
      .from("correction_notes")
      .select(`
        id, record_id, note, status, submitted_at,
        submitted_by_profile:profiles!correction_notes_submitted_by_fkey(full_name)
      `)
      .eq("record_type", "student")
      .eq("status", "pending"),

    // Online platform students (self-registered)
    admin
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false }),

    // Their course enrolments
    admin
      .from("enrolments")
      .select("student_id, course_id, created_at, last_accessed_at, courses!inner(title, mode)"),
  ]);

  // ── Build flag lookup: record_id → pending correction notes ─────────────
  type FlagInfo = { id: string; message: string; flagged_by: string | null; created_at: string };
  const flagsByReg = new Map<string, FlagInfo[]>();
  for (const f of (flagsRaw ?? []) as any[]) {
    const arr = flagsByReg.get(f.record_id) ?? [];
    arr.push({
      id:         f.id,
      message:    f.note,
      flagged_by: (f.submitted_by_profile as any)?.full_name ?? null,
      created_at: f.submitted_at,
    });
    flagsByReg.set(f.record_id, arr);
  }

  // ── Build PhysicalStudent[] from student_registrations ────────────────────
  const physical: PhysicalStudent[] = (registrationsRaw ?? []).map((r: any) => ({
    id:                  r.id,
    student_type:        r.student_type as "new" | "current_old" | "zoom_virtual",
    name:                r.customer_name  ?? "—",
    phone:               r.customer_phone ?? "—",
    email:               r.customer_email ?? null,
    course_name:         r.course_name    ?? null,
    course_fee_monthly:  r.course_fee_monthly  ?? null,
    registration_fee:    r.registration_fee    ?? null,
    total_due:           r.total_due            ?? null,
    amount:              r.amount  ?? 0,
    method:              r.method  ?? "",
    reference:           r.reference ?? null,
    notes:               r.notes     ?? null,
    recorder:            (r.recorder as any)?.full_name ?? null,
    created_at:          r.created_at,
    open_flags:          flagsByReg.get(r.id) ?? [],
  }));

  // ── Online platform students ──────────────────────────────────────────────
  const enrolments   = (enrolmentsRaw ?? []) as any[];
  const onlineEnrols = enrolments.filter((e) => (e.courses as any)?.mode !== "physical");

  const online: OnlineStudent[] = (studentsRaw ?? []).map((s: any) => ({
    id:         s.id,
    full_name:  s.full_name,
    email:      s.email,
    created_at: s.created_at,
    enrolments: onlineEnrols
      .filter((e) => e.student_id === s.id)
      .map((e) => ({
        course_id:        e.course_id,
        course_title:     (e.courses as any)?.title ?? "Unknown",
        course_mode:      (e.courses as any)?.mode  ?? "online",
        enrolled_at:      e.created_at,
        last_accessed_at: e.last_accessed_at,
      })),
  }));

  const openFlagCount = (flagsRaw ?? []).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Students</h2>
          <p>All students across every category — select a card to view the full list</p>
        </div>
        {openFlagCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "8px", padding: "8px 14px" }}>
            <i className="fas fa-flag" style={{ color: "#dc2626", fontSize: ".85rem" }} />
            <span style={{ fontSize: ".82rem", fontWeight: 700, color: "#dc2626" }}>
              {openFlagCount} open flag{openFlagCount !== 1 ? "s" : ""} need review
            </span>
          </div>
        )}
      </div>
      <StudentsTabClient physical={physical} online={online} />
    </div>
  );
}
