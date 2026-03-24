"use client";

import { useEffect, useState } from "react";

type Correction = {
  id:               string;
  record_type:      string;
  record_id:        string;
  record_label:     string | null;
  note:             string;
  submitted_at:     string;
  status:           string;
  owner_response:   string | null;
  reviewed_at:      string | null;
  recorded_amount:  number | null;
  correct_amount:   number | null;
  submitted_by_profile: { full_name: string; role: string } | null;
};

const TYPE_ICONS: Record<string, string> = {
  booking: "fa-calendar-alt",
  student: "fa-user-graduate",
  member:  "fa-id-card",
  payment: "fa-money-bill-wave",
};
const TYPE_COLORS: Record<string, string> = {
  booking: "#2563eb",
  student: "#db2777",
  member:  "#7c3aed",
  payment: "#b45309",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

function ResponseModal({ correction, onClose, onDone }: {
  correction: Correction;
  onClose: () => void;
  onDone: () => void;
}) {
  const [response, setResponse] = useState(correction.owner_response ?? "");
  const [status,   setStatus]   = useState<"reviewed" | "resolved">("reviewed");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res  = await fetch("/api/corrections", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: correction.id, status, owner_response: response.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onDone(); onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = { width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)", borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "500px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>
            <i className="fas fa-pen-to-square" style={{ color: "var(--teal2)", marginRight: "8px" }} />Review Correction
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}><i className="fas fa-times" /></button>
        </div>

        {/* Original note */}
        <div style={{ background: "rgba(180,131,9,.06)", border: "1px solid rgba(180,131,9,.2)", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#b45309", marginBottom: "5px" }}>
            <i className={`fas ${TYPE_ICONS[correction.record_type] ?? "fa-file"}`} style={{ marginRight: "5px" }} />
            {correction.record_type} · {correction.record_label ?? correction.record_id}
          </div>
          <div style={{ fontSize: ".85rem", color: "var(--dark)", lineHeight: 1.5 }}>{correction.note}</div>
          {correction.recorded_amount != null && correction.correct_amount != null && (() => {
            const diff      = correction.correct_amount - correction.recorded_amount;
            const underpaid = diff > 0;
            return (
              <div style={{
                marginTop: "10px", display: "flex", alignItems: "center", gap: "8px",
                background: underpaid ? "rgba(220,38,38,.07)" : "rgba(180,131,9,.07)",
                border: underpaid ? "1px solid rgba(220,38,38,.2)" : "1px solid rgba(180,131,9,.2)",
                borderRadius: "6px", padding: "7px 10px",
              }}>
                <i className={`fas ${underpaid ? "fa-arrow-trend-down" : "fa-arrow-trend-up"}`}
                   style={{ color: underpaid ? "#dc2626" : "#b45309", fontSize: ".82rem" }} />
                <div>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: underpaid ? "#dc2626" : "#b45309" }}>
                    {underpaid ? "Underpaid" : "Overpaid"} by KES {Math.abs(diff).toLocaleString()}
                  </div>
                  <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>
                    Recorded KES {correction.recorded_amount.toLocaleString()} → Correct KES {correction.correct_amount.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })()}
          <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: "8px" }}>
            Submitted by <strong>{correction.submitted_by_profile?.full_name ?? "—"}</strong> ({correction.submitted_by_profile?.role}) · {fmtDate(correction.submitted_at)} {fmtTime(correction.submitted_at)}
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "6px" }}>
              Your Response / Notes (optional)
            </label>
            <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3} placeholder="e.g. Corrected — updated payment to KES 2,500 in the system." style={inp} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "8px" }}>
              Mark As
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["reviewed", "resolved"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)} style={{
                  flex: 1, padding: "8px", borderRadius: "7px", cursor: "pointer", fontWeight: 700, fontSize: ".78rem",
                  background: status === s ? (s === "resolved" ? "rgba(22,163,74,.1)" : "rgba(37,99,235,.1)") : "rgba(17,17,17,.04)",
                  border:     status === s ? (s === "resolved" ? "1px solid rgba(22,163,74,.4)" : "1px solid rgba(37,99,235,.4)") : "1px solid rgba(17,17,17,.12)",
                  color:      status === s ? (s === "resolved" ? "#16a34a" : "#2563eb") : "var(--muted)",
                }}>
                  <i className={`fas ${s === "resolved" ? "fa-check-circle" : "fa-eye"}`} style={{ marginRight: "5px" }} />
                  {s === "reviewed" ? "Reviewed" : "Resolved"}
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: ".72rem", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, border: "none", cursor: "pointer" }}>
              {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "7px" }} />Saving…</> : <><i className="fas fa-check" style={{ marginRight: "7px" }} />Save & Mark {status}</>}
            </button>
            <button type="button" onClick={onClose} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OwnerCorrectionsPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<"pending" | "reviewed" | "resolved">("pending");
  const [reviewing,   setReviewing]   = useState<Correction | null>(null);

  function load(status = tab) {
    setLoading(true);
    fetch(`/api/corrections?status=${status}`)
      .then((r) => r.json())
      .then((j) => setCorrections(j.corrections ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(tab); }, [tab]);

  const tabs: { key: typeof tab; label: string; icon: string }[] = [
    { key: "pending",  label: "Pending",  icon: "fa-clock"        },
    { key: "reviewed", label: "Reviewed", icon: "fa-eye"          },
    { key: "resolved", label: "Resolved", icon: "fa-check-circle" },
  ];

  const tabColors: Record<string, string> = {
    pending:  "#b45309",
    reviewed: "#2563eb",
    resolved: "#16a34a",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Correction Requests</h2>
          <p>Flags submitted by managers — review and apply corrections</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const isActive = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
              fontSize: ".8rem", fontWeight: 700,
              background: isActive ? tabColors[t.key] : "rgba(17,17,17,.04)",
              border:     isActive ? `1px solid ${tabColors[t.key]}` : "1px solid rgba(17,17,17,.1)",
              color: isActive ? "#fff" : "var(--muted)",
              transition: "all .15s",
            }}>
              <i className={`fas ${t.icon}`} style={{ fontSize: ".75rem" }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading…
          </div>
        ) : corrections.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className="fas fa-flag" style={{ fontSize: "1.8rem", opacity: .2, display: "block", marginBottom: "12px" }} />
            No {tab} corrections
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(17,17,17,.03)", borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  {["Record", "Note", "Submitted By", "Date", tab !== "pending" ? "Response" : "", "Actions"].filter(Boolean).map((h) => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corrections.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}>
                    {/* Record */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
                          background: `${TYPE_COLORS[c.record_type] ?? "#6b7280"}18`,
                          border: `1px solid ${TYPE_COLORS[c.record_type] ?? "#6b7280"}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <i className={`fas ${TYPE_ICONS[c.record_type] ?? "fa-file"}`} style={{ fontSize: ".72rem", color: TYPE_COLORS[c.record_type] ?? "#6b7280" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: ".72rem", fontWeight: 700, color: TYPE_COLORS[c.record_type] ?? "#6b7280", textTransform: "uppercase", letterSpacing: ".05em" }}>{c.record_type}</div>
                          <div style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--dark)" }}>{c.record_label ?? c.record_id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Note */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", maxWidth: "320px" }}>
                      <div style={{ fontSize: ".82rem", color: "var(--dark)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.note}</div>
                      {c.recorded_amount != null && c.correct_amount != null && (() => {
                        const diff = c.correct_amount - c.recorded_amount;
                        const underpaid = diff > 0;
                        return (
                          <div style={{
                            marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "7px",
                            background: underpaid ? "rgba(220,38,38,.07)" : "rgba(180,131,9,.07)",
                            border: underpaid ? "1px solid rgba(220,38,38,.2)" : "1px solid rgba(180,131,9,.2)",
                            borderRadius: "6px", padding: "5px 10px",
                          }}>
                            <i className={`fas ${underpaid ? "fa-arrow-trend-down" : "fa-arrow-trend-up"}`}
                               style={{ fontSize: ".72rem", color: underpaid ? "#dc2626" : "#b45309" }} />
                            <div>
                              <div style={{ fontSize: ".72rem", fontWeight: 700, color: underpaid ? "#dc2626" : "#b45309" }}>
                                {underpaid ? "Underpaid" : "Overpaid"} by KES {Math.abs(diff).toLocaleString()}
                              </div>
                              <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>
                                Recorded KES {c.recorded_amount.toLocaleString()} → Correct KES {c.correct_amount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Submitted by */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--dark)" }}>{c.submitted_by_profile?.full_name ?? "—"}</div>
                      <div style={{ fontSize: ".68rem", color: "var(--muted)", textTransform: "capitalize" }}>{c.submitted_by_profile?.role}</div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: ".78rem", color: "var(--dark)" }}>{fmtDate(c.submitted_at)}</div>
                      <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{fmtTime(c.submitted_at)}</div>
                    </td>

                    {/* Owner response (reviewed/resolved only) */}
                    {tab !== "pending" && (
                      <td style={{ padding: "12px 14px", verticalAlign: "middle", maxWidth: "200px" }}>
                        <div style={{ fontSize: ".78rem", color: "var(--muted)", fontStyle: c.owner_response ? "normal" : "italic" }}>
                          {c.owner_response ?? "No response recorded"}
                        </div>
                        {c.reviewed_at && <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "3px" }}>{fmtDate(c.reviewed_at)}</div>}
                      </td>
                    )}

                    {/* Actions */}
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      {tab === "pending" ? (
                        <button onClick={() => setReviewing(c)} style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "5px 12px", borderRadius: "6px", fontSize: ".75rem", fontWeight: 600, cursor: "pointer",
                          background: "rgba(180,131,9,.09)", border: "1px solid rgba(180,131,9,.3)", color: "#b45309",
                        }}>
                          <i className="fas fa-pen-to-square" /> Review
                        </button>
                      ) : (
                        <button onClick={() => setReviewing(c)} style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "5px 12px", borderRadius: "6px", fontSize: ".75rem", fontWeight: 600, cursor: "pointer",
                          background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.12)", color: "var(--muted)",
                        }}>
                          <i className="fas fa-eye" /> View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewing && (
        <ResponseModal
          correction={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => load(tab)}
        />
      )}
    </div>
  );
}
