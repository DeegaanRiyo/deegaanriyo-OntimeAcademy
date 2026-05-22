"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Expense = {
  id:                string;
  title:             string;
  category:          string;
  amount:            number;
  payment_method:    string | null;
  reference:         string | null;
  notes:             string | null;
  recorded_at:       string;
  status:            "issued" | "pending" | "approved" | "rejected";
  requires_approval: boolean;
  approved_at:       string | null;
  issued_at:         string | null;
  rejection_reason:  string | null;
  recorder_name:     string;
  approver_name:     string | null;
};

type Tab = "issued" | "pending" | "approved" | "rejected";

// ─── Constants ────────────────────────────────────────────────────────────────

const APPROVAL_THRESHOLD = 5000;

const CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: "salary",    label: "Salary",    icon: "fa-user-tie"          },
  { value: "rent",      label: "Rent",      icon: "fa-building"          },
  { value: "utilities", label: "Utilities", icon: "fa-bolt"              },
  { value: "supplies",  label: "Supplies",  icon: "fa-box"               },
  { value: "transport", label: "Transport", icon: "fa-car"               },
  { value: "other",     label: "Other",     icon: "fa-receipt"           },
];

const METHODS: { value: string; label: string }[] = [
  { value: "cash",          label: "Cash"          },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mpesa",         label: "M-Pesa"        },
];

const CAT_COLORS: Record<string, string> = {
  salary:    "#8b5cf6",
  rent:      "#2563eb",
  utilities: "#b45309",
  supplies:  "var(--teal2)",
  transport: "#16a34a",
  other:     "#6b7280",
};

const STATUS_CONFIG: Record<Tab, { label: string; color: string; icon: string }> = {
  issued:   { label: "Issued",   color: "#16a34a", icon: "fa-check-circle"  },
  pending:  { label: "Pending",  color: "#b45309", icon: "fa-clock"         },
  approved: { label: "Approved", color: "#2563eb", icon: "fa-thumbs-up"     },
  rejected: { label: "Rejected", color: "#dc2626", icon: "fa-times-circle"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function catLabel(v: string) { return CATEGORIES.find((c) => c.value === v)?.label ?? v; }
function catColor(v: string) { return CAT_COLORS[v] ?? "#6b7280"; }
function catIcon(v: string)  { return CATEGORIES.find((c) => c.value === v)?.icon ?? "fa-receipt"; }

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)",
  borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: ".65rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "6px",
};
const thStyle: React.CSSProperties = {
  padding: "8px 14px", textAlign: "left", fontSize: ".62rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap",
};

// ─── Record Expense Modal ─────────────────────────────────────────────────────

function RecordExpenseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: "", category: "other", amount: "",
    payment_method: "cash", reference: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const amt           = Number(form.amount) || 0;
  const needsApproval = amt >= APPROVAL_THRESHOLD;

  const set = (k: string, v: string) => { setForm((p) => ({ ...p, [k]: v })); setError(null); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim())                      { setError("Title is required."); return; }
    if (amt <= 0)                                 { setError("Enter a valid amount."); return; }
    if (!needsApproval && !form.payment_method)  { setError("Select a payment method."); return; }

    setSaving(true); setError(null);
    try {
      const res  = await fetch("/api/expenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title, category: form.category, amount: amt,
          payment_method: needsApproval ? undefined : form.payment_method,
          reference: form.reference || undefined, notes: form.notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onSaved(); onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "500px", width: "100%", padding: "24px", gap: 0, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0 }}>
            <i className="fas fa-file-invoice-dollar" style={{ color: "var(--teal2)", marginRight: "8px" }} />
            Record Expense
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <span style={lbl}>Description <span style={{ color: "#dc2626" }}>*</span></span>
            <input style={inp} placeholder="e.g. Monthly office rent, Staff salary — John" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div>
            <span style={lbl}>Category</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => set("category", c.value)} style={{
                  padding: "6px 12px", borderRadius: "7px", fontSize: ".75rem", fontWeight: 600, cursor: "pointer",
                  background: form.category === c.value ? `${catColor(c.value)}18` : "rgba(17,17,17,.04)",
                  border: form.category === c.value ? `1px solid ${catColor(c.value)}60` : "1px solid rgba(17,17,17,.1)",
                  color: form.category === c.value ? catColor(c.value) : "var(--muted)",
                }}>
                  <i className={`fas ${c.icon}`} style={{ marginRight: "5px" }} />{c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={lbl}>Amount (KES) <span style={{ color: "#dc2626" }}>*</span></span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--muted)", flexShrink: 0 }}>KES</span>
              <input style={{ ...inp }} type="number" min={1} step={1} placeholder="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
            </div>
            {needsApproval && amt > 0 && (
              <div style={{ marginTop: "8px", background: "rgba(180,131,9,.07)", border: "1px solid rgba(180,131,9,.25)", borderRadius: "7px", padding: "8px 12px", fontSize: ".75rem", color: "#92400e", display: "flex", gap: "8px" }}>
                <i className="fas fa-exclamation-triangle" style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>Amounts of KES 5,000 or more require <strong>owner approval</strong> before issuing. This will be sent as a request.</span>
              </div>
            )}
          </div>

          {!needsApproval && (
            <div>
              <span style={lbl}>Payment Method</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {METHODS.map((m) => (
                  <button key={m.value} type="button" onClick={() => set("payment_method", m.value)} style={{
                    flex: 1, padding: "7px", borderRadius: "7px", fontSize: ".75rem", fontWeight: 600, cursor: "pointer",
                    background: form.payment_method === m.value ? "rgba(15,179,187,.1)" : "rgba(17,17,17,.04)",
                    border: form.payment_method === m.value ? "1px solid rgba(15,179,187,.4)" : "1px solid rgba(17,17,17,.1)",
                    color: form.payment_method === m.value ? "var(--teal2)" : "var(--muted)",
                  }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span style={lbl}>Reference / Receipt No. <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></span>
            <input style={inp} placeholder="e.g. RCP-2024-001" value={form.reference} onChange={(e) => set("reference", e.target.value)} />
          </div>

          <div>
            <span style={lbl}>Notes <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></span>
            <textarea style={{ ...inp, resize: "vertical" }} rows={2} placeholder={needsApproval ? "Explain why this expense is needed…" : "Additional details…"} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>

          {error && (
            <p style={{ color: "#dc2626", fontSize: ".75rem", margin: 0 }}>
              <i className="fas fa-circle-exclamation" style={{ marginRight: "5px" }} />{error}
            </p>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" disabled={saving} style={{
              flex: 2, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px",
              padding: "10px", borderRadius: "8px", fontWeight: 700, fontSize: ".85rem", cursor: saving ? "not-allowed" : "pointer",
              background: needsApproval ? "#b45309" : "var(--teal2)", border: "none", color: "#fff", opacity: saving ? .6 : 1,
            }}>
              {saving
                ? <><i className="fas fa-spinner fa-spin" />Saving…</>
                : needsApproval
                  ? <><i className="fas fa-paper-plane" />Send for Approval</>
                  : <><i className="fas fa-check" />Record Expense</>}
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

// ─── Issue Modal ──────────────────────────────────────────────────────────────

function IssueModal({ expense, onClose, onIssued }: { expense: Expense; onClose: () => void; onIssued: () => void }) {
  const [method,    setMethod]    = useState("cash");
  const [reference, setReference] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res  = await fetch("/api/expenses", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: expense.id, action: "issue", payment_method: method, reference: reference.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onIssued(); onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ margin: 0 }}><i className="fas fa-money-bill-wave" style={{ color: "#16a34a", marginRight: "8px" }} />Issue Expense</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>

        <div style={{ background: "rgba(22,163,74,.06)", border: "1px solid rgba(22,163,74,.2)", borderRadius: "8px", padding: "12px 14px", marginBottom: "18px" }}>
          <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "3px" }}>
            <i className={`fas ${catIcon(expense.category)}`} style={{ marginRight: "5px" }} />{catLabel(expense.category)}
          </div>
          <div style={{ fontWeight: 700, color: "var(--dark)", fontSize: ".95rem" }}>{expense.title}</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>KES {expense.amount.toLocaleString()}</div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <span style={lbl}>Payment Method</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {METHODS.map((m) => (
                <button key={m.value} type="button" onClick={() => setMethod(m.value)} style={{
                  flex: 1, padding: "7px", borderRadius: "7px", fontSize: ".75rem", fontWeight: 600, cursor: "pointer",
                  background: method === m.value ? "rgba(22,163,74,.1)" : "rgba(17,17,17,.04)",
                  border: method === m.value ? "1px solid rgba(22,163,74,.4)" : "1px solid rgba(17,17,17,.1)",
                  color: method === m.value ? "#16a34a" : "var(--muted)",
                }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span style={lbl}>Reference / Receipt No. <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></span>
            <input style={inp} placeholder="e.g. RCP-0045" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: ".75rem", margin: 0 }}><i className="fas fa-circle-exclamation" style={{ marginRight: "5px" }} />{error}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: "10px", borderRadius: "8px", fontWeight: 700, fontSize: ".85rem", cursor: saving ? "not-allowed" : "pointer",
              background: "#16a34a", border: "none", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: saving ? .6 : 1,
            }}>
              {saving ? <><i className="fas fa-spinner fa-spin" />Issuing…</> : <><i className="fas fa-check-circle" />Confirm & Issue</>}
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

export default function ManagerExpensesPage() {
  const [expenses,    setExpenses]    = useState<Expense[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<Tab>("issued");
  const [showForm,    setShowForm]    = useState(false);
  const [issueTarget, setIssueTarget] = useState<Expense | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((j) => setExpenses(j.expenses ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const byTab = (t: Tab) => expenses.filter((e) => e.status === t);
  const counts = { issued: byTab("issued").length, pending: byTab("pending").length, approved: byTab("approved").length, rejected: byTab("rejected").length };
  const rows   = byTab(tab);

  const totalIssued  = byTab("issued").reduce((s, e) => s + e.amount, 0);
  const totalPending = byTab("pending").reduce((s, e) => s + e.amount, 0);

  const TABS: Tab[] = ["issued", "pending", "approved", "rejected"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Expenses</h2>
          <p>Record and track operational expenses</p>
        </div>
        <div className="sec-actions">
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <i className="fas fa-plus" /> Record Expense
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "140px", background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "14px 16px", borderTop: "3px solid #16a34a" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>KES {totalIssued.toLocaleString()}</div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>Total Issued</div>
        </div>
        <div style={{ flex: 1, minWidth: "140px", background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "14px 16px", borderTop: "3px solid #b45309" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>KES {totalPending.toLocaleString()}</div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>Pending Approval</div>
        </div>
        {counts.approved > 0 && (
          <div style={{ flex: 1, minWidth: "140px", background: "rgba(37,99,235,.04)", border: "1px solid rgba(37,99,235,.2)", borderRadius: "10px", padding: "14px 16px", borderTop: "3px solid #2563eb" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2563eb", lineHeight: 1 }}>{counts.approved}</div>
            <div style={{ fontSize: ".72rem", color: "#2563eb", marginTop: "4px", fontWeight: 700 }}>Approved — Ready to Issue</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const cfg      = STATUS_CONFIG[t];
          const isActive = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "9px 16px", borderRadius: "9px", cursor: "pointer",
              fontSize: ".8rem", fontWeight: 700,
              background: isActive ? cfg.color : "rgba(17,17,17,.04)",
              border: isActive ? `1px solid ${cfg.color}` : "1px solid rgba(17,17,17,.1)",
              color: isActive ? "#fff" : "var(--muted)", transition: "all .15s",
            }}>
              <i className={`fas ${cfg.icon}`} style={{ fontSize: ".72rem" }} />
              {cfg.label}
              <span style={{
                padding: "1px 7px", borderRadius: "8px", fontSize: ".65rem", fontWeight: 800,
                background: isActive ? "rgba(255,255,255,.25)" : "rgba(17,17,17,.08)",
                color: isActive ? "#fff" : "var(--muted)",
              }}>{counts[t]}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `2px solid ${STATUS_CONFIG[tab].color}`, display: "flex", alignItems: "center", gap: "8px", background: "#fafafa" }}>
          <i className={`fas ${STATUS_CONFIG[tab].icon}`} style={{ color: STATUS_CONFIG[tab].color }} />
          <span style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--dark)" }}>{STATUS_CONFIG[tab].label}</span>
          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
            {rows.length === 0 ? "None" : `${rows.length} expense${rows.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className={`fas ${STATUS_CONFIG[tab].icon}`} style={{ fontSize: "1.8rem", opacity: .2, display: "block", marginBottom: "12px" }} />
            No {STATUS_CONFIG[tab].label.toLowerCase()} expenses
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(17,17,17,.03)", borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Amount</th>
                  {tab === "issued"   && <><th style={thStyle}>Method</th><th style={thStyle}>Issued</th></>}
                  {tab === "pending"  && <th style={thStyle}>Submitted</th>}
                  {tab === "approved" && <th style={thStyle}>Approved</th>}
                  {tab === "rejected" && <><th style={thStyle}>Reason</th><th style={thStyle}>Date</th></>}
                  {tab === "approved" && <th style={thStyle}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>{e.title}</div>
                      {e.notes && <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "1px" }}>{e.notes}</div>}
                    </td>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                      <span style={{ fontSize: ".72rem", fontWeight: 700, color: catColor(e.category), background: `${catColor(e.category)}14`, border: `1px solid ${catColor(e.category)}30`, borderRadius: "5px", padding: "2px 8px", whiteSpace: "nowrap" }}>
                        <i className={`fas ${catIcon(e.category)}`} style={{ marginRight: "4px" }} />{catLabel(e.category)}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle", fontWeight: 800, fontSize: ".9rem", color: tab === "rejected" ? "var(--muted)" : "var(--dark)" }}>
                      KES {e.amount.toLocaleString()}
                    </td>
                    {tab === "issued" && (
                      <>
                        <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".78rem", color: "var(--muted)", textTransform: "capitalize" }}>
                          {e.payment_method?.replace("_", " ") ?? "—"}
                          {e.reference && <div style={{ fontSize: ".65rem" }}>{e.reference}</div>}
                        </td>
                        <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".75rem", color: "var(--muted)" }}>{fmtDate(e.issued_at)}</td>
                      </>
                    )}
                    {tab === "pending" && (
                      <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".75rem", color: "var(--muted)" }}>{fmtDate(e.recorded_at)}</td>
                    )}
                    {tab === "approved" && (
                      <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".75rem", color: "#16a34a", fontWeight: 600 }}>{fmtDate(e.approved_at)}</td>
                    )}
                    {tab === "rejected" && (
                      <>
                        <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".78rem", color: "#dc2626" }}>{e.rejection_reason ?? "—"}</td>
                        <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".75rem", color: "var(--muted)" }}>{fmtDate(e.recorded_at)}</td>
                      </>
                    )}
                    {tab === "approved" && (
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <button
                          onClick={() => setIssueTarget(e)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "6px", fontSize: ".75rem", fontWeight: 700, cursor: "pointer", background: "rgba(22,163,74,.1)", border: "1px solid rgba(22,163,74,.3)", color: "#16a34a" }}
                        >
                          <i className="fas fa-money-bill-wave" /> Issue
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

      {showForm    && <RecordExpenseModal onClose={() => setShowForm(false)} onSaved={load} />}
      {issueTarget && <IssueModal expense={issueTarget} onClose={() => setIssueTarget(null)} onIssued={load} />}
    </div>
  );
}
