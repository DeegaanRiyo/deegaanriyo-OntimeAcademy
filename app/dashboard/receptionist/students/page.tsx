"use client";

import React, { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentType = "new" | "current_old" | "zoom_virtual";
type PayMethod   = "cash" | "mpesa" | "bank_transfer" | "both";

type Registration = {
  id:                  string;
  student_type:        StudentType;
  customer_name:       string;
  customer_phone:      string;
  customer_email:      string | null;
  profile_id:          string | null;
  course_name:         string | null;
  course_fee_monthly:  number | null;
  registration_fee:    number | null;
  total_due:           number | null;
  amount:              number;             // amount paid at registration
  method:              string;
  reference:           string | null;
  notes:               string | null;
  recorded_by:         string | null;
  created_at:          string;
  recorder_full_name:  string | null;
  recorder_role:       string | null;
};


// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", mpesa: "M-Pesa", bank_transfer: "Bank Transfer", both: "Cash + M-Pesa",
};
const TYPE_META: Record<StudentType, { label: string; color: string; icon: string; desc: string }> = {
  new:          { label: "New Students",   color: "#E8490F", icon: "fa-user-plus",  desc: "First-time enrolments"         },
  current_old:  { label: "Current / Old",  color: "#16a34a", icon: "fa-user-check", desc: "Returning & ongoing students"  },
  zoom_virtual: { label: "Zoom / Virtual", color: "#7c3aed", icon: "fa-video",      desc: "Remote live class attendees"   },
};

// ─── Style tokens ─────────────────────────────────────────────────────────────

const F_INP: React.CSSProperties = {
  width: "100%", height: "34px", background: "#fff",
  border: "1px solid rgba(17,17,17,.12)", borderRadius: "6px",
  padding: "0 10px", color: "var(--dark)", fontSize: ".8rem",
  outline: "none", boxSizing: "border-box", transition: "all .12s ease",
};
const F_LBL: React.CSSProperties = {
  display: "block", fontSize: ".58rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".1em",
  color: "rgba(17,17,17,.35)", marginBottom: "3px",
};
const TH: React.CSSProperties = {
  padding: "6px 12px", textAlign: "left", fontSize: ".55rem",
  fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em",
  color: "#6B7280", whiteSpace: "nowrap", background: "rgba(17,17,17,.015)",
};
const TD: React.CSSProperties = {
  padding: "0 12px", height: "38px", verticalAlign: "middle",
  fontSize: ".75rem", color: "#111827",
};
const TD_M: React.CSSProperties = {
  padding: "0 12px", height: "38px", verticalAlign: "middle",
  fontSize: ".72rem", color: "#4B5563",
};

// ─── SegmentedControl ─────────────────────────────────────────────────────────

