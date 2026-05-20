import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

export const dynamic = "force-dynamic";

function service() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  new:          { label: "New Student",     color: "#E8490F" },
  current_old:  { label: "Current / Old",   color: "#16a34a" },
  zoom_virtual: { label: "Zoom / Virtual",  color: "#7c3aed" },
};
const METHOD_LABELS: Record<string, string> = {
  cash:          "Cash",
  mpesa:         "M-Pesa",
  bank_transfer: "Bank Transfer",
  both:          "Cash + M-Pesa",
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}
function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { month: "long", year: "numeric" });
}
function memberSubStatus(sub: any, now: Date, sevenDaysLater: Date): "active" | "expiring" | "expired" | "none" {
  if (!sub) return "none";
  const end = sub.subscription_end ? new Date(sub.subscription_end) : null;
  if (!end) return "none";
  if (end < now) return "expired";
  if (end <= sevenDaysLater) return "expiring";
  return "active";
}

export default async function OwnerDashboardPage() {
  const admin = service();

  const now            = new Date();
  const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const [
    { data: studentRegsMonthRaw },       // this-month student registrations (revenue + counts)
    { data: onlinePaysRaw },             // this-month online platform payments
    { data: allStudentRegsRaw },         // all-time student regs (6-month trend)
    { data: allOnlinePaysRaw },          // all-time online pays (6-month trend)
    { data: staffRaw },                  // team
    { data: membersRaw },                // members
    { data: onlineStudentsRaw },         // platform students
    { data: bookingsMonthRaw },          // bookings this month
    { data: pendingBookingsRaw },        // pending bookings badge
    { data: recentRegsRaw },             // recent student registrations (last 8)
    { data: issuedExpensesRaw },         // expenses
  ] = await Promise.all([
    // This month: student registrations
    admin
      .from("student_registrations")
      .select("id, student_type, amount")
      .gte("created_at", monthStart),

    // This month: online platform payments
    admin.from("payments").select("id, amount").eq("status", "paid").gte("created_at", monthStart),

    // All-time: student regs for trend
    admin.from("student_registrations").select("id, amount, created_at").order("created_at", { ascending: false }),

    // All-time: online pays for trend
    admin.from("payments").select("id, amount, created_at").eq("status", "paid").order("created_at", { ascending: false }),

    // Staff
    admin.from("profiles").select("id, role").in("role", ["manager", "receptionist", "teacher", "social_media"]),

    // Members
    admin.from("profiles").select("id, members(subscription_end)").eq("role", "member"),

    // Online platform students
    admin.from("profiles").select("id").eq("role", "student"),

    // Bookings this month
    admin.from("bookings").select("id, status").gte("created_at", monthStart),

    // Pending bookings
    admin.from("bookings").select("id").eq("status", "pending"),

    // Recent 8 student registrations with recorder name
    admin
      .from("student_registrations")
      .select(`
        id, student_type, customer_name, customer_phone, amount, method, created_at,
        recorder:profiles!student_registrations_recorded_by_fkey(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(8),

    // Issued expenses
    admin.from("expenses").select("amount").eq("status", "issued"),
  ]);

  // ── Revenue calcs ──────────────────────────────────────────────────────────
  const studentRegsMonth = (studentRegsMonthRaw ?? []) as any[];
  const onlinePays       = (onlinePaysRaw       ?? []) as any[];

  const walkInTotal   = studentRegsMonth.reduce((s, r) => s + (r.amount ?? 0), 0);
  const onlineTotal   = onlinePays.reduce((s, p) => s + (p.amount ?? 0), 0);
  const grandTotal    = walkInTotal + onlineTotal;
  const totalExpenses = (issuedExpensesRaw ?? []).reduce((s, e: any) => s + (e.amount ?? 0), 0);
  const netRevenue    = grandTotal - totalExpenses;

  // Revenue by student type (for breakdown)
  const newRev      = studentRegsMonth.filter((r) => r.student_type === "new").reduce((s, r) => s + (r.amount ?? 0), 0);
  const oldRev      = studentRegsMonth.filter((r) => r.student_type === "current_old").reduce((s, r) => s + (r.amount ?? 0), 0);
  const zoomRev     = studentRegsMonth.filter((r) => r.student_type === "zoom_virtual").reduce((s, r) => s + (r.amount ?? 0), 0);

  // ── People counts ──────────────────────────────────────────────────────────
  const staff              = (staffRaw         ?? []) as any[];
  const membersDb          = (membersRaw        ?? []) as any[];
  const onlineStudentCount = (onlineStudentsRaw ?? []).length;

  // Student counts from student_registrations (all-time unique by student_type)
  const allRegs     = (allStudentRegsRaw ?? []) as any[];
  const newCount     = allRegs.filter((r) => r.student_type === "new").length;
  const oldCount     = allRegs.filter((r) => r.student_type === "current_old").length;
  const zoomCount    = allRegs.filter((r) => r.student_type === "zoom_virtual").length;
  const totalStudents = newCount + oldCount + zoomCount + onlineStudentCount;

  let activeMemberCount = 0, expiringSoonCount = 0;
  for (const m of membersDb) {
    const sub    = Array.isArray(m.members) ? m.members[0] : m.members;
    const status = memberSubStatus(sub, now, sevenDaysLater);
    if (status === "active" || status === "expiring") activeMemberCount++;
    if (status === "expiring") expiringSoonCount++;
  }

  // ── Bookings ───────────────────────────────────────────────────────────────
  const bookingsMonth  = (bookingsMonthRaw  ?? []) as any[];
  const pendingCount   = (pendingBookingsRaw ?? []).length;
  const confirmedCount = bookingsMonth.filter((b) => b.status === "confirmed").length;

  // ── 6-month trend ──────────────────────────────────────────────────────────
  const allStudentRegs = (allStudentRegsRaw ?? []) as any[];
  const allOnlinePays  = (allOnlinePaysRaw  ?? []) as any[];

  const monthlyMap: Record<string, { label: string; walkIn: number; online: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = {
      label: d.toLocaleDateString("en-KE", { month: "short", year: "2-digit" }),
      walkIn: 0,
      online: 0,
    };
  }
  for (const r of allStudentRegs) {
    const key = (r.created_at as string).slice(0, 7);
    if (monthlyMap[key]) monthlyMap[key].walkIn += r.amount ?? 0;
  }
  for (const p of allOnlinePays) {
    const key = (p.created_at as string).slice(0, 7);
    if (monthlyMap[key]) monthlyMap[key].online += p.amount ?? 0;
  }
  const monthlyRows = Object.values(monthlyMap);
  const maxMonthly  = Math.max(...monthlyRows.map((r) => r.walkIn + r.online), 1);

  // ── Revenue breakdown ──────────────────────────────────────────────────────
  const categories = [
    { label: "New Students",    amount: newRev,     color: "#E8490F",      pct: grandTotal > 0 ? Math.round((newRev    / grandTotal) * 100) : 0 },
    { label: "Current / Old",   amount: oldRev,     color: "#16a34a",      pct: grandTotal > 0 ? Math.round((oldRev    / grandTotal) * 100) : 0 },
    { label: "Zoom / Virtual",  amount: zoomRev,    color: "#7c3aed",      pct: grandTotal > 0 ? Math.round((zoomRev   / grandTotal) * 100) : 0 },
    { label: "Online Courses",  amount: onlineTotal, color: "#8b5cf6",     pct: grandTotal > 0 ? Math.round((onlineTotal / grandTotal) * 100) : 0 },
  ];

  const recentRegs = (recentRegsRaw ?? []) as any[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Section label ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--dark)" }}>
            Business Overview
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: ".78rem", color: "var(--muted)" }}>
            {fmtMonth(now.toISOString())} · live snapshot
          </p>
        </div>
      </div>

      {/* ── Hero KPI Grid ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px" }}>

        {/* Revenue — dark hero card */}
        <div style={{
          background: "#0f1a14", borderRadius: "14px", padding: "22px 24px",
          display: "flex", flexDirection: "column", gap: "10px", minHeight: "138px",
        }}>
          <div style={{ fontSize: "9.5px", fontWeight: 700, color: "rgba(255,255,255,.38)", textTransform: "uppercase", letterSpacing: ".14em" }}>
            Monthly Revenue
          </div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            KES {grandTotal.toLocaleString()}
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "auto" }}>
            <div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "2px" }}>Students</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>KES {walkInTotal.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "2px" }}>Online</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#818cf8" }}>KES {onlineTotal.toLocaleString()}</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "2px" }}>Net</div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: netRevenue >= 0 ? "#4ade80" : "#f87171" }}>
                KES {netRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Total Students */}
        <Link href="/dashboard/owner/students" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#fff", border: "1px solid rgba(17,17,17,.07)", borderRadius: "14px",
            padding: "20px 22px", borderTop: "3px solid #3b82f6", height: "100%",
            cursor: "pointer",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(59,130,246,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-user-graduate" style={{ color: "#3b82f6", fontSize: ".9rem" }} />
              </div>
              <i className="fas fa-arrow-up-right-from-square" style={{ color: "rgba(17,17,17,.18)", fontSize: ".6rem" }} />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--dark)", lineHeight: 1, marginTop: "12px" }}>{totalStudents}</div>
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--dark)", marginTop: "4px" }}>Total Students</div>
            <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "2px" }}>
              {newCount} new · {oldCount} current · {zoomCount} zoom · {onlineStudentCount} platform
            </div>
          </div>
        </Link>

        {/* Active Members */}
        <Link href="/dashboard/owner/members" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#fff", border: "1px solid rgba(17,17,17,.07)", borderRadius: "14px",
            padding: "20px 22px", borderTop: `3px solid ${expiringSoonCount > 0 ? "#b45309" : "var(--teal2)"}`, height: "100%",
            cursor: "pointer",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `rgba(${expiringSoonCount > 0 ? "180,83,9" : "0,168,107"},.1)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-id-card" style={{ color: expiringSoonCount > 0 ? "#b45309" : "var(--teal2)", fontSize: ".9rem" }} />
              </div>
              <i className="fas fa-arrow-up-right-from-square" style={{ color: "rgba(17,17,17,.18)", fontSize: ".6rem" }} />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--dark)", lineHeight: 1, marginTop: "12px" }}>{activeMemberCount}</div>
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--dark)", marginTop: "4px" }}>Active Members</div>
            <div style={{ fontSize: ".65rem", color: expiringSoonCount > 0 ? "#b45309" : "var(--muted)", marginTop: "2px", fontWeight: expiringSoonCount > 0 ? 600 : 400 }}>
              {expiringSoonCount > 0 ? `${expiringSoonCount} expiring this week` : "all subscriptions current"}
            </div>
          </div>
        </Link>

        {/* Bookings */}
        <Link href="/dashboard/owner/bookings" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#fff", border: "1px solid rgba(17,17,17,.07)", borderRadius: "14px",
            padding: "20px 22px", borderTop: `3px solid ${pendingCount > 0 ? "var(--gold)" : "#16a34a"}`, height: "100%",
            cursor: "pointer",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `rgba(${pendingCount > 0 ? "180,131,9" : "22,163,74"},.1)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-calendar-check" style={{ color: pendingCount > 0 ? "var(--gold)" : "#16a34a", fontSize: ".9rem" }} />
              </div>
              <i className="fas fa-arrow-up-right-from-square" style={{ color: "rgba(17,17,17,.18)", fontSize: ".6rem" }} />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--dark)", lineHeight: 1, marginTop: "12px" }}>{bookingsMonth.length}</div>
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--dark)", marginTop: "4px" }}>Bookings This Month</div>
            <div style={{ fontSize: ".65rem", color: pendingCount > 0 ? "#b45309" : "var(--muted)", marginTop: "2px", fontWeight: pendingCount > 0 ? 600 : 400 }}>
              {pendingCount > 0 ? `${pendingCount} pending action` : `${confirmedCount} confirmed`}
            </div>
          </div>
        </Link>
      </div>

      {/* ── Revenue strip ──────────────────────────────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px",
        background: "rgba(17,17,17,.08)", borderRadius: "10px", overflow: "hidden",
        border: "1px solid rgba(17,17,17,.08)",
      }}>
        {[
          { label: "Student Revenue",  value: `KES ${walkInTotal.toLocaleString()}`,           sub: `${studentRegsMonth.length} registration${studentRegsMonth.length !== 1 ? "s" : ""}`, color: "var(--teal2)" },
          { label: "Online Revenue",   value: `KES ${onlineTotal.toLocaleString()}`,            sub: `${onlinePays.length} payment${onlinePays.length !== 1 ? "s" : ""}`,                   color: "#8b5cf6"      },
          { label: "Total Expenses",   value: `KES ${totalExpenses.toLocaleString()}`,          sub: "issued this period",                                                                   color: "#f87171"      },
          { label: "Net Revenue",      value: `KES ${Math.abs(netRevenue).toLocaleString()}`,   sub: netRevenue >= 0 ? "profit after expenses" : "deficit — review expenses",               color: netRevenue >= 0 ? "#16a34a" : "#dc2626" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: "#fff", padding: "14px 18px" }}>
            <div style={{ fontSize: "9.5px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "6px" }}>
              {label}
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "3px" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>

        {/* Monthly revenue trend */}
        <div className="card">
          <div className="card-head">
            <h3><i className="fas fa-chart-bar" style={{ marginRight: "7px" }} />Revenue Trend</h3>
            <span style={{ color: "var(--muted2)", fontSize: ".72rem" }}>Last 6 months</span>
          </div>
          <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "11px" }}>
            {monthlyRows.map((row) => {
              const total    = row.walkIn + row.online;
              const pctTotal = Math.round((total / maxMonthly) * 100);
              const pctWI    = total > 0 ? Math.round((row.walkIn / total) * 100) : 0;
              return (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--muted)", width: "56px", flexShrink: 0 }}>{row.label}</span>
                  <div style={{ flex: 1, height: "9px", background: "var(--dark3)", borderRadius: "5px", overflow: "hidden", display: "flex" }}>
                    <div style={{ width: `${pctTotal * (pctWI / 100)}%`, background: "var(--teal2)", transition: "width .4s" }} />
                    <div style={{ width: `${pctTotal * ((100 - pctWI) / 100)}%`, background: "#8b5cf6", transition: "width .4s" }} />
                  </div>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--dark)", minWidth: "86px", textAlign: "right" }}>
                    {total > 0 ? `KES ${total.toLocaleString()}` : <span style={{ color: "var(--muted2)", fontWeight: 400 }}>—</span>}
                  </span>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: "14px", marginTop: "2px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "var(--muted)" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--teal2)", display: "inline-block" }} /> Students
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "var(--muted)" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#8b5cf6", display: "inline-block" }} /> Online
              </span>
            </div>
          </div>
        </div>

        {/* Revenue by category */}
        <div className="card">
          <div className="card-head">
            <h3><i className="fas fa-layer-group" style={{ marginRight: "7px" }} />Revenue Breakdown</h3>
            <Link href="/dashboard/owner/financials" style={{ fontSize: ".7rem", color: "var(--teal2)", textDecoration: "none", fontWeight: 600 }}>
              Full report <i className="fas fa-arrow-right" />
            </Link>
          </div>
          <div style={{ padding: "14px 20px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {categories.map(({ label, amount, color, pct }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <span style={{ fontSize: ".74rem", fontWeight: 600, color: "var(--dark)" }}>{label}</span>
                  <span style={{ fontSize: ".72rem", fontWeight: 700, color }}>KES {amount.toLocaleString()}</span>
                </div>
                <div style={{ height: "5px", background: "var(--dark3)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px", transition: "width .4s" }} />
                </div>
                <div style={{ fontSize: ".6rem", color: "var(--muted)", marginTop: "2px", textAlign: "right" }}>{pct}% of total</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── People at a Glance ─────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--muted)", marginBottom: "10px" }}>
          People at a Glance
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {[
            { label: "New Students",    count: newCount,           href: "/dashboard/owner/students", sub: "first-time enrolments",  color: "#E8490F",     icon: "fa-user-plus"  },
            { label: "Current / Old",   count: oldCount,           href: "/dashboard/owner/students", sub: "returning students",     color: "#16a34a",     icon: "fa-user-check" },
            { label: "Zoom / Virtual",  count: zoomCount,          href: "/dashboard/owner/students", sub: "remote live classes",    color: "#7c3aed",     icon: "fa-video"      },
            { label: "Online Platform", count: onlineStudentCount, href: "/dashboard/owner/students", sub: "self-registered",        color: "#2563eb",     icon: "fa-globe"      },
            { label: "Team Members",    count: staff.length,       href: "/dashboard/owner/team",     sub: `${staff.filter((s) => s.role === "teacher").length} teachers`, color: "var(--gold)", icon: "fa-users" },
          ].map(({ label, count, href, sub, color, icon }) => (
            <Link key={label} href={href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#fff", border: "1px solid rgba(17,17,17,.07)", borderRadius: "12px",
                padding: "16px 18px", cursor: "pointer",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{count}</div>
                  <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: `color-mix(in srgb, ${color} 12%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`fas ${icon}`} style={{ color, fontSize: ".85rem" }} />
                  </div>
                </div>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--dark)", marginTop: "8px" }}>{label}</div>
                <div style={{ fontSize: ".63rem", color: "var(--muted)", marginTop: "2px" }}>{sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Payments ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-receipt" style={{ marginRight: "7px" }} />Recent Payments</h3>
          <Link href="/dashboard/owner/students" style={{ fontSize: ".72rem", color: "var(--teal2)", textDecoration: "none", fontWeight: 600 }}>
            View all <i className="fas fa-arrow-right" />
          </Link>
        </div>
        {recentRegs.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className="fas fa-receipt" style={{ fontSize: "1.8rem", opacity: .15, display: "block", marginBottom: "12px" }} />
            No payments recorded yet
          </div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Recorded By</th>
                  <th>Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {recentRegs.map((r: any) => {
                  const meta = TYPE_META[r.student_type] ?? { label: r.student_type, color: "var(--muted)" };
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="td-main">{r.customer_name || "—"}</div>
                        {r.customer_phone && (
                          <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>{r.customer_phone}</div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          fontSize: ".68rem", fontWeight: 700, padding: "2px 9px",
                          borderRadius: "100px", whiteSpace: "nowrap",
                          background: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
                          color: meta.color,
                          border: `1px solid color-mix(in srgb, ${meta.color} 25%, transparent)`,
                        }}>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: ".84rem" }}>KES {(r.amount ?? 0).toLocaleString()}</span>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                        {METHOD_LABELS[r.method] ?? r.method ?? "—"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                        {(r.recorder as any)?.full_name ?? "—"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: ".78rem", whiteSpace: "nowrap" }}>
                        {fmtDate(r.created_at)} · {fmtTime(r.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
