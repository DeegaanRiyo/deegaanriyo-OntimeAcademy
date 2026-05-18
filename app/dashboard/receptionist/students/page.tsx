"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PhysicalStudentType, PhysicalStudentPayMethod } from "@/types";
import PhysicalStudentPaymentFields from "@/components/dashboard/forms/PhysicalStudentPaymentFields";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  cash:          "Cash",
  mpesa:         "M-Pesa",
  both:          "Cash + M-Pesa",
  bank_transfer: "Bank Transfer",
};

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)",
  borderRadius: "8px", padding: "9px 12px", color: "var(--dark)",
  fontSize: ".85rem", outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: ".65rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em",
  color: "var(--muted)", marginBottom: "5px",
};

// ─── Register Student Modal ───────────────────────────────────────────────────

function RegisterModal({ onClose, onRegistered }: {
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [studentType,      setStudentType]      = useState<PhysicalStudentType>("new");
  const [fullName,         setFullName]         = useState("");
  const [phone,            setPhone]            = useState("");
  const [email,            setEmail]            = useState("");
  const [className,        setClassName]        = useState("");
  const [courseMonthly,    setCourseMonthly]    = useState("");
  const [regFee,           setRegFee]           = useState("2000");
  const [method,           setMethod]           = useState<PhysicalStudentPayMethod>("cash");
  const [amountPaid,       setAmountPaid]       = useState("");
  const [cashAmount,       setCashAmount]       = useState("");
  const [mpesaAmount,      setMpesaAmount]      = useState("");
  const [mpesaRef,         setMpesaRef]         = useState("");
  const [notes,            setNotes]            = useState("");
  const [joinedAt,         setJoinedAt]         = useState(new Date().toISOString().split("T")[0]);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  const [success,          setSuccess]          = useState<{ name: string; class_name: string; payment_id: string } | null>(null);

  const monthly  = Number(courseMonthly) || 0;
  const rFee     = studentType === "new" ? (Number(regFee) || 0) : 0;
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
    // online: reg fee is optional — no extra validation needed
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/register-physical-student", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName, phone, email: email || undefined, class_name: className,
          student_type: studentType, course_fee_monthly: monthly,
          registration_fee: rFee, total_due: totalDue, amount: amtPaid, method,
          cash_amount:    method === "both" ? (Number(cashAmount) || 0) : undefined,
          mpesa_amount:   method === "both" ? (Number(mpesaAmount) || 0) : undefined,
          mpesa_reference: (method === "mpesa" || method === "both") ? mpesaRef : undefined,
          notes: notes || undefined,
          joined_at: joinedAt,
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "600px", width: "100%", maxHeight: "93vh", overflowY: "auto", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>
            <i className="fas fa-user-graduate" style={{ color: "var(--teal2)", marginRight: "8px" }} />Register Physical Student
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}><i className="fas fa-times" /></button>
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
              <button onClick={() => setSuccess(null)} className="btn-outline" style={{ flex: 1 }}>Register Another</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column" }}>
            {error && <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "10px 14px", color: "#dc2626", fontSize: ".8rem", marginBottom: "14px" }}>{error}</div>}

            {/* Category */}
            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Student Category *</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["new", "returning", "online"] as PhysicalStudentType[]).map((type) => (
                  <label key={type} style={{ flex: 1, display: "flex", alignItems: "center", gap: "7px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", border: studentType === type ? `1.5px solid ${type === "online" ? "#7c3aed" : "var(--teal2)"}` : "1px solid rgba(17,17,17,.15)", background: studentType === type ? (type === "online" ? "rgba(124,58,237,.06)" : "rgba(193,68,14,.06)") : "rgba(17,17,17,.04)", fontSize: ".82rem", fontWeight: studentType === type ? 700 : 400, color: studentType === type ? (type === "online" ? "#7c3aed" : "var(--teal2)") : "var(--muted)" }}>
                    <input type="radio" name="reg_stype" value={type} checked={studentType === type} onChange={() => setStudentType(type)} style={{ accentColor: type === "online" ? "#7c3aed" : "var(--teal2)" }} />
                    <i className={`fas ${type === "new" ? "fa-user-plus" : type === "returning" ? "fa-user-check" : "fa-wifi"}`} />
                    {type === "new" ? "New Student" : type === "returning" ? "Current / Old" : "Online"}
                  </label>
                ))}
              </div>
              {studentType === "returning" && (
                <div style={{ marginTop: "7px", fontSize: ".73rem", color: "var(--muted)", background: "rgba(17,17,17,.03)", borderRadius: "6px", padding: "6px 10px", border: "1px solid rgba(17,17,17,.08)" }}>
                  <i className="fas fa-info-circle" style={{ marginRight: "5px" }} />Student was enrolled before the system — no registration fee applies.
                </div>
              )}
              {studentType === "online" && (
                <div style={{ marginTop: "7px", fontSize: ".73rem", color: "#7c3aed", background: "rgba(124,58,237,.05)", borderRadius: "6px", padding: "6px 10px", border: "1px solid rgba(124,58,237,.2)" }}>
                  <i className="fas fa-wifi" style={{ marginRight: "5px" }} />Online student — attends remotely. Registration fee is optional.
                </div>
              )}
            </div>

            {/* Personal info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div><label style={lbl}>Full Name *</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ahmed Hassan" required style={inp} /></div>
              <div><label style={lbl}>Phone *</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" required style={inp} /></div>
              <div><label style={lbl}>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ahmed@email.com" style={inp} /></div>
              <div><label style={lbl}>Class / Course *</label><input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Python Bootcamp" required style={inp} /></div>
              <div><label style={lbl}>Date Joined *</label><input type="date" value={joinedAt} onChange={(e) => setJoinedAt(e.target.value)} required style={inp} /></div>
            </div>

            <PhysicalStudentPaymentFields
              studentType={studentType} method={method} setMethod={setMethod}
              courseMonthly={courseMonthly} setCourseMonthly={setCourseMonthly}
              regFee={regFee} setRegFee={setRegFee}
              amountPaid={amountPaid} setAmountPaid={setAmountPaid}
              cashAmount={cashAmount} setCashAmount={setCashAmount}
              mpesaAmount={mpesaAmount} setMpesaAmount={setMpesaAmount}
              mpesaRef={mpesaRef} setMpesaRef={setMpesaRef}
            />

            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any additional notes..." style={{ ...inp, resize: "vertical" }} />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ border: "none", cursor: "pointer", opacity: loading ? .6 : 1 }}>
              {loading
                ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "7px" }} />Registering…</>
                : <><i className="fas fa-user-graduate" style={{ marginRight: "7px" }} />Register Student · KES {amtPaid > 0 ? amtPaid.toLocaleString() : "—"} paid</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Edit Student Modal ───────────────────────────────────────────────────────

function EditModal({ student, onClose, onSaved }: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
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
  const [cashAmount,    setCashAmount]    = useState(String(student.cash_amount   ?? ""));
  const [mpesaAmount,   setMpesaAmount]  = useState(String(student.mpesa_amount  ?? ""));
  const [mpesaRef,      setMpesaRef]     = useState(student.mpesa_reference ?? student.reference ?? "");
  const [notes,         setNotes]        = useState(cleanNotes(student.notes));
  const [joinedAt,      setJoinedAt]     = useState(student.joined_at ? student.joined_at.split("T")[0] : "");
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState<string | null>(null);

  const monthly  = Number(courseMonthly) || 0;
  const rFee     = studentType === "new" ? (Number(regFee) || 0) : 0;
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
          cash_amount:    method === "both" ? (Number(cashAmount) || 0) : 0,
          mpesa_amount:   method === "both" ? (Number(mpesaAmount) || 0) : 0,
          mpesa_reference: (method === "mpesa" || method === "both") ? mpesaRef : "",
          notes,
          joined_at: joinedAt,
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
      <div className="card" style={{ maxWidth: "620px", width: "100%", maxHeight: "93vh", overflowY: "auto", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>
            <i className="fas fa-pen" style={{ color: "var(--teal2)", marginRight: "8px" }} />Edit Student Record
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}><i className="fas fa-times" /></button>
        </div>

        <form onSubmit={save} style={{ display: "flex", flexDirection: "column" }}>
          {error && <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "10px 14px", color: "#dc2626", fontSize: ".8rem", marginBottom: "14px" }}>{error}</div>}

          {/* Category */}
          <div style={{ marginBottom: "14px" }}>
            <label style={lbl}>Student Category *</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["new", "returning", "online"] as PhysicalStudentType[]).map((type) => (
                <label key={type} style={{ flex: 1, display: "flex", alignItems: "center", gap: "7px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", border: studentType === type ? `1.5px solid ${type === "online" ? "#7c3aed" : "var(--teal2)"}` : "1px solid rgba(17,17,17,.15)", background: studentType === type ? (type === "online" ? "rgba(124,58,237,.06)" : "rgba(193,68,14,.06)") : "rgba(17,17,17,.04)", fontSize: ".82rem", fontWeight: studentType === type ? 700 : 400, color: studentType === type ? (type === "online" ? "#7c3aed" : "var(--teal2)") : "var(--muted)" }}>
                  <input type="radio" name="edit_stype" value={type} checked={studentType === type} onChange={() => setStudentType(type)} style={{ accentColor: type === "online" ? "#7c3aed" : "var(--teal2)" }} />
                  <i className={`fas ${type === "new" ? "fa-user-plus" : type === "returning" ? "fa-user-check" : "fa-wifi"}`} />
                  {type === "new" ? "New Student" : type === "returning" ? "Current / Old" : "Online"}
                </label>
              ))}
            </div>
            {studentType === "returning" && (
              <div style={{ marginTop: "7px", fontSize: ".73rem", color: "var(--muted)", background: "rgba(17,17,17,.03)", borderRadius: "6px", padding: "6px 10px", border: "1px solid rgba(17,17,17,.08)" }}>
                <i className="fas fa-info-circle" style={{ marginRight: "5px" }} />No registration fee — student was enrolled before the system.
              </div>
            )}
            {studentType === "online" && (
              <div style={{ marginTop: "7px", fontSize: ".73rem", color: "#7c3aed", background: "rgba(124,58,237,.05)", borderRadius: "6px", padding: "6px 10px", border: "1px solid rgba(124,58,237,.2)" }}>
                <i className="fas fa-wifi" style={{ marginRight: "5px" }} />Online student — attends remotely. Registration fee is optional.
              </div>
            )}
          </div>

          {/* Personal info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div><label style={lbl}>Full Name *</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inp} /></div>
            <div><label style={lbl}>Phone *</label><input value={phone} onChange={(e) => setPhone(e.target.value)} required style={inp} /></div>
            <div><label style={lbl}>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Class / Course *</label><input value={className} onChange={(e) => setClassName(e.target.value)} required style={inp} /></div>
            <div><label style={lbl}>Date Joined *</label><input type="date" value={joinedAt} onChange={(e) => setJoinedAt(e.target.value)} required style={inp} /></div>
          </div>

          <PhysicalStudentPaymentFields
            studentType={studentType} method={method} setMethod={setMethod}
            courseMonthly={courseMonthly} setCourseMonthly={setCourseMonthly}
            regFee={regFee} setRegFee={setRegFee}
            amountPaid={amountPaid} setAmountPaid={setAmountPaid}
            cashAmount={cashAmount} setCashAmount={setCashAmount}
            mpesaAmount={mpesaAmount} setMpesaAmount={setMpesaAmount}
            mpesaRef={mpesaRef} setMpesaRef={setMpesaRef}
          />

          <div style={{ marginBottom: "14px" }}>
            <label style={lbl}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any additional notes..." style={{ ...inp, resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, border: "none", cursor: "pointer", opacity: loading ? .6 : 1 }}>
              {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "7px" }} />Saving…</> : <><i className="fas fa-save" style={{ marginRight: "7px" }} />Save Changes</>}
            </button>
            <button type="button" className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
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
          type: student.type,
          customer_name:  student.name,
          customer_phone: student.phone,
          amount: paid,
          method,
          reference: ref || null,
          cash_amount: method === "both" ? (Number(cashAmt) || 0) : undefined,
          mpesa_amount: method === "both" ? (Number(mpesaAmt) || 0) : undefined,
          notes: notes || undefined,
        }),
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
      <div className="card" style={{ maxWidth: "400px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>Record Payment</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "8px 12px", marginBottom: "16px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
          <div style={{ fontWeight: 700, color: "var(--dark)" }}>{student.name}</div>
          <div style={{ color: "var(--muted)", fontSize: ".75rem" }}>{student.class_name}</div>
          {(student.course_fee_monthly ?? 0) > 0 && (
            <div style={{ marginTop: "6px", fontSize: ".75rem", color: "var(--muted)" }}>
              Monthly fee: <strong style={{ color: "var(--teal2)" }}>
                KES {(student.course_fee_monthly ?? 0).toLocaleString()}
              </strong>
            </div>
          )}
          {(student.total_due ?? 0) > 0 && student.total_paid < (student.total_due ?? 0) && (
            <div style={{ marginTop: "4px", fontSize: ".75rem", color: "var(--muted)" }}>
              Outstanding: <strong style={{ color: "#d97706" }}>
                KES {Math.max(0, (student.total_due ?? 0) - student.total_paid).toLocaleString()}
              </strong>
            </div>
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
          {method === "mpesa" && (
            <>
              <div><label style={lbl}>Amount (KES) *</label><input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 3000" required style={inp} /></div>
              <div><label style={lbl}>M-Pesa Reference</label><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. QA12BCD3E4" style={inp} /></div>
            </>
          )}
          {method === "both" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div><label style={lbl}>Cash (KES)</label><input type="number" min="0" value={cashAmt} onChange={(e) => setCashAmt(e.target.value)} placeholder="2000" style={inp} /></div>
                <div><label style={lbl}>M-Pesa (KES)</label><input type="number" min="0" value={mpesaAmt} onChange={(e) => setMpesaAmt(e.target.value)} placeholder="3000" style={inp} /></div>
              </div>
              <div><label style={lbl}>M-Pesa Reference</label><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. QA12BCD3E4" style={inp} /></div>
              {paid > 0 && <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>Total: <strong style={{ color: "var(--teal2)" }}>KES {paid.toLocaleString()}</strong></div>}
            </>
          )}

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

// ─── Flag Modal ───────────────────────────────────────────────────────────────

function FlagModal({ student, onClose, onDone }: {
  student: Student;
  onClose: () => void;
  onDone:  () => void;
}) {
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
      setSent(true);
      onDone();
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
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe what needs to be corrected — e.g. wrong class name, wrong category, duplicate entry, etc."
                  required
                  style={{ ...inp, resize: "vertical" }}
                  autoFocus
                />
                <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "4px" }}>
                  This message will be sent to the owner for review.
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", opacity: loading ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}
                >
                  {loading
                    ? <><i className="fas fa-spinner fa-spin" />Sending…</>
                    : <><i className="fas fa-flag" />Send Flag</>
                  }
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

// ─── Student Table ────────────────────────────────────────────────────────────

function StudentTable({ students, onEdit, onPay, onFlag }: {
  students: Student[];
  onEdit: (s: Student) => void;
  onPay:  (s: Student) => void;
  onFlag: (s: Student) => void;
}) {
  // Group by class for divider rows
  const grouped: Record<string, Student[]> = {};
  for (const s of students) {
    const key = s.class_name || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const classes = Object.keys(grouped).sort();

  if (students.length === 0) return null;

  return (
    <div className="card">
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Phone</th>
              <th>Joined</th>
              <th style={{ minWidth: "120px" }}>Course</th>
              <th>Monthly Fee</th>
              <th>Total Due</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Method</th>
              <th>Registered</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <React.Fragment key={cls}>
                {/* Course Divider Row */}
                <tr>
                  <td colSpan={11} style={{ 
                    background: "rgba(17,17,17,.02)", 
                    padding: "8px 18px", 
                    fontSize: ".7rem", 
                    fontWeight: 800, 
                    textTransform: "uppercase", 
                    letterSpacing: ".1em",
                    color: "var(--muted2)",
                    borderBottom: "1px solid var(--border2)"
                  }}>
                    <i className="fas fa-chalkboard-teacher" style={{ marginRight: "8px", color: "var(--teal2)" }} />
                    {cls}
                  </td>
                </tr>
                {grouped[cls].map((s) => {
                  const due         = s.total_due ?? s.amount;
                  const balance     = Math.max(0, due - s.total_paid);
                  const isPaid      = due > 0 && balance <= 0;
                  const owes        = balance > 0;

                  return (
                    <tr key={s.id}>
                      <td style={{ padding: "10px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                          <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(193,68,14,.1)", border: "1px solid rgba(193,68,14,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".6rem", fontWeight: 700, color: "var(--teal2)", flexShrink: 0 }}>
                            {initials(s.name)}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>{s.name}</span>
                            {s.student_type === "online" && (
                              <span style={{ fontSize: ".55rem", fontWeight: 800, textTransform: "uppercase", background: "rgba(124,58,237,.12)", color: "#7c3aed", padding: "1px 5px", borderRadius: "4px", letterSpacing: ".04em" }}>Online</span>
                            )}
                          </div>
                            {cleanNotes(s.notes) && (
                              <div style={{ fontSize: ".68rem", color: "var(--muted)", fontStyle: "italic", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cleanNotes(s.notes)}>
                                {cleanNotes(s.notes)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>{s.phone}</td>
                      <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                        {s.joined_at ? fmtDate(s.joined_at) : "—"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>{s.class_name}</td>
                      <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                        {s.course_fee_monthly ? s.course_fee_monthly.toLocaleString() : "—"}
                      </td>
                      <td style={{ fontWeight: 500, color: "var(--dark)", fontSize: ".8rem" }}>
                        {due > 0 ? due.toLocaleString() : "—"}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".8rem" }}>
                        {s.total_paid.toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: 700, color: owes ? "#d97706" : "var(--green)", fontSize: ".82rem" }}>
                            {due > 0 ? balance.toLocaleString() : "—"}
                          </span>
                          {isPaid && <span style={{ fontSize: ".6rem", fontWeight: 800, textTransform: "uppercase", background: "rgba(34,197,94,.12)", color: "var(--green)", padding: "1px 5px", borderRadius: "4px" }}>Paid</span>}
                          {owes && <span style={{ fontSize: ".6rem", fontWeight: 800, textTransform: "uppercase", background: "rgba(245,158,11,.12)", color: "#d97706", padding: "1px 5px", borderRadius: "4px" }}>Owes</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                          <span>{METHOD_LABELS[s.method] ?? s.method}</span>
                          {s.method === "both" && <span style={{ fontSize: ".65rem", opacity: .7 }}>Split</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: ".75rem", color: "var(--muted)" }}>{fmtDate(s.payment_date)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "4px" }}>
                          <button onClick={() => onEdit(s)} className="act-btn" title="Edit Student">
                            <i className="fas fa-pen" style={{ fontSize: ".7rem" }} />
                          </button>
                          <button onClick={() => onPay(s)} className="act-btn" title="Add Payment" style={{ color: "var(--teal2)", borderColor: "rgba(193,68,14,.2)" }}>
                            <i className="fas fa-plus" style={{ fontSize: ".7rem" }} />
                          </button>
                          <Link href={`/dashboard/receptionist/receipt/${s.id}`} className="act-btn" title="View Receipt">
                            <i className="fas fa-receipt" style={{ fontSize: ".7rem" }} />
                          </Link>
                          <button onClick={() => onFlag(s)} className="act-btn" title="Flag for correction" style={{ color: "#dc2626", borderColor: "rgba(220,38,38,.2)" }}>
                            <i className="fas fa-flag" style={{ fontSize: ".7rem" }} />
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

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  const q         = search.trim().toLowerCase();
  const searched  = students.filter((s) =>
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

  return (
    <div>
      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Students</h2>
          <p>Physical class student records and payments</p>
        </div>
        <button onClick={() => setShowReg(true)} className="btn-primary" style={{ border: "none", cursor: "pointer" }}>
          <i className="fas fa-user-plus" style={{ marginRight: "7px" }} />Register Student
        </button>
      </div>

      {/* Stats row (horizontal) */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button
          onClick={() => setFilter((f) => f === "new" ? "all" : "new")}
          style={{
            flex: 1, minWidth: "220px", display: "flex", alignItems: "center", gap: "12px",
            padding: "14px 18px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
            border: filter === "new" ? "2px solid var(--teal2)" : "1px solid var(--border)",
            background: filter === "new" ? "rgba(193,68,14,.06)" : "#fff",
            transition: "all .15s",
          }}
        >
          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(193,68,14,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="fas fa-user-plus" style={{ color: "var(--teal2)", fontSize: ".9rem" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1.1 }}>
              {loading ? "—" : newStudents.length}
            </div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>New Students</div>
          </div>
        </button>

        <button
          onClick={() => setFilter((f) => f === "returning" ? "all" : "returning")}
          style={{
            flex: 1, minWidth: "220px", display: "flex", alignItems: "center", gap: "12px",
            padding: "14px 18px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
            border: filter === "returning" ? "2px solid #16a34a" : "1px solid var(--border)",
            background: filter === "returning" ? "rgba(34,197,94,.06)" : "#fff",
            transition: "all .15s",
          }}
        >
          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(34,197,94,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="fas fa-user-check" style={{ color: "#16a34a", fontSize: ".9rem" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1.1 }}>
              {loading ? "—" : returningStudents.length}
            </div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Current / Old</div>
          </div>
        </button>

        <button
          onClick={() => setFilter((f) => f === "online" ? "all" : "online")}
          style={{
            flex: 1, minWidth: "220px", display: "flex", alignItems: "center", gap: "12px",
            padding: "14px 18px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
            border: filter === "online" ? "2px solid #7c3aed" : "1px solid var(--border)",
            background: filter === "online" ? "rgba(124,58,237,.06)" : "#fff",
            transition: "all .15s",
          }}
        >
          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(124,58,237,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="fas fa-wifi" style={{ color: "#7c3aed", fontSize: ".9rem" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1.1 }}>
              {loading ? "—" : onlineStudents.length}
            </div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Online Students</div>
          </div>
        </button>

        {/* Search (now part of the row) */}
        <div style={{ flex: 2, minWidth: "300px", position: "relative" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: ".85rem", pointerEvents: "none" }} />
          <input
            type="text" placeholder="Search students…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="form-input" style={{ paddingLeft: "38px", height: "100%", minHeight: "62px", background: "#fff" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", color: "var(--muted)", fontSize: ".85rem", textAlign: "center" }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading student records…
        </div>
      ) : displayed.length === 0 ? (
        <div className="card">
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            {search ? `No results for "${search}"` : filter !== "all" ? "No students in this category yet." : "No students registered yet."}
          </div>
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
