"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id:           string;
  name:         string;
  phone:        string;
  email:        string | null;
  profile_id:   string | null;
  class_name:   string;
  amount:       number;
  total_paid:   number;
  outstanding:  number;
  method:       string;
  reference:    string | null;
  notes:        string | null;
  payment_date: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
const METHOD_LABELS: Record<string, string> = { cash: "Cash", bank_transfer: "Bank Transfer" };

// ─── Register Student Modal ───────────────────────────────────────────────────

function RegisterModal({ onClose, onRegistered }: {
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", class_name: "", amount: "", method: "cash", reference: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; class_name: string; payment_id: string } | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.amount || Number(form.amount) <= 0) { setError("Enter a valid amount."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/receptionist/register-physical-student", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSuccess({ name: form.full_name, class_name: form.class_name, payment_id: json.payment_id });
      onRegistered();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = { width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)", borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "5px" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>
            <i className="fas fa-user-graduate" style={{ color: "var(--teal2)", marginRight: "8px" }} />Register Physical Student
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {success ? (
          <div>
            <div style={{ background: "rgba(22,163,74,.08)", border: "1px solid rgba(22,163,74,.25)", borderRadius: "10px", padding: "18px", marginBottom: "16px" }}>
              <div style={{ fontWeight: 700, color: "#16a34a", marginBottom: "6px" }}>
                <i className="fas fa-check-circle" style={{ marginRight: "7px" }} />{success.name} registered
              </div>
              <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>Class: {success.class_name}</div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href={`/dashboard/receptionist/receipt/${success.payment_id}`} className="btn-primary" style={{ textDecoration: "none", flex: 1, textAlign: "center" }}>
                <i className="fas fa-receipt" style={{ marginRight: "7px" }} />Print Receipt
              </Link>
              <button onClick={() => setSuccess(null)} className="btn-outline" style={{ flex: 1 }}>
                Register Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {error && (
              <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "10px 14px", color: "#dc2626", fontSize: ".8rem" }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={lbl}>Full Name *</label><input value={form.full_name} onChange={set("full_name")} placeholder="Ahmed Hassan" required style={inp} /></div>
              <div><label style={lbl}>Phone *</label><input value={form.phone} onChange={set("phone")} placeholder="07XX XXX XXX" required style={inp} /></div>
              <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={set("email")} placeholder="ahmed@email.com" style={inp} /></div>
              <div><label style={lbl}>Class / Course *</label><input value={form.class_name} onChange={set("class_name")} placeholder="e.g. Python Bootcamp" required style={inp} /></div>
              <div><label style={lbl}>Amount (KES) *</label><input type="number" min="1" value={form.amount} onChange={set("amount")} placeholder="e.g. 5000" required style={inp} /></div>
              <div>
                <label style={lbl}>Payment Method *</label>
                <select value={form.method} onChange={set("method")} style={inp}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              {form.method === "bank_transfer" && (
                <div style={{ gridColumn: "span 2" }}><label style={lbl}>Bank Reference</label><input value={form.reference} onChange={set("reference")} placeholder="Transaction ref" style={inp} /></div>
              )}
            </div>
            <div><label style={lbl}>Notes</label><textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Any additional notes..." style={{ ...inp, resize: "vertical" }} /></div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, border: "none", cursor: "pointer" }}>
                {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "7px" }} />Registering…</> : <><i className="fas fa-user-graduate" style={{ marginRight: "7px" }} />Register Student</>}
              </button>
              <button type="button" className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function PaymentModal({ student, onClose, onDone }: {
  student: Student;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount,  setAmount]  = useState("");
  const [method,  setMethod]  = useState("cash");
  const [ref,     setRef]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const inp: React.CSSProperties = { width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)", borderRadius: "8px", padding: "9px 12px", color: "var(--dark)", fontSize: ".85rem", outline: "none", boxSizing: "border-box" };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/walk-in-payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "physical_class", customer_name: student.name, customer_phone: student.phone, amount: Number(amount), method, reference: ref || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onDone();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "380px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>Record Payment</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "8px 12px", marginBottom: "16px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
          <div style={{ fontWeight: 700, color: "var(--dark)" }}>{student.name}</div>
          <div style={{ color: "var(--muted)", fontSize: ".75rem" }}>{student.class_name}</div>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {error && <div style={{ color: "#dc2626", fontSize: ".78rem" }}>{error}</div>}
          <div><label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: "5px" }}>Amount (KES) *</label><input type="number" min="1" placeholder="e.g. 3000" value={amount} onChange={(e) => setAmount(e.target.value)} required style={inp} /></div>
          <div>
            <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: "5px" }}>Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={inp}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          {method === "bank_transfer" && (
            <div><label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: "5px" }}>Reference</label><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="TXN ref" style={inp} /></div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, border: "none", cursor: "pointer" }}>
              {loading ? "Saving…" : "Save Payment"}
            </button>
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [students,    setStudents]    = useState<Student[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [showReg,     setShowReg]     = useState(false);
  const [payTarget,   setPayTarget]   = useState<Student | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/receptionist/walk-in-members")
      .then((r) => r.json())
      .then((j) => setStudents((j.members ?? []).filter((m: any) => m.type === "physical_class")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.class_name.toLowerCase().includes(q);
  });

  // Group by class
  const grouped: Record<string, Student[]> = {};
  for (const s of filtered) {
    const key = s.class_name || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const classes = Object.keys(grouped).sort();

  return (
    <div>
      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Students</h2>
          <p>Physical class students grouped by course</p>
        </div>
        <button onClick={() => setShowReg(true)} className="btn-primary" style={{ border: "none", cursor: "pointer" }}>
          <i className="fas fa-user-plus" style={{ marginRight: "7px" }} />Register Student
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "20px", maxWidth: "380px" }}>
        <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: ".8rem", pointerEvents: "none" }} />
        <input
          type="text" placeholder="Search by name, phone, or class…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="form-input" style={{ paddingLeft: "34px" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: ".8rem" }}>
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", color: "var(--muted)", fontSize: ".85rem" }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading…
        </div>
      ) : classes.length === 0 ? (
        <div className="card">
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            {search ? `No results for "${search}"` : "No students registered yet."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {classes.map((cls) => (
            <div key={cls} className="card">
              {/* Class header */}
              <div className="card-head">
                <h3>
                  <i className="fas fa-chalkboard-teacher" />
                  {cls}
                </h3>
                <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                  {grouped[cls].length} student{grouped[cls].length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Spreadsheet table */}
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Phone</th>
                      <th>Amount Paid</th>
                      <th>Method</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[cls].map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(193,68,14,.1)", border: "1px solid rgba(193,68,14,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 700, color: "var(--teal2)", flexShrink: 0 }}>
                              {initials(s.name)}
                            </div>
                            <span style={{ fontWeight: 600, color: "var(--dark)" }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: ".82rem" }}>{s.phone}</td>
                        <td style={{ fontWeight: 600, color: "var(--dark)" }}>KES {s.total_paid.toLocaleString()}</td>
                        <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>{METHOD_LABELS[s.method] ?? s.method}</td>
                        <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>{fmtDate(s.payment_date)}</td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => setPayTarget(s)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, cursor: "pointer", background: "rgba(193,68,14,.08)", border: "1px solid rgba(193,68,14,.25)", color: "var(--teal2)" }}>
                              <i className="fas fa-plus-circle" /> Payment
                            </button>
                            <Link href={`/dashboard/receptionist/receipt/${s.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, textDecoration: "none", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.12)", color: "var(--muted)" }}>
                              <i className="fas fa-receipt" /> Receipt
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showReg && <RegisterModal onClose={() => setShowReg(false)} onRegistered={load} />}
      {payTarget && <PaymentModal student={payTarget} onClose={() => setPayTarget(null)} onDone={load} />}
    </div>
  );
}
