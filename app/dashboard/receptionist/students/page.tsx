"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PhysicalStudentType, PhysicalStudentPayMethod } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Student = {
  id:                  string;
  type:                string;
  name:                string;
  phone:               string;
  email:               string | null;
  profile_id:          string | null;
  class_name:          string;
  student_type:        "new" | "returning" | "online" | null;
  amount:              number;
  total_paid:          number;
  total_due:           number | null;
  course_fee_monthly:  number | null;
  registration_fee:    number | null;
  outstanding:         number;
  method:              string;
  cash_amount:         number | null;
  mpesa_amount:        number | null;
  mpesa_reference:     string | null;
  reference:           string | null;
  notes:               string | null;
  joined_at:           string | null;
  payment_date:        string;
};

type CategoryFilter = "all" | "new" | "returning" | "online";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function cleanNotes(notes: string | null) {
  if (!notes) return "";
  const metaKeys = ["Class:", "student_type=", "monthly=", "reg_fee=", "total_due=", "cash=", "mpesa=", "mpesa_ref=", "joined_at="];
  return notes.split(". ").filter(p => !metaKeys.some(k => p.startsWith(k))).join(". ");
}
const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", mpesa: "M-Pesa", both: "Cash + M-Pesa", bank_transfer: "Bank Transfer",
};

// ─── Style tokens ──────────────────────────────────────────────────────────────

// Legacy — used by PaymentModal / FlagModal only
const inp: React.CSSProperties = {
  width: "100%", background: "rgba(17,17,17,.03)", border: "1px solid rgba(17,17,17,.12)",
  borderRadius: "6px", padding: "8px 10px", color: "var(--dark)",
  fontSize: ".8rem", outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: ".62rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(17,17,17,.4)", marginBottom: "4px",
};

// New fintech tokens
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
  color: "rgba(17,17,17,.32)", whiteSpace: "nowrap", background: "rgba(17,17,17,.015)",
};
const TD: React.CSSProperties = {
  padding: "0 12px", height: "36px", verticalAlign: "middle",
  fontSize: ".75rem", color: "var(--dark)",
};
const TD_M: React.CSSProperties = {
  padding: "0 12px", height: "36px", verticalAlign: "middle",
  fontSize: ".72rem", color: "rgba(17,17,17,.45)",
};
const ACT_BTN: React.CSSProperties = {
  width: "24px", height: "24px", display: "inline-flex", alignItems: "center",
  justifyContent: "center", background: "transparent", border: "none",
  borderRadius: "4px", cursor: "pointer", color: "rgba(17,17,17,.35)",
  textDecoration: "none", fontSize: ".6rem", transition: "all .1s",
};

// ─── Section divider for modals ────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0 8px" }}>
      <span style={{ fontSize: ".54rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(17,17,17,.25)", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: "1px", background: "rgba(17,17,17,.05)" }} />
    </div>
  );
}

// ─── Segmented control ─────────────────────────────────────────────────────────

