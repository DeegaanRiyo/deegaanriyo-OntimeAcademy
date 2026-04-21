"use client";

import { useState, useEffect, useCallback } from "react";

const INTEREST_OPTIONS = [
  { value: "membership",    label: "Co-working Membership" },
  { value: "space_rental",  label: "Space Rental"          },
  { value: "course",        label: "Course / Training"     },
  { value: "general",       label: "General Inquiry"       },
];

const FOLLOW_UP_OPTIONS = [
  { value: "pending",        label: "Pending",        color: "#d97706", bg: "rgba(245,158,11,.1)",  bd: "rgba(245,158,11,.3)"  },
  { value: "contacted",      label: "Contacted",      color: "#3b82f6", bg: "rgba(59,130,246,.1)",  bd: "rgba(59,130,246,.3)"  },
  { value: "converted",      label: "Converted",      color: "#16a34a", bg: "rgba(34,197,94,.1)",   bd: "rgba(34,197,94,.3)"   },
  { value: "not_interested", label: "Not Interested", color: "#6b7280", bg: "rgba(107,114,128,.1)", bd: "rgba(107,114,128,.3)" },
];

type Visitor = {
  id:         string;
  name:       string;
  phone:      string;
  email:      string | null;
  interest:   string;
  notes:      string | null;
  follow_up:  string;
  created_at: string;
};

function statusStyle(val: string) {
  return FOLLOW_UP_OPTIONS.find((o) => o.value === val) ?? FOLLOW_UP_OPTIONS[0];
}

function interestLabel(val: string) {
  return INTEREST_OPTIONS.find((o) => o.value === val)?.label ?? val;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi",
  });
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)",
  borderRadius: "8px", padding: "10px 12px",
  color: "var(--dark)", fontSize: ".85rem", outline: "none", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: ".72rem", fontWeight: 600,
  color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "6px",
};

// ── Log form ────────────────────────────────────────────────────────────────

function LogForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", interest: "membership", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/receptionist/visitors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed"); return; }
    setForm({ name: "", phone: "", email: "", interest: "membership", notes: "" });
    onSaved();
  }

  return (
    <form onSubmit={submit}>
      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
          background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)",
          color: "#f87171", fontSize: ".82rem",
        }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: "7px" }} />{error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Full Name <span style={{ color: "var(--red)" }}>*</span></label>
          <input style={inputStyle} value={form.name} onChange={set("name")} placeholder="e.g. Amina Hassan" required />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Phone <span style={{ color: "var(--red)" }}>*</span></label>
          <input style={inputStyle} value={form.phone} onChange={set("phone")} placeholder="07XX XXX XXX" required />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Email <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <input type="email" style={inputStyle} value={form.email} onChange={set("email")} placeholder="amina@email.com" />
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Interested In <span style={{ color: "var(--red)" }}>*</span></label>
          <select style={inputStyle} value={form.interest} onChange={set("interest")} required>
            {INTEREST_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Notes <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
        <textarea
          rows={2}
          style={{ ...inputStyle, resize: "none" }}
          value={form.notes}
          onChange={set("notes")}
          placeholder="What did they ask about? Any specific requirements?"
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}
        style={{ border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .6 : 1 }}>
        {loading
          ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Saving…</>
          : <><i className="fas fa-user-plus" style={{ marginRight: "8px" }} />Log Visitor</>
        }
      </button>
    </form>
  );
}

// ── Visitor list ────────────────────────────────────────────────────────────

