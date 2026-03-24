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
    { data: walkInsRaw },
    { data: studentsRaw },
    { data: enrolmentsRaw },
  ] = await Promise.all([
    // Physical class students (from walk_in_payments)
    admin
      .from("walk_in_payments")
      .select("id, customer_name, customer_phone, class_name, amount, method, created_at")
      .eq("type", "physical_class")
      .order("created_at", { ascending: false }),

    // Online students (profiles)
    admin
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false }),

    // Enrolments with course info
    admin
      .from("enrolments")
      .select("student_id, course_id, created_at, last_accessed_at, courses!inner(title, mode)"),
  ]);

  // Map physical students
  const physical: PhysicalStudent[] = (walkInsRaw ?? []).map((p: any) => ({
    id:           p.id,
    name:         p.customer_name ?? "—",
    phone:        p.customer_phone ?? "—",
    class_name:   p.class_name ?? "General",
    total_paid:   p.amount ?? 0,
    method:       p.method ?? "",
    payment_date: p.created_at,
  }));

  // Map online students with enrolments
  const enrolments = (enrolmentsRaw ?? []) as any[];
  const onlineEnrols = enrolments.filter((e: any) => (e.courses as any)?.mode !== "physical");

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

  // Unique class count for physical
  const physicalClasses = new Set(physical.map((s) => s.class_name)).size;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Students</h2>
          <p>Physical class students and online course enrolments</p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { label: "Physical Students", count: physical.length, color: "var(--teal2)", icon: "fa-chalkboard-teacher" },
          { label: "Physical Classes",  count: physicalClasses, color: "var(--teal)",  icon: "fa-door-open"          },
          { label: "Online Students",   count: online.length,   color: "#2563eb",      icon: "fa-laptop"             },
          { label: "Total Enrolments",  count: onlineEnrols.length, color: "#8b5cf6", icon: "fa-graduation-cap"     },
        ].map(({ label, count, color, icon }) => (
          <div key={label} style={{
            flex: 1, minWidth: "130px",
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
