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

// ── Notes helpers (mirrors walk-in-members API) ───────────────────────────────

function extractClassName(notes: string | null): string {
  if (!notes) return "";
  const match = notes.match(/^Class:\s*([^.]+)/);
  return match ? match[1].trim() : "";
}
function extractMeta(notes: string | null, key: string): string | null {
  if (!notes) return null;
  const match = notes.match(new RegExp(`${key}=([^.\\s]+)`));
  return match ? match[1].trim() : null;
}
function extractMetaNumber(notes: string | null, key: string): number {
  const v = extractMeta(notes, key);
  return v ? Number(v) : 0;
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function OwnerStudentsPage() {
  const admin = service();

  const [
    { data: walkInsRaw },
    { data: studentsRaw },
    { data: enrolmentsRaw },
    { data: flagsRaw },
  ] = await Promise.all([
    // Physical + online class students from walk_in_payments
    // class_name lives inside the notes field — parsed below
    admin
      .from("walk_in_payments")
      .select("id, type, customer_name, customer_phone, amount, method, notes, created_at")
      .in("type", ["physical_class", "online_class"])
      .order("created_at", { ascending: true }), // asc → de-dup keeps first (registration)

    // Online students (profiles with role=student)
    admin
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false }),

    // Enrolments with course info
    admin
      .from("enrolments")
      .select("student_id, course_id, created_at, last_accessed_at, courses!inner(title, mode)"),

    // Open flags (receptionist-flagged students)
    admin
      .from("student_flags")
      .select("id, payment_id, message, status, created_at, flagged_by_profile:profiles!student_flags_flagged_by_fkey(full_name)")
      .eq("status", "open"),
  ]);

  // ── De-duplicate physical students (same logic as walk-in-members) ───────────
  // Key: phone:class_name — one entry per class enrollment
  // Also accumulate total_paid across all payments for same phone
  const regMap   = new Map<string, any>();
  const totalMap = new Map<string, number>(); // phone:class → cumulative paid
  const addMap   = new Map<string, number>(); // phone → additional payments total
  const latestByPhone = new Map<string, string>(); // phone → latest reg key

  for (const p of (walkInsRaw ?? []) as any[]) {
    const cls = extractClassName(p.notes);
    if (cls) {
      const key = `phone:${p.customer_phone}:${cls}`;
      totalMap.set(key, (totalMap.get(key) ?? 0) + (p.amount ?? 0));
      if (!regMap.has(key)) regMap.set(key, p);
      latestByPhone.set(p.customer_phone, key);
    } else {
      addMap.set(p.customer_phone, (addMap.get(p.customer_phone) ?? 0) + (p.amount ?? 0));
    }
  }
  // Add additional payments to latest enrollment
  for (const [phone, addAmt] of addMap) {
    const key = latestByPhone.get(phone);
    if (key) totalMap.set(key, (totalMap.get(key) ?? 0) + addAmt);
  }

  // Build flag lookup: payment_id → flag[]
  const flagsByPayment = new Map<string, { id: string; message: string; flagged_by: string | null; created_at: string }[]>();
  for (const f of (flagsRaw ?? []) as any[]) {
    const arr = flagsByPayment.get(f.payment_id) ?? [];
    arr.push({
      id:         f.id,
      message:    f.message,
      flagged_by: (f.flagged_by_profile as any)?.full_name ?? null,
      created_at: f.created_at,
    });
    flagsByPayment.set(f.payment_id, arr);
  }

  // Map to PhysicalStudent[]
  const physical: PhysicalStudent[] = Array.from(regMap.values()).map((p: any) => {
    const cls              = extractClassName(p.notes) || "Unassigned";
    const key              = `phone:${p.customer_phone}:${cls === "Unassigned" ? "" : cls}`;
    const studentType      = extractMeta(p.notes, "student_type");
    const totalDue         = extractMetaNumber(p.notes, "total_due");
    const courseFeMonthly  = extractMetaNumber(p.notes, "monthly");
    const joinedAt         = extractMeta(p.notes, "joined_at");
    return {
      id:                 p.id,
      type:               p.type,
      name:               p.customer_name ?? "—",
      phone:              p.customer_phone ?? "—",
      class_name:         cls,
      student_type:       studentType,
      total_paid:         totalMap.get(key) ?? (p.amount ?? 0),
      total_due:          totalDue || null,
      course_fee_monthly: courseFeMonthly || null,
      joined_at:          joinedAt ?? p.created_at,
      notes:              p.notes,
      method:             p.method ?? "",
      payment_date:       p.created_at,
      open_flags:         flagsByPayment.get(p.id) ?? [],
    };
  });

  // ── Online (platform) students ────────────────────────────────────────────────
  const enrolments    = (enrolmentsRaw ?? []) as any[];
  const onlineEnrols  = enrolments.filter((e: any) => (e.courses as any)?.mode !== "physical");

  const online: OnlineStudent[] = (studentsRaw ?? []).map((s: any) => ({
    id:         s.id,
    full_name:  s.full_name,
    email:      s.email,
    created_at: s.created_at,
    enrolments: onlineEnrols
      .filter((e: any) => e.student_id === s.id)
      .map((e: any) => ({
        course_id:        e.course_id,
        course_title:     (e.courses as any)?.title ?? "Unknown",
        course_mode:      (e.courses as any)?.mode  ?? "online",
        enrolled_at:      e.created_at,
        last_accessed_at: e.last_accessed_at,
      })),
  }));

  const physicalClasses = new Set(physical.map((s) => s.class_name)).size;
  const openFlagCount   = (flagsRaw ?? []).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Students</h2>
          <p>Physical and online class students registered by reception</p>
        </div>
        {openFlagCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)",
            borderRadius: "8px", padding: "8px 14px",
          }}>
            <i className="fas fa-flag" style={{ color: "#dc2626", fontSize: ".85rem" }} />
            <span style={{ fontSize: ".82rem", fontWeight: 700, color: "#dc2626" }}>
              {openFlagCount} open flag{openFlagCount !== 1 ? "s" : ""} need review
            </span>
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { label: "Physical Students", count: physical.filter((s) => s.type === "physical_class").length, color: "var(--teal2)", icon: "fa-chalkboard-teacher" },
          { label: "Zoom Students",     count: physical.filter((s) => s.type === "online_class").length,   color: "#7c3aed",      icon: "fa-video"            },
          { label: "Classes",           count: physicalClasses,                                             color: "var(--teal)",  icon: "fa-door-open"        },
          { label: "Platform Students", count: online.length,                                               color: "#2563eb",      icon: "fa-laptop"           },
          { label: "Open Flags",        count: openFlagCount,                                               color: "#dc2626",      icon: "fa-flag"             },
        ].map(({ label, count, color, icon }) => (
          <div key={label} style={{
            flex: 1, minWidth: "120px",
            background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px",
            padding: "14px 16px", borderTop: `3px solid ${color}`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{count}</div>
              <i className={`fas ${icon}`} style={{ fontSize: ".85rem", color, opacity: .6 }} />
            </div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      <StudentsTabClient physical={physical} online={online} />
    </div>
  );
}
