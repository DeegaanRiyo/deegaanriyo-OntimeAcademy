"use client";

import { useState, useCallback } from "react";
import BookSpaceForm from "@/components/dashboard/BookSpaceForm";

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  setup: string | null;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  hours: number;
  status: string;
  notes: string | null;
  booked_by: string | null;
  estimated_cost: number | null;
  total_paid: number;
  created_at: string;
  spaces: { id: string; name: string; slug: string } | null;
};

// A booking enriched with computed stage info
type RichBooking = Booking & {
  // Which visual stage this booking belongs to (may differ from DB status)
  stage: ColKey;
  // True if the booking was auto-promoted by time (DB status not yet updated)
  autoPromoted: boolean;
  // Flags for the concluded column
  concludedReason?: "completed" | "cancelled" | "rejected" | "no_show" | "overrun";
};

type ModalState = {
  bookingId:     string;
  visitorName:   string;
  visitorPhone:  string;
  estimatedCost: number | null;
  totalPaid:     number;
  spaceName:     string | null;
  bookingDate:   string;
  startTime:     string;
  endTime:       string;
};

type ColKey = "pending" | "confirmed" | "today" | "active" | "concluded";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function computeEnd(startTime: string, hours: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total  = h * 60 + m + hours * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function fmtDate(iso: string, today: string): string {
  if (iso === today) return "Today";
  const tom = new Date(today + "T00:00:00");
  tom.setDate(tom.getDate() + 1);
  if (iso === tom.toISOString().split("T")[0]) return "Tomorrow";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
}

// ─── Enrich bookings with computed stage ──────────────────────────────────────

function enrich(bookings: Booking[], today: string, nowTime: string): RichBooking[] {
  return bookings.map((b): RichBooking => {
    const endTime = b.end_time ?? computeEnd(b.start_time, b.hours ?? 1);

    // ── Already a terminal DB status ──────────────────────────────
    if (b.status === "completed")  return { ...b, stage: "concluded", autoPromoted: false, concludedReason: "completed" };
    if (b.status === "cancelled")  return { ...b, stage: "concluded", autoPromoted: false, concludedReason: "cancelled" };
    if (b.status === "rejected")   return { ...b, stage: "concluded", autoPromoted: false, concludedReason: "rejected"  };

    // ── Active session ────────────────────────────────────────────
    if (b.status === "active") {
      // Time already ran out → auto-conclude (overrun)
      if (b.booking_date < today || (b.booking_date === today && endTime <= nowTime)) {
        return { ...b, stage: "concluded", autoPromoted: true, concludedReason: "overrun" };
      }
      return { ...b, stage: "active", autoPromoted: false };
    }

    // ── Confirmed booking ─────────────────────────────────────────
    if (b.status === "confirmed") {
      // Past date — never showed up
      if (b.booking_date < today) {
        return { ...b, stage: "concluded", autoPromoted: true, concludedReason: "no_show" };
      }
      // Today's booking
      if (b.booking_date === today) {
        // Session time has fully passed → no-show / skipped check-in
        if (endTime <= nowTime) {
          return { ...b, stage: "concluded", autoPromoted: true, concludedReason: "no_show" };
        }
        // Session has started but not ended → auto in-progress
        if (b.start_time <= nowTime) {
          return { ...b, stage: "active", autoPromoted: true };
        }
        // Upcoming today
        return { ...b, stage: "today", autoPromoted: false };
      }
      // Future date
      return { ...b, stage: "confirmed", autoPromoted: false };
    }

    // ── Pending ───────────────────────────────────────────────────
    return { ...b, stage: "pending", autoPromoted: false };
  });
}

// ─── Payment Fields ───────────────────────────────────────────────────────────

function PaymentFields({
  amount, setAmount, method, setMethod, reference, setReference, estimatedCost, totalPaid,
}: {
  amount: string; setAmount: (v: string) => void;
  method: "cash" | "bank_transfer"; setMethod: (v: "cash" | "bank_transfer") => void;
  reference: string; setReference: (v: string) => void;
  estimatedCost: number | null; totalPaid: number;
}) {
  const outstanding = estimatedCost !== null ? estimatedCost - totalPaid : null;
  return (
    <>
      {estimatedCost !== null && (
        <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "10px 14px", fontSize: ".8rem", display: "flex", flexDirection: "column", gap: "3px", border: "1px solid rgba(17,17,17,.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--muted)" }}>Estimated</span>
            <span style={{ color: "var(--dark)", fontWeight: 600 }}>KES {estimatedCost.toLocaleString()}</span>
          </div>
          {totalPaid > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Already paid</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>KES {totalPaid.toLocaleString()}</span>
            </div>
          )}
          {outstanding !== null && outstanding > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(17,17,17,.1)", paddingTop: "4px", marginTop: "2px" }}>
              <span style={{ color: "#b45309", fontWeight: 700 }}>Outstanding</span>
              <span style={{ color: "#b45309", fontWeight: 700 }}>KES {outstanding.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
      <div>
        <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
          Amount Paid (KES) <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <input type="number" className="form-input" min="1"
          placeholder={outstanding != null && outstanding > 0 ? `e.g. ${outstanding}` : "e.g. 2500"}
          value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div>
        <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
          Payment Method <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["cash", "bank_transfer"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)} style={{
              flex: 1, padding: "9px 8px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: ".78rem",
              background: method === m ? "rgba(193,68,14,.12)" : "rgba(17,17,17,.04)",
              border:     method === m ? "1px solid rgba(193,68,14,.4)" : "1px solid rgba(17,17,17,.12)",
              color:      method === m ? "var(--teal2)" : "var(--muted)",
            }}>
              <i className={`fas ${m === "cash" ? "fa-money-bill" : "fa-university"}`} style={{ marginRight: "6px" }} />
              {m === "cash" ? "Cash" : "Bank Transfer"}
            </button>
          ))}
        </div>
      </div>
      {method === "bank_transfer" && (
        <div>
          <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
            Transfer Reference <span style={{ opacity: .5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <input type="text" className="form-input" placeholder="e.g. TXN12345" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      )}
    </>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function buildWhatsAppConfirmation(
  phone: string,
  name: string,
  spaceName: string | null,
  bookingDate: string,
  startTime: string,
  endTime: string,
  amountPaid: number,
  estimatedCost: number | null,
): string {
  const wa = phone.replace(/\D/g, "").replace(/^0/, "254");
  const fmtDate = new Date(bookingDate + "T12:00:00").toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const outstanding = estimatedCost !== null ? estimatedCost - amountPaid : null;

  const lines = [
    `Hi ${name} 👋`,
    ``,
    `Your booking at *Ontime Academy & Co-working Space* has been *confirmed!* ✅`,
    ``,
    ...(spaceName ? [`🏢 *Space:* ${spaceName}`] : []),
    `📅 *Date:* ${fmtDate}`,
    `🕐 *Time:* ${startTime} – ${endTime}`,
    `💰 *Amount Paid:* KES ${amountPaid.toLocaleString()}`,
    ...(outstanding !== null && outstanding > 0
      ? [`⚠️ *Balance Due:* KES ${outstanding.toLocaleString()} (payable on arrival)`]
      : []),
    ``,
    `Please arrive a few minutes early. See you soon! 🙏`,
  ];
  return `https://wa.me/${wa}?text=${encodeURIComponent(lines.join("\n"))}`;
}

type ConfirmedInfo = {
  amountPaid:    number;
  spaceName:     string | null;
  bookingDate:   string;
  startTime:     string;
  endTime:       string;
};

function PaymentModal({ booking, mode, onClose, onDone }: {
  booking: ModalState;
  mode: "confirm" | "record" | "complete";
  onClose: () => void;
  onDone: (id: string, newStatus?: string) => void;
}) {
  const [amount,        setAmount]        = useState(String(booking.estimatedCost != null ? Math.max(0, booking.estimatedCost - booking.totalPaid) : ""));
  const [method,        setMethod]        = useState<"cash" | "bank_transfer">("cash");
  const [reference,     setReference]     = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [confirmedInfo, setConfirmedInfo] = useState<ConfirmedInfo | null>(null);

  const title = mode === "confirm" ? "Confirm & Record Payment"
              : mode === "complete" ? "Pay & Complete Session"
              : "Record Payment";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError("Enter a valid payment amount."); return; }
    setError(null); setLoading(true);

    const payload: Record<string, unknown> = {
      amount_paid: amt, payment_method: method,
      payment_reference: reference.trim() || null,
      visitor_name: booking.visitorName, visitor_phone: booking.visitorPhone,
    };
    if (mode === "confirm") payload.status = "confirmed";
    else payload.action = "record_payment";

    const res = await fetch(`/api/receptionist/bookings/${booking.bookingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) { setLoading(false); setError(json.error ?? "Failed"); return; }

    if (mode === "complete") {
      const res2 = await fetch(`/api/receptionist/bookings/${booking.bookingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res2.ok) {
        const j2 = await res2.json();
        setLoading(false); setError(j2.error ?? "Payment saved but could not complete session."); return;
      }
    }

    setLoading(false);
    onDone(booking.bookingId, mode === "confirm" ? "confirmed" : mode === "complete" ? "completed" : undefined);

    // After confirming a pending booking, show WhatsApp step instead of closing immediately
    if (mode === "confirm") {
      setConfirmedInfo({
        amountPaid:  amt,
        spaceName:   booking.spaceName ?? null,
        bookingDate: booking.bookingDate,
        startTime:   booking.startTime,
        endTime:     booking.endTime,
      });
    } else {
      onClose();
    }
  }

  // ── WhatsApp confirmation screen ──────────────────────────────────────────
  if (confirmedInfo) {
    const waURL = buildWhatsAppConfirmation(
      booking.visitorPhone,
      booking.visitorName,
      confirmedInfo.spaceName,
      confirmedInfo.bookingDate,
      confirmedInfo.startTime,
      confirmedInfo.endTime,
      confirmedInfo.amountPaid,
      booking.estimatedCost,
    );
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
        <div className="card" style={{ maxWidth: "440px", width: "100%", padding: "28px", gap: 0, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: "2.4rem", color: "#16a34a", marginBottom: "12px" }}>
            <i className="fas fa-check-circle" />
          </div>
          <h3 style={{ margin: "0 0 6px", color: "var(--dark)" }}>Booking Confirmed!</h3>
          <p style={{ color: "var(--muted)", fontSize: ".83rem", margin: "0 0 20px" }}>
            Payment of <strong>KES {confirmedInfo.amountPaid.toLocaleString()}</strong> recorded for{" "}
            <strong>{booking.visitorName}</strong>.
          </p>
          <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: "0 0 20px" }}>
            Send a WhatsApp confirmation to the client now?
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={waURL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              style={{
                flex: 2, display: "inline-flex", alignItems: "center", justifyContent: "center",
                gap: "8px", padding: "11px 16px", borderRadius: "9px", textDecoration: "none",
                background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: ".85rem",
                border: "none", cursor: "pointer",
              }}
            >
              <i className="fab fa-whatsapp" style={{ fontSize: "1.1rem" }} />
              Send WhatsApp
            </a>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "11px 16px", borderRadius: "9px", fontWeight: 600,
                fontSize: ".85rem", background: "transparent", border: "1px solid rgba(17,17,17,.15)",
                color: "var(--muted)", cursor: "pointer",
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "440px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>
            <i className="fas fa-money-bill-wave" style={{ color: "var(--teal2)", marginRight: "8px" }} />{title}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
          <div style={{ fontWeight: 700, color: "var(--dark)" }}>{booking.visitorName}</div>
          <div style={{ color: "var(--muted)" }}>{booking.visitorPhone}</div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <PaymentFields amount={amount} setAmount={setAmount} method={method} setMethod={setMethod}
            reference={reference} setReference={setReference}
            estimatedCost={booking.estimatedCost} totalPaid={booking.totalPaid} />
          {error && <p style={{ color: "var(--red)", fontSize: ".72rem", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? <><span className="spinner" /> Processing…</> : <><i className="fas fa-check" /> {title}</>}
            </button>
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Action button style ──────────────────────────────────────────────────────

function actionBtn(color: "teal" | "green" | "gold" | "blue" | "red" | "gray", disabled: boolean): React.CSSProperties {
  const map = {
    teal: { bg: "rgba(193,68,14,.09)", border: "rgba(193,68,14,.3)", text: "var(--teal2)" },
    green:{ bg: "rgba(22,163,74,.09)", border: "rgba(22,163,74,.3)", text: "#16a34a"      },
    gold: { bg: "rgba(180,131,9,.09)", border: "rgba(180,131,9,.3)", text: "#b45309"      },
    blue: { bg: "rgba(37,99,235,.09)", border: "rgba(37,99,235,.3)", text: "#2563eb"      },
    red:  { bg: "rgba(220,38,38,.09)", border: "rgba(220,38,38,.3)", text: "#dc2626"      },
    gray: { bg: "rgba(107,114,128,.09)",border:"rgba(107,114,128,.3)",text:"#6b7280"      },
  }[color];
  return {
    display: "inline-flex", alignItems: "center", gap: "4px",
    padding: "4px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    background: map.bg, border: `1px solid ${map.border}`, color: map.text,
    opacity: disabled ? .5 : 1, whiteSpace: "nowrap",
  };
}

// ─── Booking Row ──────────────────────────────────────────────────────────────

function BookingRow({ b, today, isUpdating, onConfirm, onReject, onRecord, onCheckIn, onComplete, onEndSession, onCancel, onDelete }: {
  b: RichBooking; today: string; isUpdating: boolean;
  onConfirm: () => void; onReject: () => void; onRecord: () => void;
  onCheckIn: () => void; onComplete: () => void; onEndSession: () => void;
  onCancel: () => void; onDelete: () => void;
}) {
  const endTime     = b.end_time ?? computeEnd(b.start_time, b.hours ?? 1);
  const outstanding = b.estimated_cost !== null ? b.estimated_cost - b.total_paid : null;
  const isAutoInProgress = b.stage === "active" && b.autoPromoted;

  // Concluded with no payment at all and an expected cost
  const noPaymentFlag =
    b.stage === "concluded" &&
    b.total_paid === 0 &&
    (b.estimated_cost === null || b.estimated_cost > 0) &&
    !["cancelled", "rejected"].includes(b.concludedReason ?? "");

  // Concluded with unpaid balance (partial payment recorded)
  const unpaidFlag =
    b.stage === "concluded" &&
    outstanding !== null && outstanding > 0 &&
    b.total_paid > 0;

  // Row highlight for flagged concluded rows
  const rowBg = noPaymentFlag
    ? "rgba(220,38,38,.03)"
    : unpaidFlag
    ? "rgba(180,131,9,.03)"
    : undefined;

  return (
    <tr style={{ borderBottom: "1px solid rgba(17,17,17,.06)", background: rowBg }}>

      {/* Client */}
      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          {isAutoInProgress && (
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#16a34a", flexShrink: 0, boxShadow: "0 0 0 2px rgba(22,163,74,.2)" }} />
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: 700, fontSize: ".85rem", color: "var(--dark)" }}>{b.visitor_name}</span>
              {b.autoPromoted && b.stage !== "concluded" && (
                <span style={{ fontSize: ".6rem", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", background: "rgba(22,163,74,.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,.25)" }}>
                  AUTO
                </span>
              )}
            </div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "1px" }}>{b.visitor_phone}</div>
          </div>
        </div>
      </td>

      {/* Space */}
      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
        {b.spaces ? (
          <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--teal2)", background: "rgba(193,68,14,.07)", border: "1px solid rgba(193,68,14,.18)", borderRadius: "5px", padding: "3px 9px", whiteSpace: "nowrap" }}>
            {b.spaces.name}
          </span>
        ) : <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>—</span>}
      </td>

      {/* Date */}
      <td style={{ padding: "10px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
        <div style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--dark)" }}>{fmtDate(b.booking_date, today)}</div>
        <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: "1px" }}>{fmt12(b.start_time)} – {fmt12(endTime)}</div>
      </td>

      {/* Hours */}
      <td style={{ padding: "10px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
        <span style={{ fontSize: ".8rem", color: "var(--dark)" }}>{b.hours} hr{b.hours !== 1 ? "s" : ""}</span>
      </td>

      {/* Estimated */}
      <td style={{ padding: "10px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
        <span style={{ fontSize: ".8rem", color: "var(--dark)", fontWeight: 600 }}>
          {b.estimated_cost !== null ? `KES ${b.estimated_cost.toLocaleString()}` : "—"}
        </span>
      </td>

      {/* Payment / Flags */}
      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
        {noPaymentFlag ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: ".72rem", fontWeight: 700, color: "#dc2626", background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "5px", padding: "3px 8px", whiteSpace: "nowrap" }}>
            <i className="fas fa-triangle-exclamation" />
            No payment recorded
          </span>
        ) : unpaidFlag ? (
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: ".72rem", fontWeight: 700, color: "#b45309", background: "rgba(180,131,9,.08)", border: "1px solid rgba(180,131,9,.25)", borderRadius: "5px", padding: "3px 8px", whiteSpace: "nowrap" }}>
              <i className="fas fa-circle-exclamation" />
              KES {outstanding!.toLocaleString()} unpaid
            </span>
            <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "3px" }}>Paid: KES {b.total_paid.toLocaleString()}</div>
          </div>
        ) : outstanding !== null && outstanding > 0 ? (
          <div>
            <div style={{ fontSize: ".72rem", color: "#b45309", fontWeight: 700 }}>KES {outstanding.toLocaleString()} due</div>
            {b.total_paid > 0 && <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Paid: KES {b.total_paid.toLocaleString()}</div>}
          </div>
        ) : b.total_paid > 0 ? (
          <span style={{ fontSize: ".72rem", fontWeight: 600, color: "#16a34a" }}>
            <i className="fas fa-check-circle" style={{ marginRight: "4px" }} />KES {b.total_paid.toLocaleString()}
          </span>
        ) : (
          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>—</span>
        )}
      </td>

      {/* Stage / Reason (Concluded column only) */}
      {b.stage === "concluded" && (
        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
          {b.concludedReason === "no_show" && (
            <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#6b7280", background: "rgba(107,114,128,.1)", border: "1px solid rgba(107,114,128,.25)", borderRadius: "5px", padding: "2px 7px", whiteSpace: "nowrap" }}>
              <i className="fas fa-user-slash" style={{ marginRight: "4px" }} />No Show
            </span>
          )}
          {b.concludedReason === "overrun" && (
            <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#b45309", background: "rgba(180,131,9,.1)", border: "1px solid rgba(180,131,9,.25)", borderRadius: "5px", padding: "2px 7px", whiteSpace: "nowrap" }}>
              <i className="fas fa-clock" style={{ marginRight: "4px" }} />Time Ended
            </span>
          )}
          {b.concludedReason === "completed" && (
            <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#16a34a", background: "rgba(22,163,74,.1)", border: "1px solid rgba(22,163,74,.25)", borderRadius: "5px", padding: "2px 7px", whiteSpace: "nowrap" }}>
              <i className="fas fa-check-circle" style={{ marginRight: "4px" }} />Completed
            </span>
          )}
          {b.concludedReason === "cancelled" && (
            <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#6b7280", background: "rgba(107,114,128,.1)", border: "1px solid rgba(107,114,128,.25)", borderRadius: "5px", padding: "2px 7px", whiteSpace: "nowrap" }}>
              <i className="fas fa-ban" style={{ marginRight: "4px" }} />Cancelled
            </span>
          )}
          {b.concludedReason === "rejected" && (
            <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#dc2626", background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "5px", padding: "2px 7px", whiteSpace: "nowrap" }}>
              <i className="fas fa-times-circle" style={{ marginRight: "4px" }} />Rejected
            </span>
          )}
        </td>
      )}

      {/* Actions */}
      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
        <div style={{ display: "flex", gap: "5px", flexWrap: "nowrap" }}>
          {b.status === "pending" && (<>
            <button onClick={onConfirm} disabled={isUpdating} style={actionBtn("teal", isUpdating)}>
              <i className="fas fa-check" /> Confirm & Pay
            </button>
            <button onClick={onReject} disabled={isUpdating} style={actionBtn("red", isUpdating)}>
              <i className="fas fa-times" /> Reject
            </button>
          </>)}

          {/* Record payment — for active or auto-promoted in-progress with balance */}
          {(b.status === "confirmed" || b.status === "active") && outstanding !== null && outstanding > 0 && (
            <button onClick={onRecord} disabled={isUpdating} style={actionBtn("gold", isUpdating)}>
              <i className="fas fa-plus-circle" /> Record Payment
            </button>
          )}

          {/* Check in — confirmed and not yet started (today or future) */}
          {b.status === "confirmed" && b.stage !== "concluded" && (
            <button onClick={onCheckIn} disabled={isUpdating} style={actionBtn("green", isUpdating)}>
              <i className={isUpdating ? "fas fa-spinner fa-spin" : "fas fa-play"} /> Check In
            </button>
          )}

          {/* End session — active */}
          {b.status === "active" && b.stage !== "concluded" && (
            outstanding !== null && outstanding > 0 ? (
              <button onClick={onComplete} disabled={isUpdating} style={actionBtn("gold", isUpdating)}>
                <i className="fas fa-money-bill" /> Pay & End
              </button>
            ) : (
              <button onClick={onEndSession} disabled={isUpdating} style={actionBtn("blue", isUpdating)}>
                <i className={isUpdating ? "fas fa-spinner fa-spin" : "fas fa-flag-checkered"} /> End Session
              </button>
            )
          )}

          {/* Auto-overrun: still needs to be closed in DB */}
          {b.concludedReason === "overrun" && b.status === "active" && (
            outstanding !== null && outstanding > 0 ? (
              <button onClick={onComplete} disabled={isUpdating} style={actionBtn("gold", isUpdating)}>
                <i className="fas fa-money-bill" /> Pay & Close
              </button>
            ) : (
              <button onClick={onEndSession} disabled={isUpdating} style={actionBtn("gray", isUpdating)}>
                <i className={isUpdating ? "fas fa-spinner fa-spin" : "fas fa-flag-checkered"} /> Close
              </button>
            )
          )}

          {/* No-show: still needs to be cancelled/closed in DB */}
          {b.concludedReason === "no_show" && b.status === "confirmed" && (
            <button onClick={onCancel} disabled={isUpdating} style={actionBtn("gray", isUpdating)}>
              <i className={isUpdating ? "fas fa-spinner fa-spin" : "fas fa-ban"} /> Mark Cancelled
            </button>
          )}

          {/* Cancel — live bookings not yet concluded */}
          {["pending", "confirmed"].includes(b.status) && b.stage !== "concluded" && (
            <button onClick={onCancel} disabled={isUpdating} style={actionBtn("red", isUpdating)}>
              <i className={isUpdating ? "fas fa-spinner fa-spin" : "fas fa-ban"} /> Cancel
            </button>
          )}

          {/* Delete — terminal DB statuses */}
          {["completed", "cancelled", "rejected"].includes(b.status) && (
            <button onClick={onDelete} disabled={isUpdating} style={actionBtn("red", isUpdating)}>
              <i className={isUpdating ? "fas fa-spinner fa-spin" : "fas fa-trash"} /> Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  bookings: Booking[];
  allSpaces: { id: string; name: string; slug: string }[];
  today: string;
  nowTime: string;
}

export default function BookingsManageClient({ bookings: initial, allSpaces, today, nowTime }: Props) {
  const [bookings,  setBookings]  = useState(initial);
  const [activeTab, setActiveTab] = useState<ColKey>("pending");
  const [showForm,  setShowForm]  = useState(false);
  const [updating,  setUpdating]  = useState<string | null>(null);
  const [payModal,  setPayModal]  = useState<{ booking: ModalState; mode: "confirm" | "record" | "complete" } | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/receptionist/bookings");
    if (!res.ok) return;
    const json = await res.json();
    setBookings(
      (json.bookings ?? []).map((b: any) => ({
        ...b,
        spaces:     Array.isArray(b.spaces) ? (b.spaces[0] ?? null) : b.spaces,
        total_paid: (b.walk_in_payments ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
      }))
    );
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const res = await fetch(`/api/receptionist/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    setUpdating(null);
  }

  async function deleteBooking(id: string) {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    setUpdating(id);
    const res = await fetch(`/api/receptionist/bookings/${id}`, { method: "DELETE" });
    if (res.ok) setBookings((prev) => prev.filter((b) => b.id !== id));
    setUpdating(null);
  }

  function openPayModal(b: RichBooking, mode: "confirm" | "record" | "complete") {
    const endTime = b.end_time ?? computeEnd(b.start_time, b.hours ?? 1);
    setPayModal({
      mode,
      booking: {
        bookingId:     b.id,
        visitorName:   b.visitor_name,
        visitorPhone:  b.visitor_phone,
        estimatedCost: b.estimated_cost,
        totalPaid:     b.total_paid,
        spaceName:     b.spaces?.name ?? null,
        bookingDate:   b.booking_date,
        startTime:     fmt12(b.start_time),
        endTime:       fmt12(endTime),
      },
    });
  }

  function handlePayDone(id: string, newStatus?: string) {
    setBookings((prev) => prev.map((b) => b.id !== id ? b : { ...b, ...(newStatus ? { status: newStatus } : {}) }));
    refresh();
  }

  // ─── Enrich and group ────────────────────────────────────────────────────────

  const rich = enrich(bookings, today, nowTime);

  const byTime = (a: RichBooking, b: RichBooking) =>
    a.booking_date.localeCompare(b.booking_date) || a.start_time.localeCompare(b.start_time);

  const columns: { key: ColKey; title: string; color: string; icon: string; rows: RichBooking[] }[] = [
    { key: "pending",   title: "Pending",          color: "#b45309",      icon: "fa-clock",
      rows: rich.filter((b) => b.stage === "pending").sort(byTime) },
    { key: "confirmed", title: "Confirmed",         color: "#2563eb",      icon: "fa-calendar-check",
      rows: rich.filter((b) => b.stage === "confirmed").sort(byTime) },
    { key: "today",     title: "Today's Scheduled", color: "var(--teal2)", icon: "fa-calendar-day",
      rows: rich.filter((b) => b.stage === "today").sort((a, b) => a.start_time.localeCompare(b.start_time)) },
    { key: "active",    title: "In Progress",       color: "#16a34a",      icon: "fa-circle-dot",
      rows: rich.filter((b) => b.stage === "active").sort((a, b) => a.start_time.localeCompare(b.start_time)) },
    { key: "concluded", title: "Concluded",         color: "#6b7280",      icon: "fa-flag-checkered",
      rows: rich.filter((b) => b.stage === "concluded")
        .sort((a, b) => b.booking_date.localeCompare(a.booking_date) || b.start_time.localeCompare(a.start_time)) },
  ];

  const active = columns.find((c) => c.key === activeTab)!;

  // Count flagged concluded bookings for badge
  const concludedFlags = rich.filter((b) =>
    b.stage === "concluded" &&
    b.total_paid === 0 &&
    (b.estimated_cost === null || b.estimated_cost > 0) &&
    !["cancelled", "rejected"].includes(b.concludedReason ?? "")
  ).length;

  function rowActions(b: RichBooking) {
    return {
      onConfirm:    () => openPayModal(b, "confirm"),
      onReject:     () => updateStatus(b.id, "rejected"),
      onRecord:     () => openPayModal(b, "record"),
      onCheckIn:    () => updateStatus(b.id, "active"),
      onComplete:   () => openPayModal(b, "complete"),
      onEndSession: () => updateStatus(b.id, "completed"),
      onCancel:     () => updateStatus(b.id, "cancelled"),
      onDelete:     () => deleteBooking(b.id),
    };
  }

  const thStyle: React.CSSProperties = {
    padding: "8px 14px", textAlign: "left",
    fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Bookings</h2>
          <p>Space reservations — full lifecycle view</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ border: "none", cursor: "pointer" }}>
          <i className="fas fa-plus" style={{ marginRight: "7px" }} />New Booking
        </button>
      </div>

      {/* ── Status Tabs ─────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {columns.map((col) => {
          const isActive  = activeTab === col.key;
          const flagCount = col.key === "concluded" ? concludedFlags : 0;
          return (
            <button
              key={col.key}
              onClick={() => setActiveTab(col.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "9px 16px", borderRadius: "9px", cursor: "pointer",
                fontSize: ".8rem", fontWeight: 700,
                background: isActive ? col.color : "rgba(17,17,17,.04)",
                border: isActive ? `1px solid ${col.color}` : "1px solid rgba(17,17,17,.1)",
                color: isActive ? "#fff" : "var(--muted)",
                transition: "all .15s", position: "relative",
              }}
            >
              <i className={`fas ${col.icon}`} style={{ fontSize: ".75rem", opacity: isActive ? 1 : .7 }} />
              {col.title}
              <span style={{
                padding: "1px 7px", borderRadius: "8px", fontSize: ".65rem", fontWeight: 800,
                background: isActive ? "rgba(255,255,255,.25)" : "rgba(17,17,17,.08)",
                color: isActive ? "#fff" : "var(--muted)",
              }}>
                {col.rows.length}
              </span>
              {/* Red alert dot on Concluded if there are payment flags */}
              {flagCount > 0 && (
                <span style={{
                  position: "absolute", top: "-5px", right: "-5px",
                  minWidth: "18px", height: "18px", borderRadius: "9px",
                  background: "#dc2626", color: "#fff",
                  fontSize: ".6rem", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 4px", border: "2px solid #fff",
                }}>
                  {flagCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active Tab Table ─────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Table header bar */}
        <div style={{
          padding: "12px 16px",
          borderBottom: `2px solid ${active.color}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#fafafa",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <i className={`fas ${active.icon}`} style={{ color: active.color }} />
            <span style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--dark)" }}>{active.title}</span>
            <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
              {active.rows.length === 0 ? "No bookings" : `${active.rows.length} booking${active.rows.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          {activeTab === "concluded" && concludedFlags > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: ".72rem", fontWeight: 700, color: "#dc2626", background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "6px", padding: "4px 10px" }}>
              <i className="fas fa-triangle-exclamation" />
              {concludedFlags} booking{concludedFlags !== 1 ? "s" : ""} with no payment recorded
            </span>
          )}
        </div>

        {active.rows.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className={`fas ${active.icon}`} style={{ fontSize: "1.8rem", opacity: .2, display: "block", marginBottom: "12px" }} />
            No {active.title.toLowerCase()} bookings
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(17,17,17,.03)", borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Space</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Hours</th>
                  <th style={thStyle}>Estimated</th>
                  <th style={thStyle}>Payment</th>
                  {activeTab === "concluded" && <th style={thStyle}>Reason</th>}
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {active.rows.map((b) => (
                  <BookingRow
                    key={b.id} b={b} today={today}
                    isUpdating={updating === b.id}
                    {...rowActions(b)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <BookSpaceForm
          spaces={allSpaces}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refresh(); }}
        />
      )}
      {payModal && (
        <PaymentModal
          booking={payModal.booking}
          mode={payModal.mode}
          onClose={() => setPayModal(null)}
          onDone={handlePayDone}
        />
      )}
    </div>
  );
}
