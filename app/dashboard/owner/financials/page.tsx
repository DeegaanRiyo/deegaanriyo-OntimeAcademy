import { createServerClient } from "@supabase/ssr";
import EmptyState from "@/components/dashboard/EmptyState";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

const TYPE_LABELS: Record<string, string> = {
  membership:     "Membership",
  physical_class: "Physical Class",
  online_class:   "Online Class",
  space_rental:   "Space Rental",
};
const TYPE_COLORS: Record<string, string> = {
  membership:     "var(--teal2)",
  physical_class: "var(--blue)",
  online_class:   "#7c3aed",
  space_rental:   "var(--gold)",
};
const TYPE_BADGE: Record<string, string> = {
  membership:     "badge tl",
  physical_class: "badge bl",
  online_class:   "badge pu",
  space_rental:   "badge gd",
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
  return new Date(iso).toLocaleDateString("en-KE", { month: "short", year: "numeric" });
}

export default async function FinancialsPage() {
  const admin = serviceClient();

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: bkPayRaw },
    { data: mbrPayRaw },
    { data: stuRegRaw },
    { data: allOnlinePaysRaw },
    { data: allExpensesRaw },
  ] = await Promise.all([
    admin.from("booking_payments")
      .select("id, amount, method, created_at, booking:bookings(visitor_name, visitor_phone), recorder:profiles!booking_payments_recorded_by_fkey(full_name)")
      .order("created_at", { ascending: false }),
    admin.from("membership_payments")
      .select("id, amount, method, created_at, payer:profiles!membership_payments_profile_id_fkey(full_name), recorder:profiles!membership_payments_recorded_by_fkey(full_name)")
      .order("created_at", { ascending: false }),
    admin.from("student_registrations")
      .select("id, customer_name, customer_phone, amount, method, created_at, recorder:profiles!student_registrations_recorded_by_fkey(full_name)")
      .order("created_at", { ascending: false }),

    admin
      .from("payments")
      .select("id, student_id, course_id, amount, mpesa_receipt_number, created_at, courses(title, mode), payer:profiles!payments_student_id_fkey(full_name, email)")
      .eq("status", "paid")
      .order("created_at", { ascending: false }),

    admin
      .from("expenses")
      .select("id, title, category, amount, payment_method, reference, notes, recorded_at, issued_at, status, recorded_by")
      .eq("status", "issued")
      .order("issued_at", { ascending: false }),
  ]);

  const bkPays  = (bkPayRaw  ?? []) as any[];
  const mbrPays = (mbrPayRaw ?? []) as any[];
  const stuRegs = (stuRegRaw ?? []) as any[];
  const allWalkIns = [
    ...bkPays.map((p: any)  => ({
      ...p, type: 'space_rental',
      customer_name:  (p.booking as any)?.visitor_name  ?? '—',
      customer_phone: (p.booking as any)?.visitor_phone ?? null,
    })),
    ...mbrPays.map((p: any) => ({
      ...p, type: 'membership',
      customer_name:  (p.payer as any)?.full_name ?? '—',
      customer_phone: null,
    })),
    ...stuRegs.map((p: any) => ({
      ...p, type: 'physical_class',
      customer_name:  p.customer_name  ?? '—',
      customer_phone: p.customer_phone ?? null,
    })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const allOnlinePays = (allOnlinePaysRaw ?? []) as any[];
  const allExpenses   = (allExpensesRaw   ?? []) as any[];

  const totalExpenses = allExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  const CAT_COLORS_EX: Record<string, string> = {
    salary: "#8b5cf6", rent: "#2563eb", utilities: "#b45309",
    supplies: "var(--teal2)", transport: "#16a34a", other: "#6b7280",
  };
  const CAT_LABELS_EX: Record<string, string> = {
    salary: "Salary", rent: "Rent", utilities: "Utilities",
    supplies: "Supplies", transport: "Transport", other: "Other",
  };

  // ── All-time totals ───────────────────────────────────────
  const totalWalkIn  = allWalkIns.reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalOnline  = allOnlinePays.reduce((s, p) => s + (p.amount ?? 0), 0);
  const grandTotal   = totalWalkIn + totalOnline;
  const netTotal     = grandTotal - totalExpenses;

  // ── This month totals ─────────────────────────────────────
  const monthWalkIns    = allWalkIns.filter(p => p.created_at >= monthStart);
  const monthOnlinePays = allOnlinePays.filter(p => p.created_at >= monthStart);
  const monthWalkInTotal  = monthWalkIns.reduce((s, p) => s + (p.amount ?? 0), 0);
  const monthOnlineTotal  = monthOnlinePays.reduce((s, p) => s + (p.amount ?? 0), 0);
  const monthGrandTotal   = monthWalkInTotal + monthOnlineTotal;

  // ── Walk-in breakdown by type ─────────────────────────────
  const walkInByType: Record<string, number> = {};
  for (const p of allWalkIns) {
    walkInByType[p.type] = (walkInByType[p.type] ?? 0) + (p.amount ?? 0);
  }
  const pctWalkIn = (amt: number) => totalWalkIn > 0 ? Math.round((amt / totalWalkIn) * 100) : 0;

  // ── Monthly revenue (last 6 months) ──────────────────────
  const monthlyMap: Record<string, { label: string; walkIn: number; online: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
    monthlyMap[key] = { label, walkIn: 0, online: 0 };
  }
  for (const p of allWalkIns) {
    const key = p.created_at.slice(0, 7);
    if (monthlyMap[key]) monthlyMap[key].walkIn += p.amount ?? 0;
  }
  for (const p of allOnlinePays) {
    const key = p.created_at.slice(0, 7);
    if (monthlyMap[key]) monthlyMap[key].online += p.amount ?? 0;
  }
  const monthlyRows = Object.values(monthlyMap);
  const maxMonthly  = Math.max(...monthlyRows.map(r => r.walkIn + r.online), 1);

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Financials</h2>
          <p>All revenue from walk-in payments and online course enrolments.</p>
        </div>
      </div>

      {/* ── Summary banners ─────────────────────────────── */}
      <div className="col-2" style={{ marginBottom: "14px" }}>

        {/* All-time */}
        <div style={{
          background: "#0f1a14", borderRadius: "8px", padding: "16px 18px",
          display: "flex", flexDirection: "column", gap: "10px",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,.45)",
            textTransform: "uppercase", letterSpacing: ".1em" }}>
            All-time Revenue
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
            KES {grandTotal.toLocaleString()}
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "2px" }}>Walk-in</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>KES {totalWalkIn.toLocaleString()}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,.3)" }}>{allWalkIns.length} payments</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "2px" }}>Online</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--blue)" }}>KES {totalOnline.toLocaleString()}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,.3)" }}>{allOnlinePays.length} payments</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "2px" }}>Expenses</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#f87171" }}>− KES {totalExpenses.toLocaleString()}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,.3)" }}>{allExpenses.length} issued</div>
            </div>
            <div style={{ borderLeft: "1px solid rgba(255,255,255,.1)", paddingLeft: "20px" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "2px" }}>Net</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: netTotal >= 0 ? "#4ade80" : "#f87171" }}>KES {netTotal.toLocaleString()}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,.3)" }}>after expenses</div>
            </div>
          </div>
        </div>

        {/* This month */}
        <div style={{
          background: "var(--dark2)", borderRadius: "8px", padding: "16px 18px",
          display: "flex", flexDirection: "column", gap: "10px",
          border: ".5px solid rgba(17,17,17,.12)",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)",
            textTransform: "uppercase", letterSpacing: ".1em" }}>
            This Month · {fmtMonth(now.toISOString())}
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--dark)", lineHeight: 1 }}>
            KES {monthGrandTotal.toLocaleString()}
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--muted2)", textTransform: "uppercase",
                letterSpacing: ".08em", marginBottom: "2px" }}>Walk-in</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--teal2)" }}>
                KES {monthWalkInTotal.toLocaleString()}
              </div>
              <div style={{ fontSize: "10px", color: "var(--muted2)" }}>{monthWalkIns.length} payments</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--muted2)", textTransform: "uppercase",
                letterSpacing: ".08em", marginBottom: "2px" }}>Online</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--blue)" }}>
                KES {monthOnlineTotal.toLocaleString()}
              </div>
              <div style={{ fontSize: "10px", color: "var(--muted2)" }}>{monthOnlinePays.length} payments</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Monthly trend (last 6 months) ────────────────── */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div className="card-head">
          <h3><i className="fas fa-chart-bar" /> Monthly Revenue</h3>
          <span style={{ color: "var(--muted2)", fontSize: ".75rem" }}>Last 6 months</span>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {monthlyRows.map(row => {
            const total = row.walkIn + row.online;
            const pctTotal = Math.round((total / maxMonthly) * 100);
            const pctWI    = total > 0 ? Math.round((row.walkIn / total) * 100) : 0;
            return (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", width: "64px", flexShrink: 0 }}>{row.label}</span>
                <div style={{ flex: 1, height: "8px", background: "var(--dark3)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${pctTotal * (pctWI / 100)}%`, background: "var(--teal2)", borderRadius: "4px 0 0 4px", transition: "width .4s" }} />
                  <div style={{ width: `${pctTotal * ((100 - pctWI) / 100)}%`, background: "var(--blue)", borderRadius: "0 4px 4px 0", transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--dark)", minWidth: "90px", textAlign: "right" }}>
                  {total > 0 ? `KES ${total.toLocaleString()}` : <span style={{ color: "var(--muted2)", fontWeight: 400 }}>—</span>}
                </span>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", color: "var(--muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--teal2)", display: "inline-block" }} />
              Walk-in
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", color: "var(--muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--blue)", display: "inline-block" }} />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* ── Walk-in breakdown by type ─────────────────────── */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div className="card-head">
          <h3><i className="fas fa-walking" /> Walk-in Revenue by Category</h3>
          <span className="badge tl">KES {totalWalkIn.toLocaleString()}</span>
        </div>
        <div className="hbar-rows">
          {Object.entries(TYPE_LABELS).map(([type, label]) => {
            const amt = walkInByType[type] ?? 0;
            return (
              <div key={type} className="hbar-row">
                <span className="hbar-label">{label}</span>
                <div className="hbar-track">
                  <div className="hbar-fill" style={{ width: `${pctWalkIn(amt)}%`, background: TYPE_COLORS[type] }} />
                </div>
                <span className="hbar-val">KES {amt.toLocaleString()}</span>
              </div>
            );
          })}
          {totalWalkIn === 0 && (
            <p style={{ padding: "4px 0", color: "var(--muted)", fontSize: ".8rem" }}>No walk-in payments recorded yet.</p>
          )}
        </div>
      </div>

      {/* ── Walk-in payments table ────────────────────────── */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div className="card-head">
          <h3><i className="fas fa-hand-holding-usd" /> Walk-in Payments</h3>
          <span style={{ color: "var(--muted2)", fontSize: ".75rem" }}>{allWalkIns.length} total</span>
        </div>
        {allWalkIns.length === 0 ? (
          <EmptyState icon="fas fa-hand-holding-usd" title="No walk-in payments yet" description="Payments recorded by reception will appear here." padding="40px 20px" />
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
                {allWalkIns.map((p: any) => (
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

      {/* ── Issued Expenses table ────────────────────────── */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div className="card-head">
          <h3><i className="fas fa-file-invoice-dollar" /> Issued Expenses</h3>
          <span style={{ fontWeight: 700, color: "#dc2626", fontSize: ".82rem" }}>− KES {totalExpenses.toLocaleString()}</span>
        </div>
        {allExpenses.length === 0 ? (
          <EmptyState icon="fas fa-file-invoice-dollar" title="No issued expenses yet" description="Expenses recorded and issued by managers will appear here." padding="40px 20px" />
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Issued</th>
                </tr>
              </thead>
              <tbody>
                {allExpenses.map((e: any) => (
                  <tr key={e.id}>
                    <td>
                      <div className="td-main">{e.title}</div>
                      {e.notes && <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>{e.notes}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize: ".72rem", fontWeight: 700, color: CAT_COLORS_EX[e.category] ?? "#6b7280", background: `${CAT_COLORS_EX[e.category] ?? "#6b7280"}14`, border: `1px solid ${CAT_COLORS_EX[e.category] ?? "#6b7280"}30`, borderRadius: "5px", padding: "2px 8px" }}>
                        {CAT_LABELS_EX[e.category] ?? e.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "#dc2626" }}>− KES {(e.amount ?? 0).toLocaleString()}</td>
                    <td style={{ color: "var(--muted)", fontSize: ".78rem", textTransform: "capitalize" }}>
                      {e.payment_method?.replace("_", " ") ?? "—"}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: ".78rem", fontFamily: "monospace" }}>
                      {e.reference ?? "—"}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: ".78rem", whiteSpace: "nowrap" }}>
                      {fmtDate(e.issued_at ?? e.recorded_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Online payments table ─────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-mobile-alt" /> Online Course Payments (M-Pesa)</h3>
          <span style={{ color: "var(--muted2)", fontSize: ".75rem" }}>{allOnlinePays.length} total</span>
        </div>
        {allOnlinePays.length === 0 ? (
          <EmptyState icon="fas fa-mobile-alt" title="No online payments yet" description="M-Pesa course enrolment payments will appear here." padding="40px 20px" />
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>M-Pesa Receipt</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allOnlinePays.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div className="td-main">{p.payer?.full_name || "—"}</div>
                      {p.payer?.email && (
                        <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>{p.payer.email}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: ".82rem" }}>{p.courses?.title ?? "—"}</div>
                      {p.courses?.mode && (
                        <div style={{ fontSize: "10.5px", color: "var(--muted)", textTransform: "capitalize" }}>{p.courses.mode}</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>KES {(p.amount ?? 0).toLocaleString()}</td>
                    <td style={{ color: "var(--muted)", fontSize: ".78rem", fontFamily: "monospace" }}>
                      {p.mpesa_receipt_number ?? "—"}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: ".78rem", whiteSpace: "nowrap" }}>
                      {fmtDate(p.created_at)}
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
