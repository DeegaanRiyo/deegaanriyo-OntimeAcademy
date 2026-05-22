"use client";

import React, { useState } from "react";

// ── DeleteModal ───────────────────────────────────────────────────────────────

function DeleteBookingModal({ booking, onClose, onDeleted }: {
  booking:   { id: string; visitor_name: string | null };
  onClose:   () => void;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/bookings/${booking.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete");
      onDeleted(booking.id);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div style={{ maxWidth: "380px", width: "100%", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,.15)", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#dc2626", display: "flex", alignItems: "center", gap: "8px", fontSize: ".92rem" }}>
            <i className="fas fa-trash" />Delete Booking
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(17,17,17,.4)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        <p style={{ fontSize: ".85rem", color: "var(--dark)", marginBottom: "8px" }}>
          Delete booking for <strong>{booking.visitor_name ?? "this visitor"}</strong>? This cannot be undone.
        </p>
        {error && (
          <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "9px 12px", color: "#dc2626", fontSize: ".8rem", marginBottom: "12px" }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button onClick={confirm} disabled={loading}
            style={{ flex: 1, height: "38px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: ".82rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {loading ? <><i className="fas fa-spinner fa-spin" />Deleting…</> : <><i className="fas fa-trash" />Delete</>}
          </button>
          <button onClick={onClose}
            style={{ flex: 1, height: "38px", background: "rgba(17,17,17,.05)", border: "1px solid rgba(17,17,17,.12)", borderRadius: "8px", fontWeight: 700, fontSize: ".82rem", color: "var(--dark)", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Space = { id: string; name: string; slug: string };

type Booking = {
  id:             string;
  visitor_name:   string | null;
  visitor_phone:  string | null;
  setup:          string | null;
  booking_date:   string;
  start_time:     string;
  end_time:       string;
  hours:          number | null;
  status:         string;
  notes:          string | null;
  booked_by:      string | null;
  booked_by_name: string | null;
  estimated_cost: number | null;
  created_at:     string;
  spaces:         Space | null;
  total_paid:     number;
};

type Kpi = {
  total:     number;
  confirmed: number;
  cancelled: number;
  today:     number;
  thisMonth: number;
};

type StatusFilter = "all" | "confirmed" | "cancelled";

interface Props {
  bookings: Booking[];
  spaces:   Space[];
  kpi:      Kpi;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime12(t: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: "Pending",   color: "#b45309", bg: "rgba(180,83,9,.08)",   border: "rgba(180,83,9,.25)"   },
  confirmed: { label: "Confirmed", color: "#16a34a", bg: "rgba(22,163,74,.08)",  border: "rgba(22,163,74,.25)"  },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "rgba(220,38,38,.07)",  border: "rgba(220,38,38,.2)"   },
  completed: { label: "Completed", color: "#2563eb", bg: "rgba(37,99,235,.07)",  border: "rgba(37,99,235,.2)"   },
};

const SETUP_LABELS: Record<string, string> = {
  boardroom: "Boardroom", classroom: "Classroom", theatre: "Theatre",
  u_shape: "U-Shape", hollow: "Hollow Square", cocktail: "Cocktail", custom: "Custom",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookingsClient({ bookings: initialBookings, spaces, kpi }: Props) {
  const [localBookings, setLocalBookings] = useState<Booking[]>(initialBookings);
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("all");
  const [spaceFilter,   setSpaceFilter]   = useState<string>("all");
  const [search,        setSearch]        = useState("");
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set());
  const [deleteTarget,  setDeleteTarget]  = useState<Booking | null>(null);

  const bookings = localBookings;

  const q = search.trim().toLowerCase();

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter)    return false;
    if (spaceFilter  !== "all" && b.spaces?.id !== spaceFilter) return false;
    if (q) {
      const hay = [b.visitor_name, b.visitor_phone, b.spaces?.name, b.booking_date, b.booked_by]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

  const kpiCards = [
    { label: "All-time",   count: kpi.total,     color: "var(--teal2)", icon: "fa-calendar"       },
    { label: "This Month", count: kpi.thisMonth,  color: "#3b82f6",      icon: "fa-calendar-alt"   },
    { label: "Today",      count: kpi.today,      color: "#8b5cf6",      icon: "fa-clock"          },
    { label: "Confirmed",  count: kpi.confirmed,  color: "#16a34a",      icon: "fa-circle-check"   },
    { label: "Cancelled",  count: kpi.cancelled,  color: kpi.cancelled > 0 ? "#dc2626" : "#6b7280", icon: "fa-times-circle"  },
  ];

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all",       label: "All Bookings", count: bookings.length },
    { key: "confirmed", label: "Confirmed",    count: kpi.confirmed   },
    { key: "cancelled", label: "Cancelled",    count: kpi.cancelled   },
  ];

  const statusTabColor: Record<StatusFilter, string> = {
    all: "var(--teal2)", confirmed: "#16a34a", cancelled: "#dc2626",
  };

  const COL_HEADERS = ["Space", "Visitor", "Date", "Time", "Hours", "Setup", "Cost / Paid", "Status", "", ""];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Space Bookings</h2>
          <p>Full history of all space and conference room bookings</p>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
        {kpiCards.map(({ label, count, color, icon }) => (
          <div key={label} style={{
            background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "12px",
            padding: "14px 16px", borderTop: `3px solid ${color}`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{count}</div>
              <i className={`fas ${icon}`} style={{ fontSize: ".85rem", color, opacity: .6 }} />
            </div>
            <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: "5px", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

        {/* Status tabs */}
        <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid rgba(17,17,17,.1)", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
          {statusTabs.map(({ key, label, count }) => {
            const active = statusFilter === key;
            const color  = statusTabColor[key];
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                style={{
                  padding: "7px 14px", border: "none", cursor: "pointer",
                  background: active ? `${color}14` : "transparent",
                  borderRight: "1px solid rgba(17,17,17,.07)",
                  color:  active ? color : "rgba(17,17,17,.45)",
                  fontWeight: active ? 700 : 500,
                  fontSize: ".76rem", transition: "all .1s",
                  display: "flex", alignItems: "center", gap: "5px",
                }}
              >
                {label}
                <span style={{
                  fontSize: ".62rem", fontWeight: 800, padding: "1px 5px", borderRadius: "6px",
                  background: active ? `${color}18` : "rgba(17,17,17,.06)",
                  color: active ? color : "rgba(17,17,17,.35)",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Space filter */}
        {spaces.length > 1 && (
          <select
            value={spaceFilter}
            onChange={(e) => setSpaceFilter(e.target.value)}
            style={{
              height: "34px", padding: "0 10px", borderRadius: "7px",
              border: "1px solid rgba(17,17,17,.12)", fontSize: ".76rem",
              color: "var(--dark)", background: "#fff", cursor: "pointer", outline: "none",
            }}
          >
            <option value="all">All Spaces</option>
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* Search */}
        <div style={{ marginLeft: "auto", position: "relative", display: "flex", alignItems: "center" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: "9px", color: "rgba(17,17,17,.3)", fontSize: ".65rem", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search visitor, date, space…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              height: "34px", paddingLeft: "28px", paddingRight: search ? "28px" : "10px",
              width: "220px", borderRadius: "8px", border: "1px solid rgba(17,17,17,.12)",
              fontSize: ".76rem", color: "var(--dark)", background: "#fff", outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: "6px", background: "none", border: "none", color: "rgba(17,17,17,.3)", cursor: "pointer", fontSize: ".62rem" }}
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "12px", padding: "60px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
          <i className="fas fa-calendar-times" style={{ fontSize: "1.8rem", opacity: .15, display: "block", marginBottom: "12px" }} />
          {q ? `No results for "${search}"` : "No bookings match this filter"}
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "8px 16px 7px", borderBottom: "1px solid rgba(17,17,17,.06)", background: "#fafafa", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: ".68rem", color: "var(--muted)", fontWeight: 600 }}>
              {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
            </span>
            {q && <span style={{ fontSize: ".65rem", color: "var(--teal2)" }}>· filtered</span>}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(17,17,17,.07)" }}>
                  {COL_HEADERS.map((h, i) => (
                    <th key={i} style={{ padding: "8px 14px", textAlign: "left", fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", color: "#6b7280", whiteSpace: "nowrap", background: "rgba(17,17,17,.015)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const ss      = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending;
                  const isToday = b.booking_date === today;
                  const isOpen  = expanded.has(b.id);
                  const balance = (b.estimated_cost ?? 0) - b.total_paid;

                  return (
                    <React.Fragment key={b.id}>
                      <tr
                        onClick={() => toggleExpand(b.id)}
                        style={{
                          borderBottom: isOpen ? "none" : "1px solid rgba(17,17,17,.045)",
                          borderLeft:   isToday ? "3px solid var(--teal2)" : "3px solid transparent",
                          background:   isToday ? "rgba(0,168,107,.018)" : "transparent",
                          cursor:       "pointer",
                          transition:   "background .08s",
                        }}
                        onMouseEnter={(e) => { if (!isToday) (e.currentTarget as HTMLElement).style.background = "rgba(17,17,17,.018)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isToday ? "rgba(0,168,107,.018)" : "transparent"; }}
                      >
                        {/* Space */}
                        <td style={{ padding: "0 14px", height: "44px", verticalAlign: "middle" }}>
                          <div style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--dark)", whiteSpace: "nowrap" }}>
                            {b.spaces?.name ?? "—"}
                          </div>
                          {isToday && (
                            <div style={{ fontSize: ".58rem", fontWeight: 700, color: "var(--teal2)", textTransform: "uppercase", letterSpacing: ".08em" }}>Today</div>
                          )}
                        </td>

                        {/* Visitor */}
                        <td style={{ padding: "0 14px", height: "44px", verticalAlign: "middle" }}>
                          <div style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--dark)", whiteSpace: "nowrap" }}>{b.visitor_name || "—"}</div>
                          {b.visitor_phone && <div style={{ fontSize: "10px", color: "var(--muted)" }}>{b.visitor_phone}</div>}
                        </td>

                        {/* Date */}
                        <td style={{ padding: "0 14px", height: "44px", verticalAlign: "middle", fontSize: ".78rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                          {fmtDate(b.booking_date)}
                        </td>

                        {/* Time */}
                        <td style={{ padding: "0 14px", height: "44px", verticalAlign: "middle", fontSize: ".78rem", color: "var(--dark)", whiteSpace: "nowrap" }}>
                          {fmtTime12(b.start_time)} – {fmtTime12(b.end_time)}
                        </td>

                        {/* Hours */}
                        <td style={{ padding: "0 14px", height: "44px", verticalAlign: "middle", fontSize: ".78rem", color: "var(--muted)", textAlign: "center" }}>
                          {b.hours ? `${b.hours}h` : "—"}
                        </td>

                        {/* Setup */}
                        <td style={{ padding: "0 14px", height: "44px", verticalAlign: "middle", fontSize: ".74rem", color: "var(--muted)" }}>
                          {SETUP_LABELS[b.setup ?? ""] ?? b.setup ?? "—"}
                        </td>

                        {/* Cost / Paid */}
                        <td style={{ padding: "0 14px", height: "44px", verticalAlign: "middle" }}>
                          {b.estimated_cost ? (
                            <>
                              <div style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--dark)" }}>KES {b.estimated_cost.toLocaleString()}</div>
                              <div style={{ fontSize: "10px", fontWeight: 600, color: b.total_paid >= (b.estimated_cost ?? 0) ? "#16a34a" : "#b45309" }}>
                                {b.total_paid > 0
                                  ? b.total_paid >= (b.estimated_cost ?? 0)
                                    ? "Fully paid"
                                    : `KES ${b.total_paid.toLocaleString()} paid · owes ${balance.toLocaleString()}`
                                  : "Unpaid"}
                              </div>
                            </>
                          ) : (
                            <span style={{ fontSize: ".74rem", color: "rgba(17,17,17,.28)" }}>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "0 14px", height: "44px", verticalAlign: "middle" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            padding: "3px 9px", borderRadius: "20px", fontSize: ".68rem", fontWeight: 700,
                            color: ss.color, background: ss.bg, border: `1px solid ${ss.border}`,
                          }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: ss.color, flexShrink: 0 }} />
                            {ss.label}
                          </span>
                        </td>

                        {/* Delete button */}
                        <td style={{ padding: "0 6px", height: "44px", verticalAlign: "middle", width: "1px" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setDeleteTarget(b)}
                            title="Delete booking"
                            style={{ width: "26px", height: "26px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.15)", borderRadius: "6px", cursor: "pointer", color: "#dc2626", fontSize: ".58rem" }}
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </td>

                        {/* Expand chevron */}
                        <td style={{ padding: "0 12px", height: "44px", verticalAlign: "middle", width: "1px" }}>
                          <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: ".58rem", color: "rgba(17,17,17,.25)" }} />
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isOpen && (
                        <tr style={{ borderBottom: "1px solid rgba(17,17,17,.045)", background: "rgba(17,17,17,.012)", borderLeft: "3px solid var(--teal2)" }}>
                          <td colSpan={10} style={{ padding: "12px 18px 14px" }}>
                            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                              {(b.booked_by_name || b.booked_by) && (
                                <div>
                                  <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Booked By</div>
                                  <div style={{ fontSize: ".78rem", color: "var(--dark)" }}>{b.booked_by_name ?? b.booked_by}</div>
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Recorded</div>
                                <div style={{ fontSize: ".78rem", color: "var(--dark)" }}>{fmtDate(b.created_at)}</div>
                              </div>
                              {b.setup && (
                                <div>
                                  <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Room Setup</div>
                                  <div style={{ fontSize: ".78rem", color: "var(--dark)" }}>{SETUP_LABELS[b.setup] ?? b.setup}</div>
                                </div>
                              )}
                              {b.notes && (
                                <div style={{ maxWidth: "400px" }}>
                                  <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Notes</div>
                                  <div style={{ fontSize: ".78rem", color: "var(--dark)", lineHeight: 1.55 }}>{b.notes}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteBookingModal
          booking={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => setLocalBookings((prev) => prev.filter((b) => b.id !== id))}
        />
      )}
    </div>
  );
}
