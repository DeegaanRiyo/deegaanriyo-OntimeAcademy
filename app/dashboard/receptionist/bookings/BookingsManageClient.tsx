"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type PayMethod = "cash" | "mpesa" | "bank_transfer";

type Booking = {
  id:             string;
  visitor_name:   string;
  visitor_phone:  string;
  booking_date:   string;
  start_time:     string;
  end_time:       string | null;
  hours:          number | null;
  estimated_cost: number | null;
  total_paid:     number;
  method:         string | null;
  notes:          string | null;
  created_at:     string;
  spaces:         { id: string; name: string } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", mpesa: "M-Pesa", bank_transfer: "Bank Transfer",
};

// ─── Style tokens ─────────────────────────────────────────────────────────────

const F_INP: React.CSSProperties = {
  width: "100%", height: "34px", background: "#fff",
  border: "1px solid rgba(17,17,17,.12)", borderRadius: "6px",
  padding: "0 10px", color: "var(--dark)", fontSize: ".8rem",
  outline: "none", boxSizing: "border-box",
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

// ─── TimePicker ───────────────────────────────────────────────────────────────
// value / onChange use HH:MM (24-h) so the API stays unchanged.
// period is stored as real state so the AM/PM button works immediately,
// even before hour & minute are chosen.

function TimePicker({ label, value, onChange }: {
  label:    string;
  value:    string;               // "" or "HH:MM"
  onChange: (v: string) => void;  // emits "HH:MM"
}) {
  // Derive initial 12-h parts from value
  function parsePeriod(v: string): "AM" | "PM" {
    if (!v) return "AM";
    const h = Number(v.split(":")[0]);
    return h >= 12 ? "PM" : "AM";
  }
  function parseHour(v: string): string {
    if (!v) return "";
    const h = Number(v.split(":")[0]);
    return String(h % 12 || 12);
  }
  function parseMin(v: string): string {
    if (!v) return "";
    return v.split(":")[1] ?? "";
  }

  const [hour12,    setHour12]    = useState(() => parseHour(value));
  const [minuteStr, setMinuteStr] = useState(() => parseMin(value));
  const [period,    setPeriod]    = useState<"AM" | "PM">(() => parsePeriod(value));

  // Sync internal state when parent resets value to ""
  useEffect(() => {
    if (!value) { setHour12(""); setMinuteStr(""); setPeriod("AM"); }
    else {
      setHour12(parseHour(value));
      setMinuteStr(parseMin(value));
      setPeriod(parsePeriod(value));
    }
  }, [value]);

  function emit(h12: string, m: string, per: "AM" | "PM") {
    if (!h12 || !m) return;
    let h24 = Number(h12) % 12;
    if (per === "PM") h24 += 12;
    onChange(`${String(h24).padStart(2, "0")}:${m}`);
  }

  function onHourChange(v: string) {
    setHour12(v);
    emit(v, minuteStr, period);
  }
  function onMinuteChange(v: string) {
    setMinuteStr(v);
    emit(hour12, v, period);
  }
  function togglePeriod() {
    const newPer: "AM" | "PM" = period === "AM" ? "PM" : "AM";
    setPeriod(newPer);
    emit(hour12, minuteStr, newPer);
  }

  const sel: React.CSSProperties = {
    height: "34px", background: "#fff",
    border: "1px solid rgba(17,17,17,.12)", borderRadius: "6px",
    padding: "0 6px", color: "var(--dark)", fontSize: ".8rem",
    outline: "none", cursor: "pointer",
  };

  return (
    <div>
      <label style={F_LBL}>{label}</label>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {/* Hour */}
        <select value={hour12} onChange={(e) => onHourChange(e.target.value)} style={{ ...sel, flex: 1 }}>
          <option value="">Hr</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={String(h)}>{h}</option>
          ))}
        </select>

        <span style={{ color: "rgba(17,17,17,.3)", fontWeight: 700, fontSize: ".8rem" }}>:</span>

        {/* Minute */}
        <select value={minuteStr} onChange={(e) => onMinuteChange(e.target.value)} style={{ ...sel, flex: 1 }}>
          <option value="">Min</option>
          {["00", "15", "30", "45"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* AM / PM — always clickable, updates instantly */}
        <button type="button" onClick={togglePeriod}
          style={{ height: "34px", minWidth: "44px", borderRadius: "6px", border: "none", fontWeight: 800, fontSize: ".72rem", cursor: "pointer", transition: "all .12s", background: period === "AM" ? "rgba(37,99,235,.12)" : "rgba(232,73,15,.12)", color: period === "AM" ? "#2563eb" : "#E8490F" }}>
          {period}
        </button>
      </div>
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

// ─── MethodToggle ─────────────────────────────────────────────────────────────

function MethodToggle({ value, onChange }: { value: PayMethod; onChange: (v: PayMethod) => void }) {
  const methods: { v: PayMethod; label: string }[] = [
    { v: "cash",          label: "Cash"  },
    { v: "mpesa",         label: "M-Pesa" },
    { v: "bank_transfer", label: "Bank"  },
  ];
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {methods.map(({ v, label }) => {
        const active = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            style={{ flex: 1, height: "30px", borderRadius: "6px", border: active ? "none" : "1px solid rgba(17,17,17,.12)", background: active ? "#E8490F" : "transparent", color: active ? "#fff" : "rgba(17,17,17,.45)", fontWeight: active ? 700 : 500, fontSize: ".7rem", cursor: "pointer" }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── BookingModal ─────────────────────────────────────────────────────────────

function BookingModal({
  spaces,
  onClose,
  onBooked,
}: {
  spaces:    { id: string; name: string }[];
  onClose:   () => void;
  onBooked:  () => void;
}) {
  // Date helpers — computed once on mount (client-side is fine for Kenya)
  const todayStr = new Date().toLocaleDateString("en-CA");
  const maxDateStr = (() => {
    const d = new Date(); d.setDate(d.getDate() + 20);
    return d.toLocaleDateString("en-CA");
  })();

  const [spaceId,    setSpaceId]    = useState(spaces[0]?.id ?? "");
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [date,       setDate]       = useState(todayStr);
  const [startTime,  setStartTime]  = useState("");
  const [endTime,    setEndTime]    = useState("");
  const [cost,       setCost]       = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [method,     setMethod]     = useState<PayMethod>("cash");
  const [reference,  setReference]  = useState("");
  const [notes,      setNotes]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<{ name: string; balance: number; id: string } | null>(null);

  const showRef   = method === "mpesa" || method === "bank_transfer";
  const totalCost = Number(cost)       || 0;
  const paid      = Number(amountPaid) || 0;
  const balance   = totalCost > 0 ? totalCost - paid : 0;

  const balanceColor  = balance <= 0 ? "#16a34a" : "#b45309";
  const balanceBg     = balance <= 0 ? "rgba(22,163,74,.07)"  : "rgba(180,83,9,.07)";
  const balanceBorder = balance <= 0 ? "rgba(22,163,74,.2)"   : "rgba(180,83,9,.2)";

  function reset() {
    setName(""); setPhone(""); setDate(todayStr); setStartTime(""); setEndTime("");
    setCost(""); setAmountPaid(""); setMethod("cash"); setReference(""); setNotes("");
    setSpaceId(spaces[0]?.id ?? "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!spaceId)    { setError("Select a space.");            return; }
    if (!startTime)  { setError("Enter start time.");          return; }
    if (!endTime)    { setError("Enter end time.");            return; }
    if (endTime <= startTime) { setError("End time must be after start time."); return; }
    if (paid <= 0)   { setError("Enter the amount paid.");     return; }

    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id:          spaceId,
          visitor_name:      name,
          visitor_phone:     phone,
          booking_date:      date,
          start_time:        startTime,
          end_time:          endTime,
          estimated_cost:    totalCost > 0 ? totalCost : null,
          amount_paid:       paid,
          payment_method:    method,
          payment_reference: reference.trim() || null,
          notes:             notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save booking");
      if (json.payment_error) throw new Error(`Booking saved but payment failed: ${json.payment_error}`);
      setSuccess({ name, balance: Math.max(0, balance), id: json.booking.id });
      onBooked();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div style={{ maxWidth: "500px", width: "100%", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,.15)" }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(17,17,17,.06)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".92rem", color: "var(--dark)" }}>New Booking</div>
            <div style={{ fontSize: ".68rem", color: "rgba(17,17,17,.35)", marginTop: "1px" }}>Record a space booking & payment</div>
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
            <div style={{ fontWeight: 800, fontSize: ".95rem", color: "var(--dark)", marginBottom: "6px" }}>
              {success.name} booked
            </div>
            {success.balance > 0 ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(180,83,9,.08)", border: "1px solid rgba(180,83,9,.2)", borderRadius: "6px", padding: "6px 12px", fontSize: ".78rem", color: "#b45309", fontWeight: 700, marginBottom: "20px" }}>
                <i className="fas fa-clock" />
                KES {success.balance.toLocaleString()} balance outstanding
              </div>
            ) : (
              <div style={{ fontSize: ".75rem", color: "rgba(17,17,17,.4)", marginBottom: "20px" }}>
                Fully paid — no balance outstanding.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "300px", margin: "0 auto" }}>
              <Link
                href={`/dashboard/receptionist/booking-receipt/${success.id}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", height: "40px", background: "#111", color: "#fff", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".82rem", cursor: "pointer", textDecoration: "none" }}
              >
                <i className="fas fa-receipt" />Print Receipt
              </Link>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setSuccess(null); reset(); }}
                  style={{ flex: 1, height: "38px", background: "#E8490F", color: "#fff", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>
                  Add Another
                </button>
                <button onClick={onClose}
                  style={{ flex: 1, height: "38px", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".8rem", color: "var(--dark)", cursor: "pointer" }}>
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

            {/* Space */}
            <div>
              <label style={F_LBL}>Space *</label>
              <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} required
                style={{ ...F_INP, cursor: "pointer" }}>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Client details */}
            <div>
              <SectionDivider label="Client Details" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={F_LBL}>Full Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmed Hassan" required style={F_INP} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={F_LBL}>Phone Number *</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" required style={F_INP} />
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <SectionDivider label="Date & Time" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div style={{ gridColumn: "span 3" }}>
                  <label style={F_LBL}>Booking Date *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={todayStr} max={maxDateStr} style={F_INP} />
                </div>
                <TimePicker label="Start Time *" value={startTime} onChange={setStartTime} />
                <TimePicker label="End Time *"   value={endTime}   onChange={setEndTime}   />
                <div>
                  <label style={F_LBL}>Total Cost (KES)</label>
                  <input type="number" min="0" step="1" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="e.g. 3000" style={F_INP} />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div>
              <SectionDivider label="Payment" />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={F_LBL}>Amount Paid (KES) *</label>
                  <input type="number" min="1" step="1" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={totalCost > 0 ? `Max KES ${totalCost.toLocaleString()}` : "e.g. 3000"} required style={F_INP} />
                </div>

                {/* Live balance indicator */}
                {paid > 0 && totalCost > 0 && (
                  <div style={{ background: balanceBg, border: `1px solid ${balanceBorder}`, borderRadius: "6px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: ".75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: balanceColor, fontWeight: 700 }}>
                      <i className={`fas ${balance <= 0 ? "fa-check-circle" : "fa-clock"}`} />
                      {balance <= 0 ? "Fully paid" : `KES ${balance.toLocaleString()} balance outstanding`}
                    </div>
                    <span style={{ color: balanceColor, fontWeight: 800 }}>
                      {balance <= 0 ? `KES ${paid.toLocaleString()} paid` : `${Math.round((paid / totalCost) * 100)}% paid`}
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
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Any additional notes…"
                style={{ ...F_INP, height: "auto", padding: "6px 10px", resize: "vertical", fontSize: ".75rem" }} />
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", height: "40px", background: loading ? "rgba(232,73,15,.5)" : "#E8490F", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: ".85rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              {loading
                ? <><i className="fas fa-spinner fa-spin" />Saving…</>
                : <><i className="fas fa-calendar-check" />Save Booking{paid > 0 ? ` · KES ${paid.toLocaleString()} paid` : ""}{balance > 0 ? ` · KES ${balance.toLocaleString()} balance` : ""}</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── SettleModal ──────────────────────────────────────────────────────────────

function SettleModal({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: () => void }) {
  const outstanding  = booking.estimated_cost != null ? Math.max(0, booking.estimated_cost - booking.total_paid) : 0;
  const [amount,  setAmount]  = useState(String(outstanding));
  const [method,  setMethod]  = useState<PayMethod>("cash");
  const [ref,     setRef]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const F_INP_S: React.CSSProperties = {
    width: "100%", height: "34px", background: "#fff",
    border: "1px solid rgba(17,17,17,.12)", borderRadius: "6px",
    padding: "0 10px", color: "var(--dark)", fontSize: ".8rem",
    outline: "none", boxSizing: "border-box",
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:            "record_payment",
          amount_paid:       amt,
          payment_method:    method,
          payment_reference: ref.trim() || null,
          visitor_name:      booking.visitor_name,
          visitor_phone:     booking.visitor_phone,
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
      <div style={{ maxWidth: "380px", width: "100%", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,.15)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(17,17,17,.06)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".92rem", color: "var(--dark)" }}>Settle Payment</div>
            <div style={{ fontSize: ".68rem", color: "rgba(17,17,17,.35)", marginTop: "1px" }}>Record outstanding balance for {booking.visitor_name}</div>
          </div>
          <button onClick={onClose} style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "5px", cursor: "pointer", color: "rgba(17,17,17,.4)", fontSize: ".75rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>
        <form onSubmit={submit} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "rgba(180,83,9,.07)", border: "1px solid rgba(180,83,9,.2)", borderRadius: "7px", padding: "9px 12px", fontSize: ".82rem", color: "#b45309", fontWeight: 700 }}>
            Outstanding: KES {outstanding.toLocaleString()}
          </div>
          {error && (
            <div style={{ background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.15)", borderRadius: "6px", padding: "8px 12px", color: "#dc2626", fontSize: ".75rem" }}>{error}</div>
          )}
          <div>
            <label style={F_LBL}>Amount (KES) *</label>
            <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 3000" required style={F_INP_S} />
          </div>
          <div>
            <label style={F_LBL}>Payment Method *</label>
            <MethodToggle value={method} onChange={setMethod} />
          </div>
          {(method === "mpesa" || method === "bank_transfer") && (
            <div>
              <label style={F_LBL}>Reference</label>
              <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. QA12BCD3E4" style={F_INP_S} />
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, height: "40px", background: loading ? "rgba(232,73,15,.5)" : "#E8490F", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: ".85rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              {loading ? <><i className="fas fa-spinner fa-spin" />Saving…</> : <><i className="fas fa-check" />Record Payment</>}
            </button>
            <button type="button" onClick={onClose}
              style={{ flex: 1, height: "40px", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: ".8rem", color: "var(--dark)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Booking FlagModal ────────────────────────────────────────────────────────

function BookingFlagModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
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
      const res = await fetch("/api/corrections", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_type:  "booking",
          record_id:    booking.id,
          record_label: `BKG-${booking.id.slice(0, 8).toUpperCase()} · ${booking.visitor_name}`,
          note:         message.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit flag");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div style={{ maxWidth: "420px", width: "100%", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,.15)", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#dc2626", display: "flex", alignItems: "center", gap: "8px", fontSize: ".92rem" }}>
            <i className="fas fa-flag" />Flag Booking
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(17,17,17,.4)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        {sent ? (
          <div style={{ background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "10px", padding: "18px", textAlign: "center" }}>
            <i className="fas fa-check-circle" style={{ color: "#dc2626", fontSize: "1.4rem", marginBottom: "10px", display: "block" }} />
            <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: "4px" }}>Flag sent to Owner</div>
            <div style={{ fontSize: ".78rem", color: "rgba(17,17,17,.4)" }}>The owner will review and make corrections.</div>
            <button onClick={onClose} style={{ marginTop: "14px", width: "100%", height: "38px", background: "rgba(17,17,17,.05)", border: "1px solid rgba(17,17,17,.12)", borderRadius: "8px", fontWeight: 700, fontSize: ".8rem", color: "var(--dark)", cursor: "pointer" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
              <div style={{ fontWeight: 700, color: "var(--dark)" }}>{booking.visitor_name}</div>
              <div style={{ color: "rgba(17,17,17,.4)", fontSize: ".75rem" }}>BKG-{booking.id.slice(0, 8).toUpperCase()}</div>
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {error && <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "9px 12px", color: "#dc2626", fontSize: ".8rem" }}>{error}</div>}
              <div>
                <label style={lbl}>Correction needed *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                  placeholder="Describe what needs to be corrected…"
                  required style={{ ...inp, resize: "vertical" } as React.CSSProperties} autoFocus />
                <div style={{ fontSize: ".68rem", color: "rgba(17,17,17,.4)", marginTop: "4px" }}>This will be sent to the owner for review.</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: ".85rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                  {loading ? <><i className="fas fa-spinner fa-spin" />Sending…</> : <><i className="fas fa-flag" />Send Flag</>}
                </button>
                <button type="button" onClick={onClose}
                  style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "1px solid rgba(17,17,17,.12)", background: "transparent", fontWeight: 700, fontSize: ".8rem", color: "var(--dark)", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Bookings Table ───────────────────────────────────────────────────────────

function BookingsTable({ bookings, onSettle, onFlag }: { bookings: Booking[]; onSettle: (b: Booking) => void; onFlag: (b: Booking) => void }) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (bookings.length === 0) return null;

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(17,17,17,.08)" }}>
              <th style={TH}>Client</th>
              <th style={TH}>Space</th>
              <th style={TH}>Date</th>
              <th style={TH}>Time</th>
              <th style={TH}>Cost</th>
              <th style={TH}>Paid</th>
              <th style={TH}>Balance</th>
              <th style={TH}>Method</th>
              <th style={TH}>Booked On</th>
              <th style={TH}></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const isHovered   = hoveredRow === b.id;
              const balance     = b.estimated_cost != null ? b.estimated_cost - b.total_paid : null;
              const endDisplay  = b.end_time ? fmt12(b.end_time) : null;
              const hasOutstanding = balance != null && balance > 0;

              return (
                <tr key={b.id}
                  onMouseEnter={() => setHoveredRow(b.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: "1px solid rgba(17,17,17,.045)", background: hasOutstanding ? "rgba(180,83,9,.02)" : isHovered ? "rgba(17,17,17,.018)" : "transparent", transition: "background .08s" }}>

                  {/* Client */}
                  <td style={TD}>
                    <div style={{ fontWeight: 600, color: "#111827", fontSize: ".8rem", whiteSpace: "nowrap" }}>{b.visitor_name}</div>
                    <div style={{ fontSize: ".68rem", color: "#6B7280", marginTop: "1px" }}>{b.visitor_phone}</div>
                  </td>

                  {/* Space */}
                  <td style={TD_M}>
                    {b.spaces ? (
                      <span style={{ fontSize: ".68rem", fontWeight: 600, color: "var(--teal2)", background: "rgba(193,68,14,.07)", border: "1px solid rgba(193,68,14,.18)", borderRadius: "5px", padding: "2px 8px", whiteSpace: "nowrap" }}>
                        {b.spaces.name}
                      </span>
                    ) : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                  </td>

                  {/* Date */}
                  <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                    {fmtDate(b.booking_date + "T12:00:00")}
                  </td>

                  {/* Time */}
                  <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                    {b.start_time ? fmt12(b.start_time) : "—"}
                    {endDisplay ? <> – {endDisplay}</> : null}
                  </td>

                  {/* Cost */}
                  <td style={{ ...TD, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {b.estimated_cost != null
                      ? `KES ${b.estimated_cost.toLocaleString()}`
                      : <span style={{ color: "rgba(17,17,17,.2)", fontWeight: 400, fontSize: ".72rem" }}>—</span>}
                  </td>

                  {/* Paid */}
                  <td style={{ ...TD, fontWeight: 700, whiteSpace: "nowrap" }}>
                    KES {b.total_paid.toLocaleString()}
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
                    {b.method ? (
                      <span style={{ display: "inline-flex", alignItems: "center", fontSize: ".68rem", fontWeight: 600, background: "rgba(17,17,17,.05)", color: "#374151", padding: "2px 7px", borderRadius: "100px", whiteSpace: "nowrap" }}>
                        {METHOD_LABELS[b.method] ?? b.method}
                      </span>
                    ) : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                  </td>

                  {/* Booked On */}
                  <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(b.created_at)}</td>

                  {/* Actions */}
                  <td style={{ ...TD, whiteSpace: "nowrap", paddingRight: "10px" }}>
                    <div style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                      {/* Receipt */}
                      <Link
                        href={`/dashboard/receptionist/booking-receipt/${b.id}`}
                        target="_blank" rel="noopener noreferrer"
                        title="View Receipt"
                        style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6", border: "none", borderRadius: "6px", cursor: "pointer", color: "#6B7280", fontSize: ".65rem", textDecoration: "none" }}
                      >
                        <i className="fas fa-receipt" />
                      </Link>
                      {/* Settle */}
                      {hasOutstanding && (
                        <button
                          onClick={() => onSettle(b)}
                          title="Settle Payment"
                          style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(180,83,9,.09)", border: "none", borderRadius: "6px", cursor: "pointer", color: "#b45309", fontSize: ".65rem" }}
                        >
                          <i className="fas fa-dollar-sign" />
                        </button>
                      )}
                      {/* Flag */}
                      <button
                        onClick={() => onFlag(b)}
                        title="Flag for correction"
                        style={{ width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6", border: "none", borderRadius: "6px", cursor: "pointer", color: "#EF4444", fontSize: ".65rem" }}
                      >
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

export default function BookingsManageClient({
  spaces,
}: {
  spaces: { id: string; name: string; slug: string }[];
}) {
  const [bookings,     setBookings]     = useState<Booking[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [showForm,     setShowForm]     = useState(false);
  const [settleTarget, setSettleTarget] = useState<Booking | null>(null);
  const [flagTarget,   setFlagTarget]   = useState<Booking | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/receptionist/bookings?mine=true")
      .then((r) => r.json())
      .then((j) => {
        setBookings(j.bookings ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const q          = search.trim().toLowerCase();
  const displayed  = bookings.filter((b) =>
    !q || b.visitor_name.toLowerCase().includes(q) || b.visitor_phone.includes(q)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Bookings</h2>
          <p>Space bookings you have recorded</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "7px", height: "36px", padding: "0 16px", background: "#E8490F", color: "#fff", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}
        >
          <i className="fas fa-plus" style={{ fontSize: ".72rem" }} />New Booking
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", maxWidth: "340px" }}>
        <i className="fas fa-search" style={{ position: "absolute", left: "10px", color: "rgba(17,17,17,.28)", fontSize: ".68rem", pointerEvents: "none" }} />
        <input
          type="text" placeholder="Search name or phone…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", height: "32px", paddingLeft: "30px", paddingRight: search ? "30px" : "10px", background: "#fff", border: "1px solid rgba(17,17,17,.12)", borderRadius: "7px", fontSize: ".78rem", color: "var(--dark)", outline: "none", boxSizing: "border-box" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: "6px", background: "none", border: "none", color: "rgba(17,17,17,.3)", cursor: "pointer", fontSize: ".65rem", padding: "4px" }}>
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      {/* Table / States */}
      {loading ? (
        <div style={{ padding: "48px 0", color: "rgba(17,17,17,.4)", fontSize: ".82rem", textAlign: "center" }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading bookings…
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "48px 20px", textAlign: "center", color: "rgba(17,17,17,.35)", fontSize: ".82rem" }}>
          {search
            ? `No results for "${search}"`
            : "No bookings recorded yet. Click New Booking to add one."
          }
        </div>
      ) : (
        <BookingsTable bookings={displayed} onSettle={setSettleTarget} onFlag={setFlagTarget} />
      )}

      {showForm && (
        <BookingModal
          spaces={spaces}
          onClose={() => setShowForm(false)}
          onBooked={() => { load(); }}
        />
      )}
      {settleTarget && (
        <SettleModal
          booking={settleTarget}
          onClose={() => setSettleTarget(null)}
          onDone={() => { load(); }}
        />
      )}
      {flagTarget && (
        <BookingFlagModal
          booking={flagTarget}
          onClose={() => setFlagTarget(null)}
        />
      )}
    </div>
  );
}
