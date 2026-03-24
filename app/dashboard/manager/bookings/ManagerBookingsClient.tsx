"use client";

import { useState } from "react";
import CorrectionNoteModal from "@/components/dashboard/CorrectionNoteModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  setup: string | null;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  hours: number;
  status: string;
  notes: string | null;
  estimated_cost: number | null;
  total_paid: number;
  spaces: { id: string; name: string; slug: string } | null;
};

type RichBooking = Booking & {
  stage: ColKey;
  autoPromoted: boolean;
  concludedReason?: "completed" | "cancelled" | "rejected" | "no_show" | "overrun";
};

type ColKey = "pending" | "confirmed" | "today" | "active" | "concluded";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function computeEnd(startTime: string, hours: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total  = h * 60 + m + hours * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function fmtDate(iso: string, today: string): string {
  if (iso === today) return "Today";
  const tom = new Date(today + "T00:00:00");
  tom.setDate(tom.getDate() + 1);
  if (iso === tom.toISOString().split("T")[0]) return "Tomorrow";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
}

// ─── Auto-stage enrichment ────────────────────────────────────────────────────

function enrich(bookings: Booking[], today: string, nowTime: string): RichBooking[] {
  return bookings.map((b): RichBooking => {
    const endTime = b.end_time ?? computeEnd(b.start_time, b.hours ?? 1);
    if (b.status === "completed") return { ...b, stage: "concluded", autoPromoted: false, concludedReason: "completed" };
    if (b.status === "cancelled") return { ...b, stage: "concluded", autoPromoted: false, concludedReason: "cancelled" };
    if (b.status === "rejected")  return { ...b, stage: "concluded", autoPromoted: false, concludedReason: "rejected"  };
    if (b.status === "active") {
      if (b.booking_date < today || (b.booking_date === today && endTime <= nowTime))
        return { ...b, stage: "concluded", autoPromoted: true, concludedReason: "overrun" };
      return { ...b, stage: "active", autoPromoted: false };
    }
    if (b.status === "confirmed") {
      if (b.booking_date < today)  return { ...b, stage: "concluded", autoPromoted: true, concludedReason: "no_show" };
      if (b.booking_date === today) {
        if (endTime <= nowTime)      return { ...b, stage: "concluded", autoPromoted: true, concludedReason: "no_show" };
        if (b.start_time <= nowTime) return { ...b, stage: "active",    autoPromoted: true };
        return { ...b, stage: "today", autoPromoted: false };
      }
      return { ...b, stage: "confirmed", autoPromoted: false };
    }
    return { ...b, stage: "pending", autoPromoted: false };
  });
}

// ─── Status badge ──────────────────────────────────────────────────────────────

const REASON_BADGES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  no_show:   { label: "No Show",    color: "#6b7280", bg: "rgba(107,114,128,.1)", border: "rgba(107,114,128,.25)" },
  overrun:   { label: "Time Ended", color: "#b45309", bg: "rgba(180,131,9,.1)",   border: "rgba(180,131,9,.25)"   },
  completed: { label: "Completed",  color: "#16a34a", bg: "rgba(22,163,74,.1)",   border: "rgba(22,163,74,.25)"   },
  cancelled: { label: "Cancelled",  color: "#6b7280", bg: "rgba(107,114,128,.1)", border: "rgba(107,114,128,.25)" },
  rejected:  { label: "Rejected",   color: "#dc2626", bg: "rgba(220,38,38,.1)",   border: "rgba(220,38,38,.25)"   },
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  bookings:  Booking[];
  allSpaces: { id: string; name: string; slug: string }[];
  today:     string;
  nowTime:   string;
}

