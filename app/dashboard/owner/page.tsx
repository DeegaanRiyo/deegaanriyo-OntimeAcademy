import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function service() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

const TYPE_LABELS: Record<string, string> = {
  membership:     "Membership",
  physical_class: "Physical Class",
  space_rental:   "Space Rental",
};
const TYPE_COLORS: Record<string, string> = {
  membership:     "var(--teal2)",
  physical_class: "#3b82f6",
  space_rental:   "var(--gold)",
};
const TYPE_BADGE: Record<string, string> = {
  membership:     "badge tl",
  physical_class: "badge bl",
  space_rental:   "badge gd",
};
const METHOD_LABELS: Record<string, string> = {
  cash:          "Cash",
  bank_transfer: "Bank Transfer",
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}
function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { month: "short", year: "numeric" });
}
function daysUntil(iso: string) {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(iso).getTime() - n.getTime()) / 86_400_000);
}
function memberSubStatus(sub: any | null, now: Date, sevenDaysLater: Date): "active" | "expiring" | "expired" | "none" {
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
    { data: walkInsRaw },
    { data: onlinePaysRaw },
    { data: allWalkInsHistoryRaw },
    { data: allOnlinePaysHistoryRaw },
    { data: staffRaw },
    { data: membersRaw },
    { data: studentsRaw },
    { data: physicalStudentsRaw },
    { data: pendingBookingsRaw },
    { data: recentActivityRaw },
    { data: issuedExpensesRaw },
  ] = await Promise.all([
    // This month walk-in revenue
    admin.from("walk_in_payments").select("id, type, amount").gte("created_at", monthStart),

    // This month online revenue
    admin.from("payments").select("id, amount, course_id, courses(title)").eq("status", "paid").gte("created_at", monthStart),

    // All-time walk-ins for trend
    admin.from("walk_in_payments").select("id, type, amount, created_at").order("created_at", { ascending: false }),

    // All-time online pays for trend
    admin.from("payments").select("id, amount, created_at").eq("status", "paid").order("created_at", { ascending: false }),

    // Staff counts
    admin.from("profiles").select("id, role").in("role", ["manager", "receptionist", "teacher", "social_media"]),

    // Members (for active count)
    admin.from("profiles").select("id, members(subscription_end)").eq("role", "member"),

    // Online students
    admin.from("profiles").select("id").eq("role", "student"),

    // Physical students this month
    admin.from("walk_in_payments").select("id").eq("type", "physical_class"),

    // Pending bookings
    admin.from("bookings").select("id").eq("status", "pending"),

    // Recent walk-in activity (last 8)
    admin
      .from("walk_in_payments")
      .select("id, type, customer_name, customer_phone, amount, method, created_at, recorder:profiles!walk_in_payments_recorded_by_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(8),

    // Issued expenses (for deduction)
    admin
      .from("expenses")
      .select("amount")
      .eq("status", "issued"),
  ]);

  // ── Revenue this month ────────────────────────────────────────────────────
  const walkIns       = (walkInsRaw ?? []) as any[];
  const onlinePays    = (onlinePaysRaw ?? []) as any[];

  const membershipRev = walkIns.filter((p) => p.type === "membership").reduce((s, p) => s + (p.amount ?? 0), 0);
  const physClassRev  = walkIns.filter((p) => p.type === "physical_class").reduce((s, p) => s + (p.amount ?? 0), 0);
  const spaceRentRev  = walkIns.filter((p) => p.type === "space_rental").reduce((s, p) => s + (p.amount ?? 0), 0);
  const walkInTotal   = membershipRev + physClassRev + spaceRentRev;
  const onlineTotal   = onlinePays.reduce((s, p: any) => s + (p.amount ?? 0), 0);
  const grandTotal    = walkInTotal + onlineTotal;

  // ── Revenue by category (for 4 KPI cards) ────────────────────────────────
  const categories = [
    { label: "Membership",     amount: membershipRev, color: "var(--teal2)", icon: "fa-id-card",   count: walkIns.filter((p) => p.type === "membership").length     },
    { label: "Physical Class", amount: physClassRev,  color: "#3b82f6",     icon: "fa-chalkboard-teacher", count: walkIns.filter((p) => p.type === "physical_class").length },
    { label: "Space Rental",   amount: spaceRentRev,  color: "var(--gold)", icon: "fa-door-open",  count: walkIns.filter((p) => p.type === "space_rental").length    },
    { label: "Online Courses", amount: onlineTotal,   color: "#8b5cf6",     icon: "fa-laptop",     count: onlinePays.length                                          },
  ];

  // ── Monthly trend (last 6 months) ────────────────────────────────────────
  const allWalkIns   = (allWalkInsHistoryRaw   ?? []) as any[];
  const allOnlinePays = (allOnlinePaysHistoryRaw ?? []) as any[];

  const monthlyMap: Record<string, { label: string; walkIn: number; online: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { label: d.toLocaleDateString("en-KE", { month: "short", year: "numeric" }), walkIn: 0, online: 0 };
  }
  for (const p of allWalkIns) {
    const key = (p.created_at as string).slice(0, 7);
    if (monthlyMap[key]) monthlyMap[key].walkIn += p.amount ?? 0;
  }
  for (const p of allOnlinePays) {
    const key = (p.created_at as string).slice(0, 7);
    if (monthlyMap[key]) monthlyMap[key].online += p.amount ?? 0;
  }
  const monthlyRows = Object.values(monthlyMap);
  const maxMonthly  = Math.max(...monthlyRows.map((r) => r.walkIn + r.online), 1);

  // ── Walk-in category breakdown (bar chart) ────────────────────────────────
  const maxWalkIn = Math.max(membershipRev, physClassRev, spaceRentRev, onlineTotal, 1);

  // ── People stats ──────────────────────────────────────────────────────────
  const staff         = (staffRaw ?? []) as any[];
  const membersDb     = (membersRaw ?? []) as any[];
  const onlineStudents = (studentsRaw ?? []).length;
  const physStudents   = (physicalStudentsRaw ?? []).length;
  const pendingCount   = (pendingBookingsRaw ?? []).length;

  let activeMemberCount = 0, expiringSoonCount = 0;
  for (const m of membersDb) {
    const sub    = Array.isArray(m.members) ? m.members[0] : m.members;
    const status = memberSubStatus(sub, now, sevenDaysLater);
    if (status === "active" || status === "expiring") activeMemberCount++;
    if (status === "expiring") expiringSoonCount++;
  }

  const recentActivity   = (recentActivityRaw ?? []) as any[];
  const totalExpenses    = (issuedExpensesRaw ?? []).reduce((s, e: any) => s + (e.amount ?? 0), 0);
  const netRevenue       = grandTotal - totalExpenses;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Revenue banner ──────────────────────────────────────────────── */}
      <div style={{
        background: "#0f1a14", borderRadius: "10px", padding: "18px 20px",
        display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: "6px" }}>
            Revenue · {fmtMonth(now.toISOString())}
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            KES {grandTotal.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,.35)", marginTop: "6px" }}>
            {walkIns.length + onlinePays.length} total transactions
          </div>
        </div>
        <div style={{ width: "1px", background: "rgba(255,255,255,.1)", alignSelf: "stretch" }} />
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>Walk-in</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent)" }}>KES {walkInTotal.toLocaleString()}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,.3)", marginTop: "2px" }}>{walkIns.length} payments</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>Online</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#818cf8" }}>KES {onlineTotal.toLocaleString()}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,.3)", marginTop: "2px" }}>{onlinePays.length} payments</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>Expenses</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f87171" }}>− KES {totalExpenses.toLocaleString()}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,.3)", marginTop: "2px" }}>issued this period</div>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,.1)", alignSelf: "stretch" }} />
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>Net</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: netRevenue >= 0 ? "#4ade80" : "#f87171" }}>KES {netRevenue.toLocaleString()}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,.3)", marginTop: "2px" }}>after expenses</div>
          </div>
          {pendingCount > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>Pending</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#fbbf24" }}>{pendingCount} booking{pendingCount !== 1 ? "s" : ""}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,.3)", marginTop: "2px" }}>awaiting action</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Revenue by category (4 cards) ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
        {categories.map(({ label, amount, color, icon, count }) => {
          const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
          return (
            <div key={label} style={{
              background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px",
              padding: "14px 16px", borderTop: `3px solid ${color}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--muted)" }}>{label}</div>
                <i className={`fas ${icon}`} style={{ fontSize: ".8rem", color, opacity: .7 }} />
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>
                KES {amount.toLocaleString()}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <div style={{ flex: 1, height: "4px", background: "var(--dark3)", borderRadius: "2px" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "2px", transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: ".65rem", fontWeight: 700, color, minWidth: "28px" }}>{pct}%</span>
              </div>
              <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "4px" }}>{count} transaction{count !== 1 ? "s" : ""}</div>
            </div>
          );
        })}
      </div>

      {/* ── Monthly revenue trend ─────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-chart-bar" /> Monthly Revenue Trend</h3>
          <span style={{ color: "var(--muted2)", fontSize: ".75rem" }}>Last 6 months</span>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {monthlyRows.map((row) => {
            const total    = row.walkIn + row.online;
            const pctTotal = Math.round((total / maxMonthly) * 100);
            const pctWI    = total > 0 ? Math.round((row.walkIn / total) * 100) : 0;
            return (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", width: "68px", flexShrink: 0 }}>{row.label}</span>
                <div style={{ flex: 1, height: "10px", background: "var(--dark3)", borderRadius: "5px", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${pctTotal * (pctWI / 100)}%`, background: "var(--teal2)", borderRadius: "5px 0 0 5px", transition: "width .4s" }} />
                  <div style={{ width: `${pctTotal * ((100 - pctWI) / 100)}%`, background: "#8b5cf6", borderRadius: "0 5px 5px 0", transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--dark)", minWidth: "90px", textAlign: "right" }}>
                  {total > 0 ? `KES ${total.toLocaleString()}` : <span style={{ color: "var(--muted2)", fontWeight: 400 }}>—</span>}
                </span>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", color: "var(--muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--teal2)", display: "inline-block" }} /> Walk-in
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", color: "var(--muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#8b5cf6", display: "inline-block" }} /> Online
            </span>
          </div>
        </div>
      </div>

      {/* ── People snapshot ───────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "8px" }}>
          People Snapshot
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
          {[
            { label: "Active Members",    count: activeMemberCount, sub: expiringSoonCount > 0 ? `${expiringSoonCount} expiring` : "all clear", color: "var(--teal2)", icon: "fa-id-card"            },
            { label: "Physical Students", count: physStudents,      sub: "enrolled",     color: "#3b82f6",     icon: "fa-chalkboard-teacher" },
            { label: "Online Students",   count: onlineStudents,    sub: "registered",   color: "#8b5cf6",     icon: "fa-laptop"             },
            { label: "Staff Members",     count: staff.length,      sub: `${staff.filter((s) => s.role === "teacher").length} teachers`, color: "var(--gold)", icon: "fa-users"  },
          ].map(({ label, count, sub, color, icon }) => (
            <div key={label} style={{
              background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px",
              padding: "14px 16px",
              boxShadow: "0 1px 3px rgba(0,0,0,.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{count}</div>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `color-mix(in srgb, ${color} 12%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className={`fas ${icon}`} style={{ color, fontSize: ".82rem" }} />
                </div>
              </div>
              <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--dark)", marginTop: "6px" }}>{label}</div>
              <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "2px" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent walk-in payments ────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-receipt" /> Recent Payments</h3>
          <a href="/dashboard/owner/financials" style={{ fontSize: ".72rem", color: "var(--teal2)", textDecoration: "none", fontWeight: 600 }}>
            View all <i className="fas fa-arrow-right" />
          </a>
        </div>
        {recentActivity.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className="fas fa-receipt" style={{ fontSize: "1.5rem", opacity: .2, display: "block", marginBottom: "10px" }} />
            No payments recorded yet
          </div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Recorded by</th>
                  <th>Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div className="td-main">{p.customer_name || "—"}</div>
                      {p.customer_phone && (
                        <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>{p.customer_phone}</div>
                      )}
                    </td>
                    <td>
                      <span className={TYPE_BADGE[p.type] ?? "badge"}>
                        <span className="badge-dot" />{TYPE_LABELS[p.type] ?? p.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>KES {(p.amount ?? 0).toLocaleString()}</td>
                    <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                      {METHOD_LABELS[p.method] ?? p.method ?? "—"}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                      {p.recorder?.full_name ?? "—"}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: ".78rem", whiteSpace: "nowrap" }}>
                      {fmtDate(p.created_at)} · {fmtTime(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