function VisitorList({ visitors, onStatusChange }: {
  visitors: Visitor[];
  onStatusChange: (id: string, val: string) => void;
}) {
  if (visitors.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: ".85rem" }}>
        <i className="fas fa-users" style={{ fontSize: "1.5rem", marginBottom: "10px", display: "block", opacity: .4 }} />
        No visitors logged yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {visitors.map((v) => {
        const st = statusStyle(v.follow_up);
        return (
          <div key={v.id} style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: "10px", padding: "14px 18px",
            display: "flex", alignItems: "flex-start", gap: "14px",
          }}>
            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: "rgba(193,68,14,.12)", border: "1px solid rgba(193,68,14,.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--teal2)", fontSize: ".85rem", fontWeight: 800,
            }}>
              {v.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                <span style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--white)" }}>{v.name}</span>
                <span style={{
                  padding: "2px 9px", borderRadius: "20px", fontSize: ".62rem", fontWeight: 700,
                  background: st.bg, border: `1px solid ${st.bd}`, color: st.color,
                }}>
                  {st.label}
                </span>
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--muted)", marginBottom: "4px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <span><i className="fas fa-phone" style={{ marginRight: "5px", fontSize: ".65rem" }} />{v.phone}</span>
                {v.email && <span><i className="fas fa-envelope" style={{ marginRight: "5px", fontSize: ".65rem" }} />{v.email}</span>}
              </div>
              <div style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: v.notes ? "6px" : 0, display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <span style={{
                  padding: "1px 8px", borderRadius: "4px", fontSize: ".65rem",
                  background: "rgba(15,179,187,.08)", border: "1px solid rgba(15,179,187,.2)", color: "var(--teal2)",
                }}>
                  {interestLabel(v.interest)}
                </span>
                <span style={{ opacity: .55 }}>{fmt(v.created_at)}</span>
              </div>
              {v.notes && (
                <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: "6px", lineHeight: 1.5, fontStyle: "italic" }}>
                  &ldquo;{v.notes}&rdquo;
                </div>
              )}
            </div>

            {/* Follow-up selector */}
            <div style={{ flexShrink: 0 }}>
              <select
                value={v.follow_up}
                onChange={(e) => onStatusChange(v.id, e.target.value)}
                style={{
                  background: st.bg, border: `1px solid ${st.bd}`,
                  borderRadius: "7px", padding: "5px 10px",
                  color: st.color, fontSize: ".72rem", fontWeight: 700,
                  outline: "none", cursor: "pointer",
                }}
              >
                {FOLLOW_UP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function VisitorsClient() {
  const [visitors,   setVisitors]   = useState<Visitor[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [showForm,   setShowForm]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const url = filter === "all" ? "/api/receptionist/visitors" : `/api/receptionist/visitors?follow_up=${filter}`;
    const res  = await fetch(url);
    const json = await res.json();
    setVisitors(json.visitors ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id: string, follow_up: string) {
    setVisitors((prev) => prev.map((v) => v.id === id ? { ...v, follow_up } : v));
    await fetch("/api/receptionist/visitors", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, follow_up }),
    });
  }

  const pending   = visitors.filter((v) => v.follow_up === "pending").length;
  const converted = visitors.filter((v) => v.follow_up === "converted").length;

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Walk-in Visitors</h2>
          <p>Log visitors who enquire at reception for follow-up tracking.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="btn-primary"
          style={{ border: "none", cursor: "pointer" }}
        >
          <i className={`fas ${showForm ? "fa-times" : "fa-plus"}`} style={{ marginRight: "8px" }} />
          {showForm ? "Cancel" : "Log Visitor"}
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total Logged",  value: visitors.length, icon: "fa-users",       color: "var(--teal2)" },
          { label: "Pending",       value: pending,         icon: "fa-clock",        color: "#d97706"      },
          { label: "Converted",     value: converted,       icon: "fa-check-circle", color: "#16a34a"      },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: "10px", padding: "14px 20px",
            display: "flex", alignItems: "center", gap: "12px", minWidth: "140px",
          }}>
            <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: "1rem" }} />
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--white)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Log form */}
      {showForm && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-head">
            <h3><i className="fas fa-user-plus" style={{ marginRight: "8px" }} />New Visitor</h3>
          </div>
          <div style={{ padding: "24px" }}>
            <LogForm onSaved={() => { setShowForm(false); load(); }} />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[{ value: "all", label: "All" }, ...FOLLOW_UP_OPTIONS].map((o) => (
          <button
            key={o.value}
            onClick={() => setFilter(o.value)}
            style={{
              padding: "6px 14px", borderRadius: "7px", border: "none", cursor: "pointer",
              fontSize: ".75rem", fontWeight: 600, transition: "all .15s",
              background: filter === o.value ? "var(--teal)"  : "var(--surface2)",
              color:      filter === o.value ? "var(--dark)"  : "var(--muted)",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card">
        <div style={{ padding: "20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: ".85rem" }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading…
            </div>
          ) : (
            <VisitorList visitors={visitors} onStatusChange={handleStatusChange} />
          )}
        </div>
      </div>
    </div>
  );
}