export default function ManagerBookingsClient({ bookings, allSpaces, today, nowTime }: Props) {
  const [activeTab,  setActiveTab]  = useState<ColKey>("pending");
  const [flagTarget, setFlagTarget] = useState<{ id: string; label: string } | null>(null);

  const rich    = enrich(bookings, today, nowTime);
  const byTime  = (a: RichBooking, b: RichBooking) =>
    a.booking_date.localeCompare(b.booking_date) || a.start_time.localeCompare(b.start_time);

  const columns: { key: ColKey; title: string; color: string; icon: string; rows: RichBooking[] }[] = [
    { key: "pending",   title: "Pending",          color: "#b45309",      icon: "fa-clock",
      rows: rich.filter((b) => b.stage === "pending").sort(byTime) },
    { key: "confirmed", title: "Confirmed",         color: "#2563eb",      icon: "fa-calendar-check",
      rows: rich.filter((b) => b.stage === "confirmed").sort(byTime) },
    { key: "today",     title: "Today's Scheduled", color: "var(--teal2)", icon: "fa-calendar-day",
      rows: rich.filter((b) => b.stage === "today").sort((a, b) => a.start_time.localeCompare(b.start_time)) },
    { key: "active",    title: "In Progress",       color: "#16a34a",      icon: "fa-circle-dot",
      rows: rich.filter((b) => b.stage === "active").sort((a, b) => a.start_time.localeCompare(b.start_time)) },
    { key: "concluded", title: "Concluded",         color: "#6b7280",      icon: "fa-flag-checkered",
      rows: rich.filter((b) => b.stage === "concluded")
        .sort((a, b) => b.booking_date.localeCompare(a.booking_date) || b.start_time.localeCompare(a.start_time)) },
  ];

  const active = columns.find((c) => c.key === activeTab)!;

  const thStyle: React.CSSProperties = {
    padding: "8px 14px", textAlign: "left",
    fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Bookings</h2>
          <p>View-only overview — flag any record to report a correction to the owner</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {columns.map((col) => {
          const isActive = activeTab === col.key;
          return (
            <button key={col.key} onClick={() => setActiveTab(col.key)} style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", borderRadius: "9px", cursor: "pointer",
              fontSize: ".8rem", fontWeight: 700,
              background: isActive ? col.color : "rgba(17,17,17,.04)",
              border: isActive ? `1px solid ${col.color}` : "1px solid rgba(17,17,17,.1)",
              color: isActive ? "#fff" : "var(--muted)", transition: "all .15s",
            }}>
              <i className={`fas ${col.icon}`} style={{ fontSize: ".75rem", opacity: isActive ? 1 : .7 }} />
              {col.title}
              <span style={{
                padding: "1px 7px", borderRadius: "8px", fontSize: ".65rem", fontWeight: 800,
                background: isActive ? "rgba(255,255,255,.25)" : "rgba(17,17,17,.08)",
                color: isActive ? "#fff" : "var(--muted)",
              }}>
                {col.rows.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "12px 16px", borderBottom: `2px solid ${active.color}`,
          display: "flex", alignItems: "center", gap: "8px", background: "#fafafa",
        }}>
          <i className={`fas ${active.icon}`} style={{ color: active.color }} />
          <span style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--dark)" }}>{active.title}</span>
          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
            {active.rows.length === 0 ? "No bookings" : `${active.rows.length} booking${active.rows.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {active.rows.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className={`fas ${active.icon}`} style={{ fontSize: "1.8rem", opacity: .2, display: "block", marginBottom: "12px" }} />
            No {active.title.toLowerCase()} bookings
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(17,17,17,.03)", borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Space</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Hours</th>
                  <th style={thStyle}>Estimated</th>
                  <th style={thStyle}>Payment</th>
                  {activeTab === "concluded" && <th style={thStyle}>Reason</th>}
                  <th style={thStyle}>Flag</th>
                </tr>
              </thead>
              <tbody>
                {active.rows.map((b) => {
                  const endTime     = b.end_time ?? computeEnd(b.start_time, b.hours ?? 1);
                  const outstanding = b.estimated_cost !== null ? b.estimated_cost - b.total_paid : null;
                  const noPayFlag   = b.stage === "concluded" && b.total_paid === 0 && (b.estimated_cost === null || b.estimated_cost > 0) && !["cancelled","rejected"].includes(b.concludedReason ?? "");
                  const rowBg       = noPayFlag ? "rgba(220,38,38,.03)" : undefined;

                  return (
                    <tr key={b.id} style={{ borderBottom: "1px solid rgba(17,17,17,.06)", background: rowBg }}>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, fontSize: ".85rem", color: "var(--dark)" }}>{b.visitor_name}</div>
                        <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "1px" }}>{b.visitor_phone}</div>
                      </td>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        {b.spaces ? (
                          <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--teal2)", background: "rgba(193,68,14,.07)", border: "1px solid rgba(193,68,14,.18)", borderRadius: "5px", padding: "3px 9px", whiteSpace: "nowrap" }}>
                            {b.spaces.name}
                          </span>
                        ) : <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--dark)" }}>{fmtDate(b.booking_date, today)}</div>
                        <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: "1px" }}>{fmt12(b.start_time)} – {fmt12(endTime)}</div>
                      </td>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <span style={{ fontSize: ".8rem", color: "var(--dark)" }}>{b.hours} hr{b.hours !== 1 ? "s" : ""}</span>
                      </td>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <span style={{ fontSize: ".8rem", color: "var(--dark)", fontWeight: 600 }}>
                          {b.estimated_cost !== null ? `KES ${b.estimated_cost.toLocaleString()}` : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        {noPayFlag ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: ".72rem", fontWeight: 700, color: "#dc2626", background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "5px", padding: "3px 8px" }}>
                            <i className="fas fa-triangle-exclamation" /> No payment
                          </span>
                        ) : outstanding !== null && outstanding > 0 ? (
                          <div>
                            <div style={{ fontSize: ".72rem", color: "#b45309", fontWeight: 700 }}>KES {outstanding.toLocaleString()} due</div>
                            {b.total_paid > 0 && <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Paid: KES {b.total_paid.toLocaleString()}</div>}
                          </div>
                        ) : b.total_paid > 0 ? (
                          <span style={{ fontSize: ".72rem", fontWeight: 600, color: "#16a34a" }}>
                            <i className="fas fa-check-circle" style={{ marginRight: "4px" }} />KES {b.total_paid.toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                      {activeTab === "concluded" && (
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          {b.concludedReason && REASON_BADGES[b.concludedReason] && (() => {
                            const badge = REASON_BADGES[b.concludedReason!]!;
                            return (
                              <span style={{ fontSize: ".68rem", fontWeight: 700, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: "5px", padding: "2px 7px", whiteSpace: "nowrap" }}>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </td>
                      )}
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <button
                          onClick={() => setFlagTarget({ id: b.id, label: `${b.visitor_name} – ${fmtDate(b.booking_date, today)} ${fmt12(b.start_time)}` })}
                          title="Flag for correction"
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, cursor: "pointer", background: "rgba(180,131,9,.07)", border: "1px solid rgba(180,131,9,.25)", color: "#b45309" }}
                        >
                          <i className="fas fa-flag" /> Flag
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {flagTarget && (
        <CorrectionNoteModal
          recordType="booking"
          recordId={flagTarget.id}
          recordLabel={flagTarget.label}
          onClose={() => setFlagTarget(null)}
        />
      )}
    </div>
  );
}
