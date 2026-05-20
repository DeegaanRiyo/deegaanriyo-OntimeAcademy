"use client";

import React from "react";
import { PhysicalStudentType, PhysicalStudentPayMethod } from "@/types";

interface Props {
  studentType: PhysicalStudentType;
  method: PhysicalStudentPayMethod;
  setMethod: (v: PhysicalStudentPayMethod) => void;
  courseMonthly: string;
  setCourseMonthly: (v: string) => void;
  regFee: string;
  setRegFee: (v: string) => void;
  amountPaid: string;
  setAmountPaid: (v: string) => void;
  cashAmount: string;
  setCashAmount: (v: string) => void;
  mpesaAmount: string;
  setMpesaAmount: (v: string) => void;
  mpesaRef: string;
  setMpesaRef: (v: string) => void;
}

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

export default function PhysicalStudentPaymentFields({
  studentType, method, setMethod,
  courseMonthly, setCourseMonthly,
  regFee, setRegFee,
  amountPaid, setAmountPaid,
  cashAmount, setCashAmount,
  mpesaAmount, setMpesaAmount,
  mpesaRef, setMpesaRef,
}: Props) {
  const monthly  = Number(courseMonthly) || 0;
  const rFee     = (studentType === "new" || studentType === "zoom_virtual") ? (Number(regFee) || 0) : 0;
  const totalDue = monthly + rFee;
  const paid     = method === "both"
    ? (Number(cashAmount) || 0) + (Number(mpesaAmount) || 0)
    : Number(amountPaid) || 0;
  const outstanding = totalDue > 0 ? Math.max(0, totalDue - paid) : 0;
  const isPartial   = totalDue > 0 && paid > 0 && paid < totalDue;
  const isOverpaid  = totalDue > 0 && paid > totalDue;

  return (
    <>
      {/* Fee Breakdown */}
      <div style={{ padding: "14px", background: "rgba(17,17,17,.03)", borderRadius: "10px", border: "1px solid rgba(17,17,17,.08)", marginBottom: "14px" }}>
        <div style={{ ...lbl, marginBottom: "10px" }}>Fee Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={lbl}>Monthly Course Fee (KES) *</label>
            <input type="number" min="1" value={courseMonthly} onChange={(e) => setCourseMonthly(e.target.value)} placeholder="e.g. 5000" required style={inp} />
          </div>
          {(studentType === "new" || studentType === "zoom_virtual") && (
            <div>
              <label style={lbl}>
                Registration Fee (KES){studentType === "new" ? " *" : ""}
              </label>
              <input
                type="number" min="0"
                value={regFee}
                onChange={(e) => setRegFee(e.target.value)}
                placeholder="e.g. 2000"
                required={studentType === "new"}
                style={inp}
              />
            </div>
          )}
        </div>
        {totalDue > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", padding: "8px 12px", borderRadius: "8px", background: "rgba(193,68,14,.07)", border: "1px solid rgba(193,68,14,.2)" }}>
            <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>
              <i className="fas fa-calculator" style={{ marginRight: "6px" }} />Total Due
              {studentType === "new" && rFee > 0 && monthly > 0 && (
                <span style={{ fontSize: ".7rem", marginLeft: "5px" }}>({monthly.toLocaleString()} + {rFee.toLocaleString()})</span>
              )}
            </span>
            <strong style={{ color: "var(--teal2)", fontSize: ".9rem" }}>KES {totalDue.toLocaleString()}</strong>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div style={{ marginBottom: "14px" }}>
        <label style={lbl}>Payment Method *</label>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["cash", "mpesa", "both"] as PhysicalStudentPayMethod[]).map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)} style={{
              flex: 1, padding: "8px 10px", borderRadius: "8px", cursor: "pointer", fontSize: ".78rem",
              fontWeight: method === m ? 700 : 400,
              border: method === m ? "1.5px solid var(--teal2)" : "1px solid rgba(17,17,17,.15)",
              background: method === m ? "rgba(193,68,14,.08)" : "rgba(17,17,17,.04)",
              color: method === m ? "var(--teal2)" : "var(--muted)",
            }}>
              <i className={`fas ${m === "cash" ? "fa-money-bill-wave" : m === "mpesa" ? "fa-mobile-alt" : "fa-layer-group"}`} style={{ marginRight: "5px" }} />
              {m === "cash" ? "Cash" : m === "mpesa" ? "M-Pesa" : "Both"}
            </button>
          ))}
        </div>
      </div>

      {method === "cash" && (
        <div style={{ marginBottom: "14px" }}>
          <label style={lbl}>Amount Paid — Cash (KES) *</label>
          <input type="number" min="1" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="e.g. 5000" required style={inp} />
        </div>
      )}
      {method === "mpesa" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label style={lbl}>Amount Paid — M-Pesa (KES) *</label>
            <input type="number" min="1" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="e.g. 5000" required style={inp} />
          </div>
          <div>
            <label style={lbl}>M-Pesa Reference</label>
            <input value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} placeholder="e.g. QA12BCD3E4" style={inp} />
          </div>
        </div>
      )}
      {method === "both" && (
        <div style={{ padding: "12px", background: "rgba(17,17,17,.03)", borderRadius: "10px", border: "1px solid rgba(17,17,17,.08)", marginBottom: "14px" }}>
          <div style={{ ...lbl, marginBottom: "10px" }}>Split Payment</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={lbl}>Cash Amount (KES)</label>
              <input type="number" min="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="e.g. 2000" style={inp} />
            </div>
            <div>
              <label style={lbl}>M-Pesa Amount (KES)</label>
              <input type="number" min="0" value={mpesaAmount} onChange={(e) => setMpesaAmount(e.target.value)} placeholder="e.g. 3000" style={inp} />
            </div>
            <div>
              <label style={lbl}>M-Pesa Reference</label>
              <input value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} placeholder="e.g. QA12BCD3E4" style={inp} />
            </div>
            {paid > 0 && (
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div style={{ padding: "9px 12px", borderRadius: "8px", background: "rgba(193,68,14,.07)", border: "1px solid rgba(193,68,14,.2)", fontSize: ".82rem", width: "100%" }}>
                  <span style={{ color: "var(--muted)" }}>Total: </span>
                  <strong style={{ color: "var(--teal2)" }}>KES {paid.toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Balance preview */}
      {totalDue > 0 && paid > 0 && (
        <div style={{
          borderRadius: "8px", padding: "9px 13px", marginBottom: "14px",
          background: isOverpaid ? "rgba(59,130,246,.07)" : isPartial ? "rgba(245,158,11,.07)" : "rgba(34,197,94,.07)",
          border: isOverpaid ? "1px solid rgba(59,130,246,.25)" : isPartial ? "1px solid rgba(245,158,11,.25)" : "1px solid rgba(34,197,94,.25)",
          fontSize: ".78rem", display: "flex", alignItems: "center", gap: "8px",
        }}>
          <i className={`fas ${isOverpaid ? "fa-arrow-up" : isPartial ? "fa-clock" : "fa-check-circle"}`}
            style={{ color: isOverpaid ? "var(--blue)" : isPartial ? "#d97706" : "var(--green)" }} />
          {isPartial && <><strong style={{ color: "#d97706" }}>Partial</strong><span style={{ color: "var(--muted)" }}> · KES {outstanding.toLocaleString()} outstanding of KES {totalDue.toLocaleString()}</span></>}
          {!isPartial && !isOverpaid && <strong style={{ color: "var(--green)" }}>Full payment · KES {totalDue.toLocaleString()} settled</strong>}
          {isOverpaid && <><strong style={{ color: "var(--blue)" }}>Overpaid</strong><span style={{ color: "var(--muted)" }}> · KES {(paid - totalDue).toLocaleString()} over</span></>}
        </div>
      )}
    </>
  );
}