function SegmentedControl({ value, onChange }: {
  value: PhysicalStudentType;
  onChange: (v: PhysicalStudentType) => void;
}) {
  const items: { v: PhysicalStudentType; label: string; icon: string }[] = [
    { v: "new",       label: "New Student",   icon: "fa-user-plus"  },
    { v: "returning", label: "Current / Old", icon: "fa-user-check" },
    { v: "online",    label: "Zoom Class",    icon: "fa-video"      },
  ];
  return (
    <div style={{ display: "flex", background: "rgba(17,17,17,.04)", borderRadius: "6px", padding: "2px", gap: "1px" }}>
      {items.map(({ v, label, icon }) => {
        const active = value === v;
        const isZoom = v === "online";
        return (
          <button
            key={v} type="button" onClick={() => onChange(v)}
            style={{
              flex: 1, height: "30px", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "5px", borderRadius: "5px", border: "none",
              cursor: "pointer", fontSize: ".72rem",
              fontWeight: active ? 700 : 500, transition: "all .12s",
              background: active ? "#fff" : "transparent",
              color: active ? (isZoom ? "#7c3aed" : "#E8490F") : "rgba(17,17,17,.4)",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            }}
          >
            <i className={`fas ${icon}`} style={{ fontSize: ".6rem" }} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Payment method pill toggle ────────────────────────────────────────────────

function MethodToggle({ value, onChange }: {
  value: PhysicalStudentPayMethod;
  onChange: (v: PhysicalStudentPayMethod) => void;
}) {
  const methods: { v: PhysicalStudentPayMethod; label: string; icon: string }[] = [
    { v: "cash",  label: "Cash",   icon: "fa-money-bill-wave" },
    { v: "mpesa", label: "M-Pesa", icon: "fa-mobile-alt"      },
    { v: "both",  label: "Both",   icon: "fa-layer-group"     },
  ];
  return (
    <div style={{ display: "flex", gap: "5px" }}>
      {methods.map(({ v, label, icon }) => {
        const active = value === v;
        return (
          <button
            key={v} type="button" onClick={() => onChange(v)}
            style={{
              flex: 1, height: "32px", borderRadius: "100px",
              border: active ? "none" : "1px solid rgba(17,17,17,.12)",
              background: active ? "#E8490F" : "transparent",
              color: active ? "#fff" : "rgba(17,17,17,.45)",
              fontWeight: active ? 700 : 500, fontSize: ".74rem",
              cursor: "pointer", transition: "all .12s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
            }}
          >
            <i className={`fas ${icon}`} style={{ fontSize: ".6rem" }} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Fee summary card ──────────────────────────────────────────────────────────

function FeeCard({
  studentType, courseMonthly, setCourseMonthly, regFee, setRegFee, totalDue,
}: {
  studentType:      PhysicalStudentType;
  courseMonthly:    string;
  setCourseMonthly: (v: string) => void;
  regFee:           string;
  setRegFee:        (v: string) => void;
  totalDue:         number;
}) {
  const showReg = studentType === "new" || studentType === "online";
  return (
    <div style={{ border: "1px solid rgba(17,17,17,.08)", borderRadius: "8px", overflow: "hidden", background: "rgba(17,17,17,.01)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid rgba(17,17,17,.06)" }}>
        <label style={{ ...F_LBL, marginBottom: 0 }}>Monthly Fee (KES)</label>
        <input
          type="number" min="1" value={courseMonthly}
          onChange={(e) => setCourseMonthly(e.target.value)}
          placeholder="0" required
          style={{ ...F_INP, width: "110px", textAlign: "right", height: "30px", fontSize: ".78rem" }}
        />
      </div>
      {showReg && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid rgba(17,17,17,.06)" }}>
          <label style={{ ...F_LBL, marginBottom: 0 }}>
            Registration Fee (KES)
          </label>
          <input
            type="number" min="0" value={regFee}
            onChange={(e) => setRegFee(e.target.value)}
            placeholder="0" required={studentType === "new"}
            style={{ ...F_INP, width: "110px", textAlign: "right", height: "30px", fontSize: ".78rem" }}
          />
        </div>
      )}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px",
        background: totalDue > 0 ? "rgba(232,73,15,.04)" : "transparent",
      }}>
        <span style={{ fontSize: ".74rem", fontWeight: 700, color: "var(--dark)" }}>Total Due</span>
        <span style={{ fontSize: ".88rem", fontWeight: 800, color: totalDue > 0 ? "#E8490F" : "rgba(17,17,17,.2)" }}>
          {totalDue > 0 ? `KES ${totalDue.toLocaleString()}` : "—"}
        </span>
      </div>
    </div>
  );
}

// ─── Balance bar ───────────────────────────────────────────────────────────────

function BalanceBar({ totalDue, amtPaid }: { totalDue: number; amtPaid: number }) {
  if (totalDue <= 0 || amtPaid <= 0) return null;
  const outstanding = Math.max(0, totalDue - amtPaid);
  const isPartial   = amtPaid < totalDue;
  const isOverpaid  = amtPaid > totalDue;
  return (
    <div style={{
      padding: "7px 10px", borderRadius: "6px",
      background: isOverpaid ? "rgba(59,130,246,.05)" : isPartial ? "rgba(217,119,6,.05)" : "rgba(22,163,74,.05)",
      border: `1px solid ${isOverpaid ? "rgba(59,130,246,.15)" : isPartial ? "rgba(217,119,6,.15)" : "rgba(22,163,74,.15)"}`,
      display: "flex", alignItems: "center", gap: "6px", fontSize: ".72rem",
    }}>
      <i
        className={`fas ${isOverpaid ? "fa-arrow-up" : isPartial ? "fa-clock" : "fa-check-circle"}`}
        style={{ color: isOverpaid ? "#3b82f6" : isPartial ? "#d97706" : "#16a34a", fontSize: ".65rem" }}
      />
      {isPartial  && <><strong style={{ color: "#d97706" }}>Partial</strong><span style={{ color: "rgba(17,17,17,.4)" }}> · KES {outstanding.toLocaleString()} outstanding</span></>}
      {!isPartial && !isOverpaid && <strong style={{ color: "#16a34a" }}>Full payment · KES {totalDue.toLocaleString()}</strong>}
      {isOverpaid && <><strong style={{ color: "#3b82f6" }}>Overpaid</strong><span style={{ color: "rgba(17,17,17,.4)" }}> · KES {(amtPaid - totalDue).toLocaleString()} over</span></>}
    </div>
  );
}

// ─── Register Student Modal ─────────────────────────────────────────────────────

function RegisterModal({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
  const [studentType,   setStudentType]   = useState<PhysicalStudentType>("new");
  const [fullName,      setFullName]      = useState("");
  const [phone,         setPhone]         = useState("");
  const [email,         setEmail]         = useState("");
  const [className,     setClassName]     = useState("");
  const [courseMonthly, setCourseMonthly] = useState("");
  const [regFee,        setRegFee]        = useState("2000");
  const [method,        setMethod]        = useState<PhysicalStudentPayMethod>("cash");
  const [amountPaid,    setAmountPaid]    = useState("");
  const [cashAmount,    setCashAmount]    = useState("");
  const [mpesaAmount,   setMpesaAmount]   = useState("");
  const [mpesaRef,      setMpesaRef]      = useState("");
  const [notes,         setNotes]         = useState("");
  const [joinedAt,      setJoinedAt]      = useState(new Date().toISOString().split("T")[0]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [success,       setSuccess]       = useState<{ name: string; class_name: string; payment_id: string } | null>(null);

  const monthly  = Number(courseMonthly) || 0;
  const rFee     = (studentType === "new" || studentType === "online") ? (Number(regFee) || 0) : 0;
  const totalDue = monthly + rFee;
  const amtPaid  = method === "both"
    ? (Number(cashAmount) || 0) + (Number(mpesaAmount) || 0)
    : Number(amountPaid) || 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (monthly <= 0)                              { setError("Enter the monthly course fee."); return; }
    if (studentType === "new" && rFee <= 0)        { setError("Enter a valid registration fee."); return; }
    if (amtPaid <= 0)                              { setError("Enter the amount paid."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/register-physical-student", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName, phone, email: email || undefined, class_name: className,
          student_type: studentType, course_fee_monthly: monthly,
          registration_fee: rFee, total_due: totalDue, amount: amtPaid, method,
          cash_amount:     method === "both" ? (Number(cashAmount) || 0) : undefined,
          mpesa_amount:    method === "both" ? (Number(mpesaAmount) || 0) : undefined,
          mpesa_reference: (method === "mpesa" || method === "both") ? mpesaRef : undefined,
          notes: notes || undefined, joined_at: joinedAt,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSuccess({ name: fullName, class_name: className, payment_id: json.payment_id });
      onRegistered();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div style={{ maxWidth: "560px", width: "100%", maxHeight: "94vh", overflowY: "auto", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,.15)" }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(17,17,17,.06)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".92rem", color: "var(--dark)" }}>Register Student</div>
            <div style={{ fontSize: ".68rem", color: "rgba(17,17,17,.35)", marginTop: "1px" }}>Physical class records & payments</div>
          </div>
          <button onClick={onClose} style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "5px", cursor: "pointer", color: "rgba(17,17,17,.4)", fontSize: ".75rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {success ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(22,163,74,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <i className="fas fa-check" style={{ color: "#16a34a", fontSize: "1.1rem" }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: ".95rem", color: "var(--dark)", marginBottom: "3px" }}>{success.name} registered</div>
            <div style={{ fontSize: ".75rem", color: "rgba(17,17,17,.4)", marginBottom: "24px" }}>Class: {success.class_name}</div>
            <div style={{ display: "flex", gap: "10px", maxWidth: "340px", margin: "0 auto" }}>
              <Link href={`/dashboard/receptionist/receipt/${success.payment_id}`} style={{ flex: 1, height: "40px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "#E8490F", color: "#fff", borderRadius: "7px", textDecoration: "none", fontWeight: 700, fontSize: ".82rem" }}>
                <i className="fas fa-receipt" />Receipt
              </Link>
              <button onClick={() => setSuccess(null)} style={{ flex: 1, height: "40px", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".82rem", color: "var(--dark)", cursor: "pointer" }}>
                Add Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "18px" }}>

            {error && (
              <div style={{ background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.15)", borderRadius: "6px", padding: "8px 12px", color: "#dc2626", fontSize: ".75rem", display: "flex", alignItems: "center", gap: "7px" }}>
                <i className="fas fa-exclamation-circle" style={{ flexShrink: 0 }} />{error}
              </div>
            )}

            {/* Category */}
            <div>
              <label style={F_LBL}>Student Category *</label>
              <SegmentedControl value={studentType} onChange={setStudentType} />
              {studentType === "returning" && (
                <div style={{ marginTop: "6px", fontSize: ".68rem", color: "rgba(17,17,17,.38)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <i className="fas fa-info-circle" />Existing student — no registration fee applies.
                </div>
              )}
            </div>

            {/* Student info */}
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
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={F_LBL}>Assigned Class *</label>
                      <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Python Bootcamp" required style={F_INP} />
                    </div>
                    <div>
                      <label style={F_LBL}>Date Joined *</label>
                      <input type="date" value={joinedAt} onChange={(e) => setJoinedAt(e.target.value)} required style={F_INP} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", alignItems: "start" }}>
              <div>
                <SectionDivider label="Fee Structure" />
                <FeeCard
                  studentType={studentType}
                  courseMonthly={courseMonthly} setCourseMonthly={setCourseMonthly}
                  regFee={regFee} setRegFee={setRegFee}
                  totalDue={totalDue}
                />
              </div>
              <div>
                <SectionDivider label="Payment" />
                <div style={{ marginBottom: "10px" }}>
                  <label style={F_LBL}>Payment Method *</label>
                  <MethodToggle value={method} onChange={setMethod} />
                </div>

                {method === "cash" && (
                  <div><label style={F_LBL}>Cash Amount (KES) *</label>
                    <input type="number" min="1" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" required style={F_INP} />
                  </div>
                )}
                {method === "mpesa" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div><label style={F_LBL}>M-Pesa Amount (KES) *</label>
                      <input type="number" min="1" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" required style={F_INP} />
                    </div>
                    <div><label style={F_LBL}>M-Pesa Reference</label>
                      <input value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} placeholder="QA12BCD3E4" style={F_INP} />
                    </div>
                  </div>
                )}
                {method === "both" && (
                  <div style={{ border: "1px solid rgba(17,17,17,.06)", borderRadius: "8px", padding: "10px", background: "rgba(17,17,17,.01)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div><label style={F_LBL}>Cash</label>
                          <input type="number" min="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0" style={F_INP} />
                        </div>
                        <div><label style={F_LBL}>M-Pesa</label>
                          <input type="number" min="0" value={mpesaAmount} onChange={(e) => setMpesaAmount(e.target.value)} placeholder="0" style={F_INP} />
                        </div>
                      </div>
                      <div><label style={F_LBL}>Reference</label>
                        <input value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} placeholder="QA12..." style={F_INP} />
                      </div>
                    </div>
                  </div>
                )}
                {amtPaid > 0 && totalDue > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <BalanceBar totalDue={totalDue} amtPaid={amtPaid} />
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={F_LBL}>Additional Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} placeholder="e.g. Part payment agreed…"
                style={{ ...F_INP, height: "auto", padding: "6px 10px", resize: "vertical", fontSize: ".75rem" }} />
            </div>

            {/* CTA */}
            <button type="submit" disabled={loading} style={{
              width: "100%", height: "40px", background: loading ? "rgba(232,73,15,.5)" : "#E8490F",
              color: "#fff", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: ".85rem",
              cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "7px", transition: "all .15s",
            }}>
              {loading
                ? <><i className="fas fa-spinner fa-spin" />Processing…</>
                : <><i className="fas fa-user-graduate" />Register Student {amtPaid > 0 && `· KES ${amtPaid.toLocaleString()}`}</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Edit Student Modal ─────────────────────────────────────────────────────────

function EditModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: () => void }) {
  const initSType  = (student.student_type ?? "new") as PhysicalStudentType;
  const initMethod = (["cash","mpesa","both"].includes(student.method) ? student.method : "cash") as PhysicalStudentPayMethod;

  const [studentType,   setStudentType]   = useState<PhysicalStudentType>(initSType);
  const [fullName,      setFullName]      = useState(student.name);
  const [phone,         setPhone]         = useState(student.phone);
  const [email,         setEmail]         = useState(student.email ?? "");
  const [className,     setClassName]     = useState(student.class_name);
  const [courseMonthly, setCourseMonthly] = useState(String(student.course_fee_monthly ?? ""));
  const [regFee,        setRegFee]        = useState(String(student.registration_fee   ?? "2000"));
  const [method,        setMethod]        = useState<PhysicalStudentPayMethod>(initMethod);
  const [amountPaid,    setAmountPaid]    = useState(String(student.amount));
  const [cashAmount,    setCashAmount]    = useState(String(student.cash_amount  ?? ""));
  const [mpesaAmount,   setMpesaAmount]   = useState(String(student.mpesa_amount ?? ""));
  const [mpesaRef,      setMpesaRef]      = useState(student.mpesa_reference ?? student.reference ?? "");
  const [notes,         setNotes]         = useState(cleanNotes(student.notes));
  const [joinedAt,      setJoinedAt]      = useState(student.joined_at ? student.joined_at.split("T")[0] : "");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const monthly  = Number(courseMonthly) || 0;
  const rFee     = (studentType === "new" || studentType === "online") ? (Number(regFee) || 0) : 0;
  const totalDue = monthly + rFee;
  const amtPaid  = method === "both"
    ? (Number(cashAmount) || 0) + (Number(mpesaAmount) || 0)
    : Number(amountPaid) || 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName || !phone || !className)  { setError("Name, phone and class are required."); return; }
    if (monthly <= 0)                       { setError("Enter the monthly course fee."); return; }
    if (studentType === "new" && rFee <= 0) { setError("Enter a valid registration fee."); return; }
    if (amtPaid <= 0)                       { setError("Enter the amount paid."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/walk-in-payments/${student.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName, phone, email: email || null, class_name: className,
          student_type: studentType, course_fee_monthly: monthly,
          registration_fee: rFee, total_due: totalDue, amount: amtPaid, method,
          cash_amount:     method === "both" ? (Number(cashAmount) || 0) : 0,
          mpesa_amount:    method === "both" ? (Number(mpesaAmount) || 0) : 0,
          mpesa_reference: (method === "mpesa" || method === "both") ? mpesaRef : "",
          notes, joined_at: joinedAt,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div style={{ maxWidth: "560px", width: "100%", maxHeight: "94vh", overflowY: "auto", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,.15)" }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(17,17,17,.06)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".92rem", color: "var(--dark)" }}>Edit Student Record</div>
            <div style={{ fontSize: ".68rem", color: "rgba(17,17,17,.35)", marginTop: "1px" }}>{student.name} · {student.class_name}</div>
          </div>
          <button onClick={onClose} style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "5px", cursor: "pointer", color: "rgba(17,17,17,.4)", fontSize: ".75rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={save} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.15)", borderRadius: "6px", padding: "8px 12px", color: "#dc2626", fontSize: ".75rem", display: "flex", alignItems: "center", gap: "7px" }}>
              <i className="fas fa-exclamation-circle" style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          {/* Category */}
          <div>
            <label style={F_LBL}>Student Category *</label>
            <SegmentedControl value={studentType} onChange={setStudentType} />
          </div>

          {/* Student info */}
          <div>
            <SectionDivider label="Student Details" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={F_LBL}>Full Name *</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={F_INP} />
              </div>
              <div>
                <label style={F_LBL}>Phone *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required style={F_INP} />
              </div>
              <div>
                <label style={F_LBL}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={F_INP} />
              </div>
              <div>
                <label style={F_LBL}>Assigned Class *</label>
                <input value={className} onChange={(e) => setClassName(e.target.value)} required style={F_INP} />
              </div>
              <div>
                <label style={F_LBL}>Date Joined *</label>
                <input type="date" value={joinedAt} onChange={(e) => setJoinedAt(e.target.value)} required style={F_INP} />
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", alignItems: "start" }}>
            <div>
              <SectionDivider label="Fee Structure" />
              <FeeCard
                studentType={studentType}
                courseMonthly={courseMonthly} setCourseMonthly={setCourseMonthly}
                regFee={regFee} setRegFee={setRegFee}
                totalDue={totalDue}
              />
            </div>
            <div>
              <SectionDivider label="Payment" />
              <div style={{ marginBottom: "10px" }}>
                <label style={F_LBL}>Payment Method *</label>
                <MethodToggle value={method} onChange={setMethod} />
              </div>

              {method === "cash" && (
                <div><label style={F_LBL}>Amount (KES) *</label>
                  <input type="number" min="1" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} required style={F_INP} />
                </div>
              )}
              {method === "mpesa" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div><label style={F_LBL}>Amount (KES) *</label>
                    <input type="number" min="1" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} required style={F_INP} />
                  </div>
                  <div><label style={F_LBL}>M-Pesa Reference</label>
                    <input value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} placeholder="QA12BCD3E4" style={F_INP} />
                  </div>
                </div>
              )}
              {method === "both" && (
                <div style={{ border: "1px solid rgba(17,17,17,.06)", borderRadius: "8px", padding: "10px", background: "rgba(17,17,17,.01)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div><label style={F_LBL}>Cash</label>
                        <input type="number" min="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} style={F_INP} />
                      </div>
                      <div><label style={F_LBL}>M-Pesa</label>
                        <input type="number" min="0" value={mpesaAmount} onChange={(e) => setMpesaAmount(e.target.value)} style={F_INP} />
                      </div>
                    </div>
                    <div><label style={F_LBL}>Reference</label>
                      <input value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} placeholder="QA12..." style={F_INP} />
                    </div>
                  </div>
                </div>
              )}
              {amtPaid > 0 && totalDue > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <BalanceBar totalDue={totalDue} amtPaid={amtPaid} />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={F_LBL}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} placeholder="Any notes…"
              style={{ ...F_INP, height: "auto", padding: "6px 10px", resize: "vertical", fontSize: ".75rem" }} />
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={loading} style={{
              flex: 2, height: "40px", background: loading ? "rgba(232,73,15,.5)" : "#E8490F",
              color: "#fff", border: "none", borderRadius: "8px", fontWeight: 800,
              fontSize: ".85rem", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
            }}>
              {loading ? <><i className="fas fa-spinner fa-spin" />Saving…</> : <><i className="fas fa-save" />Save Changes</>}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, height: "40px", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: ".82rem", color: "var(--dark)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Record Payment Modal ──────────────────────────────────────────────────────

function PaymentModal({ student, onClose, onDone }: { student: Student; onClose: () => void; onDone: () => void }) {
  const [method,   setMethod]   = useState<PhysicalStudentPayMethod>("cash");
  const [amount,   setAmount]   = useState("");
  const [cashAmt,  setCashAmt]  = useState("");
  const [mpesaAmt, setMpesaAmt] = useState("");
  const [ref,      setRef]      = useState("");
  const [notes,    setNotes]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const paid = method === "both"
    ? (Number(cashAmt) || 0) + (Number(mpesaAmt) || 0)
    : Number(amount) || 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (paid <= 0) { setError("Enter a valid amount."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/walk-in-payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: student.type, customer_name: student.name, customer_phone: student.phone,
          amount: paid, method, reference: ref || null,
          cash_amount:  method === "both" ? (Number(cashAmt)  || 0) : undefined,
          mpesa_amount: method === "both" ? (Number(mpesaAmt) || 0) : undefined,
          notes: notes || undefined,
        }),
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

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "400px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>Record Payment</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "8px 12px", marginBottom: "16px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
          <div style={{ fontWeight: 700, color: "var(--dark)" }}>{student.name}</div>
          <div style={{ color: "var(--muted)", fontSize: ".75rem" }}>{student.class_name}</div>
          {(student.course_fee_monthly ?? 0) > 0 && (
            <div style={{ marginTop: "6px", fontSize: ".75rem", color: "var(--muted)" }}>Monthly fee: <strong style={{ color: "var(--teal2)" }}>KES {(student.course_fee_monthly ?? 0).toLocaleString()}</strong></div>
          )}
          {(student.total_due ?? 0) > 0 && student.total_paid < (student.total_due ?? 0) && (
            <div style={{ marginTop: "4px", fontSize: ".75rem", color: "var(--muted)" }}>Outstanding: <strong style={{ color: "#d97706" }}>KES {Math.max(0, (student.total_due ?? 0) - student.total_paid).toLocaleString()}</strong></div>
          )}
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {error && <div style={{ color: "#dc2626", fontSize: ".78rem" }}>{error}</div>}
          <div>
            <label style={lbl}>Payment Method</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["cash", "mpesa", "both"] as PhysicalStudentPayMethod[]).map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)} style={{ flex: 1, padding: "7px 6px", borderRadius: "7px", cursor: "pointer", fontSize: ".75rem", fontWeight: method === m ? 700 : 400, border: method === m ? "1.5px solid var(--teal2)" : "1px solid rgba(17,17,17,.15)", background: method === m ? "rgba(193,68,14,.08)" : "rgba(17,17,17,.04)", color: method === m ? "var(--teal2)" : "var(--muted)" }}>
                  {m === "cash" ? "Cash" : m === "mpesa" ? "M-Pesa" : "Both"}
                </button>
              ))}
            </div>
          </div>
          {method === "cash" && (
            <div><label style={lbl}>Amount (KES) *</label><input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 3000" required style={inp} /></div>
          )}
          {method === "mpesa" && (<>
            <div><label style={lbl}>Amount (KES) *</label><input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 3000" required style={inp} /></div>
            <div><label style={lbl}>M-Pesa Reference</label><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. QA12BCD3E4" style={inp} /></div>
          </>)}
          {method === "both" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div><label style={lbl}>Cash (KES)</label><input type="number" min="0" value={cashAmt} onChange={(e) => setCashAmt(e.target.value)} placeholder="2000" style={inp} /></div>
              <div><label style={lbl}>M-Pesa (KES)</label><input type="number" min="0" value={mpesaAmt} onChange={(e) => setMpesaAmt(e.target.value)} placeholder="3000" style={inp} /></div>
            </div>
            <div><label style={lbl}>M-Pesa Reference</label><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. QA12BCD3E4" style={inp} /></div>
            {paid > 0 && <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>Total: <strong style={{ color: "var(--teal2)" }}>KES {paid.toLocaleString()}</strong></div>}
          </>)}
          <div>
            <label style={lbl}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Payment details..." style={{ ...inp, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, border: "none", cursor: "pointer" }}>
              {loading ? "Saving…" : `Save · KES ${paid > 0 ? paid.toLocaleString() : "—"}`}
            </button>
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Flag Modal ────────────────────────────────────────────────────────────────

function FlagModal({ student, onClose, onDone }: { student: Student; onClose: () => void; onDone: () => void }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!message.trim()) { setError("Please describe the correction needed."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/student-flags", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: student.id, message: message.trim() }),
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
              <div style={{ fontWeight: 700, color: "var(--dark)" }}>{student.name}</div>
              <div style={{ color: "var(--muted)", fontSize: ".75rem" }}>{student.class_name} · {student.phone}</div>
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {error && <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "9px 12px", color: "#dc2626", fontSize: ".8rem" }}>{error}</div>}
              <div>
                <label style={lbl}>Correction needed *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                  placeholder="Describe what needs to be corrected — e.g. wrong class name, wrong category, duplicate entry, etc."
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

// ─── Student Table ─────────────────────────────────────────────────────────────

function StudentTable({ students, onEdit, onPay, onFlag }: {
  students: Student[];
  onEdit:   (s: Student) => void;
  onPay:    (s: Student) => void;
  onFlag:   (s: Student) => void;
}) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const grouped: Record<string, Student[]> = {};
  for (const s of students) {
    const key = s.class_name || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const classes = Object.keys(grouped).sort();

  if (students.length === 0) return null;

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(17,17,17,.08)" }}>
              <th style={TH}>Student</th>
              <th style={TH}>Phone</th>
              <th style={TH}>Joined</th>
              <th style={{ ...TH, minWidth: "110px" }}>Course</th>
              <th style={TH}>Monthly</th>
              <th style={TH}>Due</th>
              <th style={TH}>Paid</th>
              <th style={TH}>Balance</th>
              <th style={TH}>Method</th>
              <th style={TH}>Registered</th>
              <th style={{ ...TH, width: "1px" }}></th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <React.Fragment key={cls}>
                {/* Subtle class divider */}
                <tr>
                  <td colSpan={11} style={{ padding: "8px 14px 4px", background: "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: ".56rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(17,17,17,.28)", whiteSpace: "nowrap" }}>
                        {cls}
                      </span>
                      <div style={{ flex: 1, height: "1px", background: "rgba(17,17,17,.06)" }} />
                      <span style={{ fontSize: ".56rem", color: "rgba(17,17,17,.22)", fontWeight: 600 }}>
                        {grouped[cls].length}
                      </span>
                    </div>
                  </td>
                </tr>

                {grouped[cls].map((s) => {
                  const due      = s.total_due ?? s.amount;
                  const balance  = Math.max(0, due - s.total_paid);
                  const isPaid   = due > 0 && balance <= 0;
                  const owes     = balance > 0;
                  const isHovered = hoveredRow === s.id;

                  return (
                    <tr
                      key={s.id}
                      onMouseEnter={() => setHoveredRow(s.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: "1px solid rgba(17,17,17,.045)",
                        background: isHovered ? "rgba(17,17,17,.018)" : "transparent",
                        transition: "background .08s",
                      }}
                    >
                      {/* Student */}
                      <td style={TD}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{
                            width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                            background: s.type === "online_class" ? "rgba(124,58,237,.13)" : "rgba(232,73,15,.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: ".5rem", fontWeight: 700,
                            color: s.type === "online_class" ? "#7c3aed" : "#E8490F",
                          }}>
                            {initials(s.name)}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".8rem", whiteSpace: "nowrap" }}>{s.name}</span>
                              {s.student_type === "online" && (
                                <span style={{ fontSize: ".48rem", fontWeight: 800, textTransform: "uppercase", background: "rgba(124,58,237,.1)", color: "#7c3aed", padding: "1px 4px", borderRadius: "3px", letterSpacing: ".04em" }}>Zoom</span>
                              )}
                            </div>
                            {cleanNotes(s.notes) && (
                              <div style={{ fontSize: ".63rem", color: "rgba(17,17,17,.38)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {cleanNotes(s.notes)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={TD_M}>{s.phone}</td>
                      <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{s.joined_at ? fmtDate(s.joined_at) : "—"}</td>
                      <td style={TD_M}>{s.class_name}</td>
                      <td style={TD_M}>{s.course_fee_monthly ? s.course_fee_monthly.toLocaleString() : "—"}</td>
                      <td style={TD_M}>{due > 0 ? due.toLocaleString() : "—"}</td>
                      <td style={{ ...TD, fontWeight: 600 }}>{s.total_paid.toLocaleString()}</td>

                      {/* Balance */}
                      <td style={TD}>
                        {due > 0 ? (
                          isPaid ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: ".72rem", color: "#16a34a", fontWeight: 600 }}>
                              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
                              Paid
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", fontSize: ".68rem", fontWeight: 700, background: "rgba(217,119,6,.09)", color: "#d97706", padding: "2px 7px", borderRadius: "100px", whiteSpace: "nowrap" }}>
                              {balance.toLocaleString()} owes
                            </span>
                          )
                        ) : <span style={{ color: "rgba(17,17,17,.25)", fontSize: ".72rem" }}>—</span>}
                      </td>

                      <td style={TD_M}>{METHOD_LABELS[s.method] ?? s.method}</td>
                      <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(s.payment_date)}</td>

                      {/* Actions — visible on hover only */}
                      <td style={{ ...TD, textAlign: "right", opacity: isHovered ? 1 : 0, transition: "opacity .1s", paddingRight: "10px" }}>
                        <div style={{ display: "inline-flex", gap: "3px", alignItems: "center" }}>
                          <button onClick={() => onEdit(s)} title="Edit Student" style={ACT_BTN}>
                            <i className="fas fa-pen" />
                          </button>
                          <button onClick={() => onPay(s)} title="Add Payment" style={{ ...ACT_BTN, color: "#E8490F" }}>
                            <i className="fas fa-plus" />
                          </button>
                          <Link href={`/dashboard/receptionist/receipt/${s.id}`} title="View Receipt" style={ACT_BTN}>
                            <i className="fas fa-receipt" />
                          </Link>
                          <button onClick={() => onFlag(s)} title="Flag for correction" style={{ ...ACT_BTN, color: "#dc2626" }}>
                            <i className="fas fa-flag" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [students,   setStudents]   = useState<Student[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState<CategoryFilter>("all");
  const [showReg,    setShowReg]    = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [payTarget,  setPayTarget]  = useState<Student | null>(null);
  const [flagTarget, setFlagTarget] = useState<Student | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/receptionist/walk-in-members")
      .then((r) => r.json())
      .then((j) => setStudents((j.members ?? []).filter((m: any) => m.type === "physical_class" || m.type === "online_class")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const q        = search.trim().toLowerCase();
  const searched = students.filter((s) =>
    !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.class_name.toLowerCase().includes(q)
  );

  const newStudents       = searched.filter((s) => s.student_type === "new" || s.student_type === null);
  const returningStudents = searched.filter((s) => s.student_type === "returning");
  const onlineStudents    = searched.filter((s) => s.student_type === "online");

  const displayed =
    filter === "new"       ? newStudents :
    filter === "returning" ? returningStudents :
    filter === "online"    ? onlineStudents :
    searched;

  const chips: { key: CategoryFilter; label: string; count: number; icon: string; color: string; bg: string }[] = [
    { key: "new",       label: "New Students",  count: newStudents.length,       icon: "fa-user-plus",  color: "#E8490F", bg: "rgba(232,73,15,.08)"  },
    { key: "returning", label: "Current / Old", count: returningStudents.length, icon: "fa-user-check", color: "#16a34a", bg: "rgba(22,163,74,.08)"  },
    { key: "online",    label: "Zoom Students", count: onlineStudents.length,    icon: "fa-video",      color: "#7c3aed", bg: "rgba(124,58,237,.08)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Students</h2>
          <p>Physical class student records and payments</p>
        </div>
        <button
          onClick={() => setShowReg(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "7px", height: "36px", padding: "0 16px", background: "#E8490F", color: "#fff", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".8rem", cursor: "pointer", letterSpacing: "-.01em" }}
        >
          <i className="fas fa-user-plus" style={{ fontSize: ".72rem" }} />Register Student
        </button>
      </div>

      {/* Stats chips + search — all inline */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        {chips.map(({ key, label, count, icon, color, bg }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter((f) => f === key ? "all" : key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "4px 10px 4px 7px", borderRadius: "100px",
                border: active ? `1.5px solid ${color}` : "1px solid rgba(17,17,17,.11)",
                background: active ? bg : "#fff",
                color: active ? color : "rgba(17,17,17,.48)",
                fontSize: ".72rem", fontWeight: 600,
                cursor: "pointer", transition: "all .12s",
              }}
            >
              <i className={`fas ${icon}`} style={{ fontSize: ".58rem" }} />
              <span style={{ fontWeight: 800 }}>{loading ? "—" : count}</span>
              {label}
            </button>
          );
        })}

        {/* Ghost search */}
        <div style={{ flex: 1, minWidth: "180px", position: "relative", display: "flex", alignItems: "center" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: "8px", color: "rgba(17,17,17,.28)", fontSize: ".68rem", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", height: "30px", paddingLeft: "26px", paddingRight: search ? "26px" : "8px",
              background: "transparent", border: "none",
              borderBottom: "1.5px solid rgba(17,17,17,.1)",
              borderRadius: 0, fontSize: ".78rem", color: "var(--dark)",
              outline: "none", boxSizing: "border-box",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "2px", background: "none", border: "none", color: "rgba(17,17,17,.3)", cursor: "pointer", fontSize: ".65rem", padding: "4px" }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "48px 0", color: "rgba(17,17,17,.4)", fontSize: ".82rem", textAlign: "center" }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading student records…
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "48px 20px", textAlign: "center", color: "rgba(17,17,17,.35)", fontSize: ".82rem" }}>
          {search ? `No results for "${search}"` : filter !== "all" ? "No students in this category yet." : "No students registered yet."}
        </div>
      ) : (
        <StudentTable students={displayed} onEdit={setEditTarget} onPay={setPayTarget} onFlag={setFlagTarget} />
      )}

      {showReg    && <RegisterModal onClose={() => setShowReg(false)}    onRegistered={load} />}
      {editTarget && <EditModal     student={editTarget} onClose={() => setEditTarget(null)} onSaved={load} />}
      {payTarget  && <PaymentModal  student={payTarget}  onClose={() => setPayTarget(null)}  onDone={load} />}
      {flagTarget && <FlagModal     student={flagTarget} onClose={() => setFlagTarget(null)} onDone={() => setFlagTarget(null)} />}
    </div>
  );
}
