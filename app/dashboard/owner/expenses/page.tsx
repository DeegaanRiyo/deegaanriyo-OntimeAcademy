"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Expense = {
  id:               string;
  title:            string;
  category:         string;
  amount:           number;
  notes:            string | null;
  recorded_at:      string;
  status:           "pending" | "approved" | "rejected";
  recorder_name:    string;
  rejection_reason: string | null;
  approved_at:      string | null;
};

type Tab = "pending" | "approved" | "rejected";

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  salary: "#8b5cf6", rent: "#2563eb", utilities: "#b45309",
  supplies: "var(--teal2)", transport: "#16a34a", other: "#6b7280",
};
const CAT_ICONS: Record<string, string> = {
  salary: "fa-user-tie", rent: "fa-building", utilities: "fa-bolt",
  supplies: "fa-box", transport: "fa-car", other: "fa-receipt",
};
const CAT_LABELS: Record<string, string> = {
  salary: "Salary", rent: "Rent", utilities: "Utilities",
  supplies: "Supplies", transport: "Transport", other: "Other",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)",
  borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical",
};
const labelSt: React.CSSProperties = {
  display: "block", fontSize: ".65rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "6px",
};
const thStyle: React.CSSProperties = {
  padding: "8px 14px", textAlign: "left", fontSize: ".62rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap",
};

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({ expense, onClose, onDone }: { expense: Expense; onClose: () => void; onDone: () => void }) {
  const [action,   setAction]   = useState<"approve" | "reject">("approve");
  const [reason,   setReason]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (action === "reject" && !reason.trim()) { setError("Please provide a reason for rejection."); return; }
    setSaving(true); setError(null);
    try {
      const res  = await fetch("/api/expenses", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: expense.id, action, rejection_reason: reason.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onDone(); onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const color = action === "approve" ? "#16a34a" : "#dc2626";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "480px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ margin: 0 }}><i className="fas fa-file-invoice-dollar" style={{ color: "var(--teal2)", marginRight: "8px" }} />Review Expense Request</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>

        {/* Expense summary */}
        <div style={{ background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.1)", borderRadius: "8px", padding: "14px", marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: CAT_COLORS[expense.category] ?? "#6b7280", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "3px" }}>
                <i className={`fas ${CAT_ICONS[expense.category] ?? "fa-receipt"}`} style={{ marginRight: "4px" }} />
                {CAT_LABELS[expense.category] ?? expense.category}
              </div>
              <div style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--dark)" }}>{expense.title}</div>
              {expense.notes && <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: "4px", lineHeight: 1.4 }}>{expense.notes}</div>}
              <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "6px" }}>
                Submitted by <strong>{expense.recorder_name}</strong> · {fmtDate(expense.recorded_at)} {fmtTime(expense.recorded_at)}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--dark)" }}>KES {expense.amount.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Approve / Reject toggle */}
          <div>
            <span style={labelSt}>Decision</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={() => { setAction("approve"); setError(null); }} style={{
                flex: 1, padding: "9px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: ".82rem",
                background: action === "approve" ? "rgba(22,163,74,.1)" : "rgba(17,17,17,.04)",
                border:     action === "approve" ? "1px solid rgba(22,163,74,.4)" : "1px solid rgba(17,17,17,.12)",
                color:      action === "approve" ? "#16a34a" : "var(--muted)",
              }}>
                <i className="fas fa-thumbs-up" style={{ marginRight: "6px" }} />Approve
              </button>
              <button type="button" onClick={() => { setAction("reject"); setError(null); }} style={{
                flex: 1, padding: "9px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: ".82rem",
                background: action === "reject" ? "rgba(220,38,38,.08)" : "rgba(17,17,17,.04)",
                border:     action === "reject" ? "1px solid rgba(220,38,38,.35)" : "1px solid rgba(17,17,17,.12)",
                color:      action === "reject" ? "#dc2626" : "var(--muted)",
              }}>
                <i className="fas fa-thumbs-down" style={{ marginRight: "6px" }} />Reject
              </button>
            </div>
          </div>

          {action === "reject" && (
            <div>
              <span style={labelSt}>Reason for rejection <span style={{ color: "#dc2626" }}>*</span></span>
              <textarea style={inp} rows={2} placeholder="e.g. Budget exceeded for this month. Please re-submit next cycle." value={reason} onChange={(e) => { setReason(e.target.value); setError(null); }} />
            </div>
          )}

          {error && <p style={{ color: "#dc2626", fontSize: ".75rem", margin: 0 }}><i className="fas fa-circle-exclamation" style={{ marginRight: "5px" }} />{error}</p>}

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: "10px", borderRadius: "8px", fontWeight: 700, fontSize: ".85rem",
              cursor: saving ? "not-allowed" : "pointer", background: color, border: "none", color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: saving ? .6 : 1,
            }}>
              {saving
                ? <><i className="fas fa-spinner fa-spin" />Saving…</>
                : action === "approve"
                  ? <><i className="fas fa-check" />Approve Request</>
                  : <><i className="fas fa-times" />Reject Request</>}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "8px", fontWeight: 600, fontSize: ".85rem", cursor: "pointer", background: "rgba(17,17,17,.05)", border: "1px solid rgba(17,17,17,.12)", color: "var(--muted)" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OwnerExpensesPage() {
  const [expenses,   setExpenses]   = useState<Expense[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<Tab>("pending");
  const [reviewing,  setReviewing]  = useState<Expense | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((j) => setExpenses((j.expenses ?? []).filter((e: any) => e.requires_approval)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const byTab   = (t: Tab) => expenses.filter((e) => e.status === t);
  const pending  = byTab("pending");
  const approved = byTab("approved");
  const rejected = byTab("rejected");
  const rows     = byTab(tab);

  const totalApproved = approved.reduce((s, e) => s + e.amount, 0);
  const totalPending  = pending.reduce((s, e) => s + e.amount, 0);

  const TAB_CONFIG: { key: Tab; label: string; color: string; icon: string }[] = [
    { key: "pending",  label: "Pending Review", color: "#b45309", icon: "fa-clock"        },
    { key: "approved", label: "Approved",        color: "#16a34a", icon: "fa-thumbs-up"   },
    { key: "rejected", label: "Rejected",        color: "#dc2626", icon: "fa-times-circle" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Expense Requests</h2>
          <p>Approve or reject expense requests submitted by managers</p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "140px", background: pending.length > 0 ? "rgba(180,131,9,.05)" : "#fff", border: pending.length > 0 ? "1px solid rgba(180,131,9,.25)" : "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "14px 16px", borderTop: "3px solid #b45309" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{pending.length}</div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>Awaiting Review</div>
          {totalPending > 0 && <div style={{ fontSize: ".68rem", color: "#b45309", marginTop: "2px", fontWeight: 700 }}>KES {totalPending.toLocaleString()}</div>}
        </div>
        <div style={{ flex: 1, minWidth: "140px", background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "14px 16px", borderTop: "3px solid #16a34a" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{approved.length}</div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>Approved (pending issue)</div>
          {totalApproved > 0 && <div style={{ fontSize: ".68rem", color: "#16a34a", marginTop: "2px", fontWeight: 700 }}>KES {totalApproved.toLocaleString()}</div>}
        </div>
        <div style={{ flex: 1, minWidth: "140px", background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "14px 16px", borderTop: "3px solid #dc2626" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{rejected.length}</div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>Rejected</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {TAB_CONFIG.map((t) => {
          const isActive = tab === t.key;
          const count    = byTab(t.key).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "9px 16px", borderRadius: "9px", cursor: "pointer",
              fontSize: ".8rem", fontWeight: 700,
              background: isActive ? t.color : "rgba(17,17,17,.04)",
              border: isActive ? `1px solid ${t.color}` : "1px solid rgba(17,17,17,.1)",
              color: isActive ? "#fff" : "var(--muted)", transition: "all .15s",
            }}>
              <i className={`fas ${t.icon}`} style={{ fontSize: ".72rem" }} />
              {t.label}
              <span style={{ padding: "1px 7px", borderRadius: "8px", fontSize: ".65rem", fontWeight: 800, background: isActive ? "rgba(255,255,255,.25)" : "rgba(17,17,17,.08)", color: isActive ? "#fff" : "var(--muted)" }}>
                {count}
              </span>
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
        ) : rows.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className="fas fa-file-invoice-dollar" style={{ fontSize: "1.8rem", opacity: .2, display: "block", marginBottom: "12px" }} />
            No {tab} expense requests
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(17,17,17,.03)", borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Submitted By</th>
                  <th style={thStyle}>Date</th>
                  {tab === "rejected" && <th style={thStyle}>Rejection Reason</th>}
                  {tab === "pending"  && <th style={thStyle}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>{e.title}</div>
                      {e.notes && <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "2px", lineHeight: 1.4 }}>{e.notes}</div>}
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      <span style={{ fontSize: ".72rem", fontWeight: 700, color: CAT_COLORS[e.category] ?? "#6b7280", background: `${CAT_COLORS[e.category] ?? "#6b7280"}14`, border: `1px solid ${CAT_COLORS[e.category] ?? "#6b7280"}30`, borderRadius: "5px", padding: "2px 8px", whiteSpace: "nowrap" }}>
                        <i className={`fas ${CAT_ICONS[e.category] ?? "fa-receipt"}`} style={{ marginRight: "4px" }} />{CAT_LABELS[e.category] ?? e.category}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", fontWeight: 800, fontSize: ".95rem", color: "var(--dark)" }}>
                      KES {e.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", fontSize: ".82rem", fontWeight: 600, color: "var(--dark)" }}>
                      {e.recorder_name}
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", fontSize: ".75rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(e.recorded_at)}
                    </td>
                    {tab === "rejected" && (
                      <td style={{ padding: "12px 14px", verticalAlign: "middle", fontSize: ".78rem", color: "#dc2626" }}>
                        {e.rejection_reason ?? "—"}
                      </td>
                    )}
                    {tab === "pending" && (
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <button onClick={() => setReviewing(e)} style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "5px 14px", borderRadius: "6px", fontSize: ".75rem", fontWeight: 700,
                          cursor: "pointer", background: "rgba(180,131,9,.09)", border: "1px solid rgba(180,131,9,.3)", color: "#b45309",
                        }}>
                          <i className="fas fa-pen-to-square" /> Review
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewing && <ReviewModal expense={reviewing} onClose={() => setReviewing(null)} onDone={load} />}
    </div>
  );
}