function SegmentedControl({ value, onChange }: { value: StudentType; onChange: (v: StudentType) => void }) {
  const items: { v: StudentType; label: string; icon: string; color: string }[] = [
    { v: "new",          label: "New Student",   icon: "fa-user-plus",  color: "#E8490F" },
    { v: "current_old",  label: "Current / Old", icon: "fa-user-check", color: "#16a34a" },
    { v: "zoom_virtual", label: "Zoom / Virtual",icon: "fa-video",      color: "#7c3aed" },
  ];
  return (
    <div style={{ display: "flex", background: "rgba(17,17,17,.04)", borderRadius: "6px", padding: "2px", gap: "1px" }}>
      {items.map(({ v, label, icon, color }) => {
        const active = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            style={{ flex: 1, height: "30px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", borderRadius: "5px", border: "none", cursor: "pointer", fontSize: ".72rem", fontWeight: active ? 700 : 500, transition: "all .12s", background: active ? "#fff" : "transparent", color: active ? color : "rgba(17,17,17,.4)", boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>
            <i className={`fas ${icon}`} style={{ fontSize: ".6rem" }} />{label}
          </button>
        );
      })}
    </div>
  );
}

// ─── MethodToggle ─────────────────────────────────────────────────────────────

function MethodToggle({ value, onChange }: { value: PayMethod; onChange: (v: PayMethod) => void }) {
  const methods: { v: PayMethod; label: string }[] = [
    { v: "cash",          label: "Cash"        },
    { v: "mpesa",         label: "M-Pesa"      },
    { v: "bank_transfer", label: "Bank"        },
    { v: "both",          label: "Cash+M-Pesa" },
  ];
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {methods.map(({ v, label }) => {
        const active = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            style={{ flex: 1, height: "30px", borderRadius: "6px", border: active ? "none" : "1px solid rgba(17,17,17,.12)", background: active ? "#E8490F" : "transparent", color: active ? "#fff" : "rgba(17,17,17,.45)", fontWeight: active ? 700 : 500, fontSize: ".7rem", cursor: "pointer", transition: "all .12s" }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── SectionDivider ───────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0 8px" }}>
      <span style={{ fontSize: ".54rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(17,17,17,.25)", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: "1px", background: "rgba(17,17,17,.05)" }} />
    </div>
  );
}

// ─── RegisterModal ────────────────────────────────────────────────────────────

function RegisterModal({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
  const [studentType,  setStudentType]  = useState<StudentType>("new");
  const [fullName,     setFullName]     = useState("");
  const [phone,        setPhone]        = useState("");
  const [email,        setEmail]        = useState("");
  const [courseName,   setCourseName]   = useState("");
  const [courseFee,    setCourseFee]    = useState("");   // monthly course fee
  const [regFee,       setRegFee]       = useState("");   // one-time registration fee (new only)
  const [amountPaid,   setAmountPaid]   = useState("");   // amount paid right now
  const [method,       setMethod]       = useState<PayMethod>("cash");
  const [reference,    setReference]    = useState("");
  const [notes,        setNotes]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<{ name: string; balance: number; id: string } | null>(null);

  const showRef     = method === "mpesa" || method === "bank_transfer" || method === "both";
  const showRegFee  = studentType === "new";

  // ── Live fee computation ──────────────────────────────────────────────────
  const monthly  = Number(courseFee)  || 0;
  const regF     = showRegFee ? (Number(regFee) || 0) : 0;
  const totalDue = monthly + regF;
  const paid     = Number(amountPaid) || 0;
  const balance  = totalDue > 0 ? totalDue - paid : 0;

  const balanceColor  = balance <= 0  ? "#16a34a" : balance < totalDue ? "#b45309" : "#dc2626";
  const balanceBg     = balance <= 0  ? "rgba(22,163,74,.07)"   : balance < totalDue ? "rgba(180,83,9,.07)"   : "rgba(220,38,38,.07)";
  const balanceBorder = balance <= 0  ? "rgba(22,163,74,.2)"    : balance < totalDue ? "rgba(180,83,9,.2)"    : "rgba(220,38,38,.2)";
  const balanceLabel  = balance <= 0  ? "Fully paid"            : balance < totalDue ? `KES ${balance.toLocaleString()} balance outstanding` : `KES ${balance.toLocaleString()} balance outstanding`;

  function reset() {
    setFullName(""); setPhone(""); setEmail(""); setCourseName("");
    setCourseFee(""); setRegFee(""); setAmountPaid("");
    setMethod("cash"); setReference(""); setNotes("");
    setStudentType("new");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (monthly <= 0) { setError("Enter the monthly course fee."); return; }
    if (paid <= 0)    { setError("Enter the amount paid now."); return; }
    if (paid > totalDue && totalDue > 0) { setError("Amount paid exceeds total due."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/register-student", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_type:        studentType,
          customer_name:       fullName,
          customer_phone:      phone,
          customer_email:      email      || undefined,
          course_name:         courseName || undefined,
          course_fee_monthly:  monthly    || undefined,
          registration_fee:    regF > 0   ? regF     : undefined,
          total_due:           totalDue   > 0 ? totalDue : undefined,
          amount:              paid,
          method,
          reference:           reference  || undefined,
          notes:               notes      || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSuccess({ name: fullName, balance: Math.max(0, balance), id: json.registration_id });
      onRegistered();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div style={{ maxWidth: "520px", width: "100%", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,.15)" }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(17,17,17,.06)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".92rem", color: "var(--dark)" }}>Register Student</div>
            <div style={{ fontSize: ".68rem", color: "rgba(17,17,17,.35)", marginTop: "1px" }}>Record student & payment</div>
          </div>
          <button onClick={onClose} style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "5px", cursor: "pointer", color: "rgba(17,17,17,.4)", fontSize: ".75rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {success ? (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(22,163,74,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <i className="fas fa-check" style={{ color: "#16a34a", fontSize: "1.1rem" }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: ".95rem", color: "var(--dark)", marginBottom: "6px" }}>{success.name} registered</div>
            {success.balance > 0 ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(180,83,9,.08)", border: "1px solid rgba(180,83,9,.2)", borderRadius: "6px", padding: "6px 12px", fontSize: ".78rem", color: "#b45309", fontWeight: 700, marginBottom: "20px" }}>
                <i className="fas fa-clock" />
                KES {success.balance.toLocaleString()} balance outstanding
              </div>
            ) : (
              <div style={{ fontSize: ".75rem", color: "rgba(17,17,17,.4)", marginBottom: "20px" }}>Fully paid — no balance outstanding.</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "300px", margin: "0 auto" }}>
              <a
                href={`/dashboard/receptionist/receipt/${success.id}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", height: "40px", background: "#111", color: "#fff", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".82rem", cursor: "pointer", textDecoration: "none" }}
              >
                <i className="fas fa-receipt" />Print Receipt
              </a>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setSuccess(null); reset(); }} style={{ flex: 1, height: "38px", background: "#E8490F", color: "#fff", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>
                  Add Another
                </button>
                <button onClick={onClose} style={{ flex: 1, height: "38px", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".8rem", color: "var(--dark)", cursor: "pointer" }}>
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <div style={{ background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.15)", borderRadius: "6px", padding: "8px 12px", color: "#dc2626", fontSize: ".75rem", display: "flex", alignItems: "center", gap: "7px" }}>
                <i className="fas fa-exclamation-circle" style={{ flexShrink: 0 }} />{error}
              </div>
            )}

            {/* Student type */}
            <div>
              <label style={F_LBL}>Student Category *</label>
              <SegmentedControl value={studentType} onChange={(v) => { setStudentType(v); setRegFee(""); }} />
              {studentType === "current_old" && (
                <div style={{ marginTop: "6px", fontSize: ".68rem", color: "rgba(17,17,17,.38)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <i className="fas fa-info-circle" />Existing student — no registration fee applies.
                </div>
              )}
              {studentType === "zoom_virtual" && (
                <div style={{ marginTop: "6px", fontSize: ".68rem", color: "#7c3aed", display: "flex", alignItems: "center", gap: "4px", background: "rgba(124,58,237,.04)", border: "1px solid rgba(124,58,237,.12)", borderRadius: "5px", padding: "5px 8px" }}>
                  <i className="fas fa-video" />Zoom / Virtual — attends live classes remotely.
                </div>
              )}
            </div>

            {/* Student details */}
            <div>
              <SectionDivider label="Student Details" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={F_LBL}>Full Name *</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ahmed Hassan" required style={F_INP} />
                </div>
                <div>
                  <label style={F_LBL}>Phone Number *</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" required style={F_INP} />
                </div>
                <div>
                  <label style={F_LBL}>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ahmed@email.com" style={F_INP} />
                </div>
              </div>
            </div>

            {/* Course enrolled */}
            <div>
              <label style={F_LBL}>Course Enrolled</label>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Arabic, Tajweed, Quran…"
                style={F_INP}
              />
            </div>

            {/* Fee breakdown */}
            <div>
              <SectionDivider label="Fees" />
              <div style={{ display: "grid", gridTemplateColumns: showRegFee ? "1fr 1fr" : "1fr", gap: "12px" }}>
                <div>
                  <label style={F_LBL}>Monthly Course Fee (KES) *</label>
                  <input type="number" min="0" step="1" value={courseFee} onChange={(e) => setCourseFee(e.target.value)} placeholder="e.g. 5000" style={F_INP} />
                </div>
                {showRegFee && (
                  <div>
                    <label style={F_LBL}>Registration Fee (KES)</label>
                    <input type="number" min="0" step="1" value={regFee} onChange={(e) => setRegFee(e.target.value)} placeholder="e.g. 2000" style={F_INP} />
                  </div>
                )}
              </div>

              {/* Total due summary */}
              {totalDue > 0 && (
                <div style={{ marginTop: "10px", background: "rgba(17,17,17,.03)", border: "1px solid rgba(17,17,17,.08)", borderRadius: "6px", padding: "8px 12px", fontSize: ".75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {showRegFee && regF > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(17,17,17,.5)" }}>
                      <span>Monthly fee</span><span>KES {monthly.toLocaleString()}</span>
                    </div>
                  )}
                  {showRegFee && regF > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(17,17,17,.5)" }}>
                      <span>Registration fee</span><span>KES {regF.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--dark)", borderTop: showRegFee && regF > 0 ? "1px solid rgba(17,17,17,.08)" : "none", paddingTop: showRegFee && regF > 0 ? "4px" : 0 }}>
                    <span>Total Due</span><span>KES {totalDue.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div>
              <SectionDivider label="Payment Now" />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={F_LBL}>Amount Paid (KES) *</label>
                  <input
                    type="number" min="1" step="1"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={totalDue > 0 ? `Max KES ${totalDue.toLocaleString()}` : "e.g. 5000"}
                    style={F_INP}
                    required
                  />
                </div>

                {/* Live balance indicator */}
                {paid > 0 && totalDue > 0 && (
                  <div style={{ background: balanceBg, border: `1px solid ${balanceBorder}`, borderRadius: "6px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: ".75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: balanceColor, fontWeight: 700 }}>
                      <i className={`fas ${balance <= 0 ? "fa-check-circle" : "fa-clock"}`} />
                      {balanceLabel}
                    </div>
                    <span style={{ color: balanceColor, fontWeight: 800 }}>
                      {balance <= 0 ? `KES ${paid.toLocaleString()} paid` : `${Math.round((paid / totalDue) * 100)}% paid`}
                    </span>
                  </div>
                )}

                <div>
                  <label style={F_LBL}>Payment Method *</label>
                  <MethodToggle value={method} onChange={setMethod} />
                </div>
                {showRef && (
                  <div>
                    <label style={F_LBL}>Reference</label>
                    <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. QA12BCD3E4" style={F_INP} />
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={F_LBL}>Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any additional notes…"
                style={{ ...F_INP, height: "auto", padding: "6px 10px", resize: "vertical", fontSize: ".75rem" }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", height: "40px", background: loading ? "rgba(232,73,15,.5)" : "#E8490F", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: ".85rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", transition: "all .15s" }}>
              {loading
                ? <><i className="fas fa-spinner fa-spin" />Processing…</>
                : <><i className="fas fa-user-graduate" />Register Student{paid > 0 ? ` · KES ${paid.toLocaleString()} paid` : ""}{balance > 0 ? ` · KES ${balance.toLocaleString()} balance` : ""}</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── FlagModal ────────────────────────────────────────────────────────────────

function FlagModal({ reg, onClose, onDone }: { reg: Registration; onClose: () => void; onDone: () => void }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  const lbl: React.CSSProperties = {
    display: "block", fontSize: ".62rem", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(17,17,17,.4)", marginBottom: "4px",
  };
  const inp: React.CSSProperties = {
    width: "100%", background: "rgba(17,17,17,.03)", border: "1px solid rgba(17,17,17,.12)",
    borderRadius: "6px", padding: "8px 10px", color: "var(--dark)",
    fontSize: ".8rem", outline: "none", boxSizing: "border-box",
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!message.trim()) { setError("Please describe the correction needed."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/student-flags", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: reg.id, message: message.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit flag");
      setSent(true); onDone();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#dc2626", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-flag" />Flag for Correction
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        {sent ? (
          <div style={{ background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "10px", padding: "18px", textAlign: "center" }}>
            <i className="fas fa-check-circle" style={{ color: "#dc2626", fontSize: "1.4rem", marginBottom: "10px", display: "block" }} />
            <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: "4px" }}>Flag sent to Owner</div>
            <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>The owner will review and make corrections.</div>
            <button onClick={onClose} className="btn-outline" style={{ marginTop: "14px", width: "100%" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
              <div style={{ fontWeight: 700, color: "var(--dark)" }}>{reg.customer_name}</div>
              <div style={{ color: "var(--muted)", fontSize: ".75rem" }}>{reg.customer_phone}</div>
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {error && <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "9px 12px", color: "#dc2626", fontSize: ".8rem" }}>{error}</div>}
              <div>
                <label style={lbl}>Correction needed *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                  placeholder="Describe what needs to be corrected — e.g. wrong category, duplicate entry, wrong amount, etc."
                  required style={{ ...inp, resize: "vertical" }} autoFocus />
                <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "4px" }}>This message will be sent to the owner for review.</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", opacity: loading ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                  {loading ? <><i className="fas fa-spinner fa-spin" />Sending…</> : <><i className="fas fa-flag" />Send Flag</>}
                </button>
                <button type="button" className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────

function CategoryCard({ icon, label, desc, count, color, active, loading, onClick }: {
  icon: string; label: string; desc: string; count: number;
  color: string; active: boolean; loading: boolean; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, minWidth: "160px", position: "relative", textAlign: "left",
        background: "#fff",
        border: `1.5px solid ${active ? color : "rgba(17,17,17,.09)"}`,
        borderRadius: "12px", padding: "18px 18px 16px", cursor: "pointer",
        transition: "all .15s", overflow: "hidden",
        boxShadow: active ? `0 0 0 3px ${color}22` : hover ? "0 2px 8px rgba(0,0,0,.06)" : "none",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: active ? color : "transparent", transition: "all .15s" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`fas ${icon}`} style={{ fontSize: ".78rem", color }} />
        </div>
        {active && (
          <span style={{ fontSize: ".52rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: "100px", padding: "2px 7px" }}>
            Viewing
          </span>
        )}
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: active ? color : "#111827", lineHeight: 1, marginBottom: "4px" }}>
        {loading ? "—" : count}
      </div>
      <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: ".65rem", color: "#6B7280" }}>{desc}</div>
    </button>
  );
}

// ─── CourseEditModal ──────────────────────────────────────────────────────────

function CourseEditModal({ reg, onClose, onSaved }: {
  reg:     Registration;
  onClose: () => void;
  onSaved: (id: string, courseName: string) => void;
}) {
  const [value,   setValue]   = useState(reg.course_name ?? "");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`/api/receptionist/students/${reg.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_name: value.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      onSaved(reg.id, value.trim());
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16 }} onClick={onClose}>
      <div style={{ maxWidth: 380, width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 20px 50px rgba(0,0,0,.15)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid rgba(17,17,17,.06)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".88rem", color: "var(--dark)" }}>Edit Course</div>
            <div style={{ fontSize: ".68rem", color: "rgba(17,17,17,.35)", marginTop: 1 }}>{reg.customer_name}</div>
          </div>
          <button onClick={onClose} style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,.05)", border: "none", borderRadius: 5, cursor: "pointer", color: "rgba(17,17,17,.4)", fontSize: ".75rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>
        <form onSubmit={save} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.15)", borderRadius: 6, padding: "8px 12px", color: "#dc2626", fontSize: ".75rem" }}>{error}</div>
          )}
          <div>
            <label style={F_LBL}>Course Enrolled</label>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Arabic, Tajweed, Quran…"
              style={F_INP}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, height: 38, background: loading ? "rgba(232,73,15,.5)" : "#E8490F", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: ".8rem", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={onClose}
              style={{ flex: 1, height: 38, background: "rgba(17,17,17,.05)", border: "none", borderRadius: 7, fontWeight: 700, fontSize: ".8rem", color: "var(--dark)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── RegistrationTable ────────────────────────────────────────────────────────

function RegistrationTable({ registrations, onFlag, onEdit }: {
  registrations: Registration[];
  onFlag: (r: Registration) => void;
  onEdit: (r: Registration) => void;
}) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (registrations.length === 0) return null;

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(17,17,17,.08)" }}>
              <th style={TH}>Student</th>
              <th style={TH}>Course</th>
              <th style={TH}>Phone</th>
              <th style={TH}>Monthly Fee</th>
              <th style={TH}>Reg Fee</th>
              <th style={TH}>Total Due</th>
              <th style={TH}>Paid</th>
              <th style={TH}>Balance</th>
              <th style={TH}>Method</th>
              <th style={TH}>Reference</th>
              <th style={TH}>Date</th>
              <th style={TH}>Recorded By</th>
              <th style={{ ...TH, width: "1px" }}></th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => {
              const isHovered = hoveredRow === r.id;
              const balance   = r.total_due != null ? r.total_due - r.amount : null;
              const avatarColor =
                r.student_type === "zoom_virtual" ? { bg: "rgba(124,58,237,.13)", fg: "#7c3aed" } :
                r.student_type === "current_old"  ? { bg: "rgba(22,163,74,.1)",   fg: "#16a34a" } :
                                                    { bg: "rgba(232,73,15,.1)",   fg: "#E8490F" };
              return (
                <tr key={r.id}
                  onMouseEnter={() => setHoveredRow(r.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: "1px solid rgba(17,17,17,.045)", background: balance != null && balance > 0 ? "rgba(180,83,9,.02)" : isHovered ? "rgba(17,17,17,.018)" : "transparent", transition: "background .08s" }}>

                  {/* Student */}
                  <td style={TD}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0, background: avatarColor.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".52rem", fontWeight: 700, color: avatarColor.fg }}>
                        {initials(r.customer_name)}
                      </div>
                      <span style={{ fontWeight: 600, color: "#111827", fontSize: ".8rem", whiteSpace: "nowrap" }}>{r.customer_name}</span>
                    </div>
                  </td>

                  {/* Course */}
                  <td style={TD_M}>
                    {r.course_name
                      ? <span style={{ fontWeight: 600, color: "var(--dark)" }}>{r.course_name}</span>
                      : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                  </td>

                  <td style={TD_M}>{r.customer_phone}</td>

                  {/* Monthly fee */}
                  <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                    {r.course_fee_monthly != null
                      ? `KES ${r.course_fee_monthly.toLocaleString()}`
                      : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                  </td>

                  {/* Reg fee */}
                  <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                    {r.registration_fee != null && r.registration_fee > 0
                      ? `KES ${r.registration_fee.toLocaleString()}`
                      : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                  </td>

                  {/* Total due */}
                  <td style={{ ...TD, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {r.total_due != null
                      ? `KES ${r.total_due.toLocaleString()}`
                      : <span style={{ color: "rgba(17,17,17,.2)", fontWeight: 400, fontSize: ".72rem" }}>—</span>}
                  </td>

                  {/* Paid */}
                  <td style={{ ...TD, fontWeight: 700, whiteSpace: "nowrap" }}>
                    KES {r.amount.toLocaleString()}
                  </td>

                  {/* Balance */}
                  <td style={TD}>
                    {balance == null ? (
                      <span style={{ color: "rgba(17,17,17,.2)", fontSize: ".68rem" }}>—</span>
                    ) : balance <= 0 ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: ".68rem", fontWeight: 700, color: "#16a34a" }}>
                        <i className="fas fa-check-circle" /> Paid
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: "100px", fontSize: ".67rem", fontWeight: 700, background: "rgba(180,83,9,.09)", color: "#b45309", whiteSpace: "nowrap" }}>
                        KES {balance.toLocaleString()} owes
                      </span>
                    )}
                  </td>

                  {/* Method */}
                  <td style={TD}>
                    <span style={{ display: "inline-flex", alignItems: "center", fontSize: ".68rem", fontWeight: 600, background: "rgba(17,17,17,.05)", color: "#374151", padding: "2px 7px", borderRadius: "100px", whiteSpace: "nowrap" }}>
                      {METHOD_LABELS[r.method] ?? r.method}
                    </span>
                  </td>

                  {/* Reference */}
                  <td style={{ ...TD_M, fontFamily: "monospace", fontSize: ".7rem" }}>
                    {r.reference ?? <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                  </td>

                  {/* Date */}
                  <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>

                  {/* Recorded by */}
                  <td style={TD_M}>
                    {r.recorder_full_name
                      ? <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "120px" }}>{r.recorder_full_name}</span>
                      : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>
                    }
                  </td>

                  {/* Actions */}
                  <td style={{ ...TD, textAlign: "right", paddingRight: "10px" }}>
                    <div style={{ display: "inline-flex", gap: 4 }}>
                      <button onClick={() => onEdit(r)} title="Edit course"
                        style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6", border: "none", borderRadius: "6px", cursor: "pointer", color: "#6B7280", fontSize: ".65rem", transition: "all .12s" }}>
                        <i className="fas fa-pencil-alt" />
                      </button>
                      <button onClick={() => onFlag(r)} title="Flag for correction"
                        style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6", border: "none", borderRadius: "6px", cursor: "pointer", color: "#EF4444", fontSize: ".65rem", transition: "all .12s" }}>
                        <i className="fas fa-flag" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [activeCard,    setActiveCard]    = useState<string | null>(null);
  const [showReg,       setShowReg]       = useState(false);
  const [flagTarget,    setFlagTarget]    = useState<Registration | null>(null);
  const [editTarget,    setEditTarget]    = useState<Registration | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/receptionist/students-this-month")
      .then((r) => r.json())
      .then((j) => setRegistrations(j.registrations ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const q        = search.trim().toLowerCase();
  const searched = registrations.filter((r) =>
    !q || r.customer_name.toLowerCase().includes(q) || r.customer_phone.includes(q)
  );

  const byType: Record<StudentType, Registration[]> = {
    new:          searched.filter((r) => r.student_type === "new"),
    current_old:  searched.filter((r) => r.student_type === "current_old"),
    zoom_virtual: searched.filter((r) => r.student_type === "zoom_virtual"),
  };

  const categories = [
    { key: "new",          ...TYPE_META.new,          count: byType.new.length          },
    { key: "current_old",  ...TYPE_META.current_old,  count: byType.current_old.length  },
    { key: "zoom_virtual", ...TYPE_META.zoom_virtual, count: byType.zoom_virtual.length },
    { key: "platform",     label: "Online Platform",  color: "#2563eb", icon: "fa-globe", desc: "Self-registered platform users", count: 0 },
  ];

  const activeCategory = categories.find((c) => c.key === activeCard);
  const displayRegs    = (activeCard && activeCard !== "platform")
    ? byType[activeCard as StudentType] ?? []
    : [];

  function toggleCard(key: string) {
    if (key === "platform") { setActiveCard((p) => p === "platform" ? null : "platform"); return; }
    setActiveCard((prev) => (prev === key ? null : key));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Students</h2>
          <p>This month&apos;s student registrations</p>
        </div>
        <button
          onClick={() => setShowReg(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "7px", height: "36px", padding: "0 16px", background: "#E8490F", color: "#fff", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}
        >
          <i className="fas fa-user-plus" style={{ fontSize: ".72rem" }} />Register Student
        </button>
      </div>

      {/* 4 Category cards */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {categories.map((c) => (
          <CategoryCard
            key={c.key}
            icon={c.icon}
            label={c.label}
            desc={c.desc}
            count={c.count}
            color={c.color}
            active={activeCard === c.key}
            loading={loading && c.key !== "platform"}
            onClick={() => toggleCard(c.key)}
          />
        ))}
      </div>

      {/* Platform info banner */}
      {activeCard === "platform" && (
        <div style={{ background: "rgba(37,99,235,.04)", border: "1px solid rgba(37,99,235,.15)", borderRadius: "10px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <i className="fas fa-info-circle" style={{ color: "#2563eb", fontSize: ".9rem", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#1e40af" }}>Online Platform Students</div>
            <div style={{ fontSize: ".75rem", color: "#3b82f6", marginTop: "2px" }}>
              Students who self-registered through the online platform are managed in the Owner dashboard under Students → Online Platform.
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {activeCard && activeCard !== "platform" && (
        <div style={{ position: "relative", display: "flex", alignItems: "center", maxWidth: "340px" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: "10px", color: "rgba(17,17,17,.28)", fontSize: ".68rem", pointerEvents: "none" }} />
          <input
            type="text" placeholder={`Search ${activeCategory?.label ?? "students"}…`}
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", height: "32px", paddingLeft: "30px", paddingRight: search ? "30px" : "10px", background: "#fff", border: "1px solid rgba(17,17,17,.12)", borderRadius: "7px", fontSize: ".78rem", color: "var(--dark)", outline: "none", boxSizing: "border-box" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "6px", background: "none", border: "none", color: "rgba(17,17,17,.3)", cursor: "pointer", fontSize: ".65rem", padding: "4px" }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {activeCard && activeCard !== "platform" && (
        loading ? (
          <div style={{ padding: "48px 0", color: "rgba(17,17,17,.4)", fontSize: ".82rem", textAlign: "center" }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading registrations…
          </div>
        ) : displayRegs.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "48px 20px", textAlign: "center", color: "rgba(17,17,17,.35)", fontSize: ".82rem" }}>
            {search ? `No results for "${search}"` : `No ${activeCategory?.label} registrations this month.`}
          </div>
        ) : (
          <RegistrationTable registrations={displayRegs} onFlag={setFlagTarget} onEdit={setEditTarget} />
        )
      )}

      {/* Default state */}
      {!activeCard && (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.07)", borderRadius: "10px", padding: "32px 20px", textAlign: "center" }}>
          <i className="fas fa-hand-pointer" style={{ fontSize: "1.2rem", color: "rgba(17,17,17,.15)", marginBottom: "10px", display: "block" }} />
          <div style={{ fontSize: ".82rem", color: "rgba(17,17,17,.35)" }}>Select a category above to view this month&apos;s registrations</div>
        </div>
      )}

      {showReg    && <RegisterModal onClose={() => setShowReg(false)} onRegistered={load} />}
      {flagTarget && <FlagModal reg={flagTarget} onClose={() => setFlagTarget(null)} onDone={() => setFlagTarget(null)} />}
      {editTarget && (
        <CourseEditModal
          reg={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(id, courseName) => {
            setRegistrations((prev) =>
              prev.map((r) => r.id === id ? { ...r, course_name: courseName || null } : r)
            );
          }}
        />
      )}
    </div>
  );
}
