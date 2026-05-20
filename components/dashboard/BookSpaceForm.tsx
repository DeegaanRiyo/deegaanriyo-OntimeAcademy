"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type Space = { id: string; name: string; slug: string };

const SPACE_SETUPS: Record<string, string[]> = {
  "boardroom":       ["Standard Meeting", "Executive Meeting", "Client Presentation", "Interview"],
  "conference-room": ["Conference Layout", "Training Layout", "Seminar Layout", "Event / Workshop"],
  "podcast-studio":  ["Podcast Recording", "Interview Setup", "Live Stream Setup", "Audio Recording"],
  "content-studio":  ["YouTube Shoot", "Photography Session", "Product Shoot", "Social Media Content"],
};

const schema = z.object({
  space_id:     z.string().min(1, "Please select a space"),
  setup:        z.string().optional(),
  visitor_name: z.string().min(2, "Name must be at least 2 characters"),
  visitor_phone: z.string().regex(/^(\+?254|0)7\d{8}$/, "Enter a valid Kenyan phone (e.g. 07XX XXX XXX)"),
  booking_date: z.string().min(1, "Please select a date"),
  start_time:   z.string().min(1, "Please select a start time"),
  end_time:     z.string().min(1, "Please select an end time"),
  notes:        z.string().optional(),
}).refine(
  (d) => !d.start_time || !d.end_time || d.end_time > d.start_time,
  { message: "End time must be after start time", path: ["end_time"] }
);

type FormData = z.infer<typeof schema>;
type PayMethod = "cash" | "mpesa" | "bank_transfer";

interface Props {
  spaces: Space[];
  defaultSpaceId?: string;
  defaultDate?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: ".7rem", color: "var(--red)", display: "flex", alignItems: "center", gap: "4px", margin: "4px 0 0" }}>
      <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
      {msg}
    </p>
  );
}

const INP: React.CSSProperties = {
  width: "100%", background: "rgba(17,17,17,.04)",
  border: "1px solid rgba(17,17,17,.15)", borderRadius: "8px",
  padding: "9px 12px", color: "var(--dark)", fontSize: ".88rem",
  outline: "none", boxSizing: "border-box", transition: "border .15s",
};
const LBL: React.CSSProperties = {
  display: "block", fontSize: ".62rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".1em",
  color: "rgba(17,17,17,.4)", marginBottom: "5px",
};

export default function BookSpaceForm({ spaces, defaultSpaceId, defaultDate, onClose, onSuccess }: Props) {
  const todayStr = defaultDate ?? new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

  const [saved,         setSaved]         = useState(false);
  const [totalCost,     setTotalCost]     = useState("");   // estimated / agreed total
  const [amountPaid,    setAmountPaid]    = useState("");   // amount paid right now
  const [payMethod,     setPayMethod]     = useState<PayMethod>("cash");
  const [payRef,        setPayRef]        = useState("");
  const [paymentError,  setPaymentError]  = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      space_id:     defaultSpaceId ?? spaces[0]?.id ?? "",
      booking_date: todayStr,
      start_time:   "08:00",
      end_time:     "10:00",
    },
  });

  const spaceId       = watch("space_id");
  const startT        = watch("start_time");
  const endT          = watch("end_time");
  const selectedSpace = spaces.find((s) => s.id === spaceId);
  const setups        = selectedSpace ? (SPACE_SETUPS[selectedSpace.slug] ?? []) : [];

  // Duration
  let durationLabel = "";
  if (startT && endT && endT > startT) {
    const [sh, sm] = startT.split(":").map(Number);
    const [eh, em] = endT.split(":").map(Number);
    const total = (eh * 60 + em) - (sh * 60 + sm);
    const hrs   = Math.floor(total / 60);
    const mins  = total % 60;
    durationLabel = hrs > 0 && mins > 0 ? `${hrs}h ${mins}m` : hrs > 0 ? `${hrs} hr${hrs > 1 ? "s" : ""}` : `${mins} min`;
  }

  // Balance live calc
  const costNum    = Number(totalCost)  || 0;
  const paidNum    = Number(amountPaid) || 0;
  const balance    = costNum > 0 && paidNum > 0 ? costNum - paidNum : null;
  const paidPct    = costNum > 0 && paidNum > 0 ? Math.min(100, Math.round((paidNum / costNum) * 100)) : 0;

  const needsRef = payMethod === "mpesa" || payMethod === "bank_transfer";

  const onSubmit = async (data: FormData) => {
    // Validate: if amount paid is entered, it must be > 0
    if (amountPaid) {
      const amt = Number(amountPaid);
      if (isNaN(amt) || amt <= 0) {
        setPaymentError("Enter a valid payment amount.");
        return;
      }
      if (costNum > 0 && amt > costNum) {
        setPaymentError("Amount paid cannot exceed the total cost.");
        return;
      }
      setPaymentError(null);
    }

    try {
      const res = await fetch("/api/receptionist/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id:       data.space_id,
          visitor_name:   data.visitor_name.trim(),
          visitor_phone:  data.visitor_phone.trim(),
          setup:          data.setup || null,
          booking_date:   data.booking_date,
          start_time:     data.start_time,
          end_time:       data.end_time,
          notes:          data.notes?.trim() || null,
          estimated_cost: costNum > 0 ? costNum : null,
          // Payment — only if amount entered
          ...(amountPaid && paidNum > 0 ? {
            amount_paid:       paidNum,
            payment_method:    payMethod,
            payment_reference: payRef.trim() || null,
          } : {}),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError("root", { message: json.error ?? "Failed to create booking." });
        return;
      }

      setSaved(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch {
      setError("root", { message: "Network error — please try again." });
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "40px 32px", width: "100%", maxWidth: "380px", textAlign: "center" }}>
          <div style={{ fontSize: "2.4rem", color: "#16a34a", marginBottom: "12px" }}>
            <i className="fas fa-calendar-check" />
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 800, color: "var(--dark)" }}>Booking Confirmed!</h2>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: ".82rem" }}>
            The space has been reserved successfully.
          </p>
          {paidNum > 0 && balance !== null && balance > 0 && (
            <div style={{ marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(180,83,9,.08)", border: "1px solid rgba(180,83,9,.2)", borderRadius: "6px", padding: "6px 14px", fontSize: ".78rem", color: "#b45309", fontWeight: 700 }}>
              <i className="fas fa-clock" />
              KES {balance.toLocaleString()} balance outstanding
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "560px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.18)" }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid rgba(17,17,17,.07)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".95rem", color: "var(--dark)" }}>Book a Space</div>
            <div style={{ fontSize: ".68rem", color: "rgba(17,17,17,.35)", marginTop: "1px" }}>Create a confirmed reservation</div>
          </div>
          <button onClick={onClose} style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,.05)", border: "none", borderRadius: "6px", cursor: "pointer", color: "rgba(17,17,17,.4)", fontSize: ".78rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Space + Setup */}
          <div style={{ display: "grid", gridTemplateColumns: setups.length > 0 ? "1fr 1fr" : "1fr", gap: "12px" }}>
            <div>
              <label style={LBL}>Space *</label>
              <select {...register("space_id")} style={INP}>
                {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <FieldError msg={errors.space_id?.message} />
            </div>
            {setups.length > 0 && (
              <div>
                <label style={LBL}>Setup / Config</label>
                <select {...register("setup")} style={INP}>
                  <option value="">— Any —</option>
                  {setups.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Client name + phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={LBL}>Client Name *</label>
              <input type="text" placeholder="Full name" {...register("visitor_name")} style={INP} />
              <FieldError msg={errors.visitor_name?.message} />
            </div>
            <div>
              <label style={LBL}>Phone *</label>
              <input type="tel" placeholder="07XX XXX XXX" {...register("visitor_phone")} style={INP} />
              <FieldError msg={errors.visitor_phone?.message} />
            </div>
          </div>

          {/* Date + times */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={LBL}>Date *</label>
              <input type="date" {...register("booking_date")} style={INP} />
              <FieldError msg={errors.booking_date?.message} />
            </div>
            <div>
              <label style={LBL}>From *</label>
              <input type="time" {...register("start_time")} style={INP} />
              <FieldError msg={errors.start_time?.message} />
            </div>
            <div>
              <label style={LBL}>To *</label>
              <input type="time" {...register("end_time")} style={INP} />
              <FieldError msg={errors.end_time?.message} />
            </div>
          </div>

          {/* Duration pill */}
          {durationLabel && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: ".75rem", fontWeight: 600, color: "var(--teal2)", marginTop: "-6px" }}>
              <i className="fas fa-clock" style={{ fontSize: ".65rem" }} />
              Duration: {durationLabel}
            </div>
          )}

          {/* ── Payment Section ─────────────────────────────────── */}
          <div style={{ background: "rgba(17,17,17,.02)", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>

            <div style={{ fontSize: ".62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(17,17,17,.3)", display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fas fa-receipt" />
              Payment
            </div>

            {/* Total cost + Amount paid side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={LBL}>Total / Agreed Cost (KES)</label>
                <input
                  type="number" min="0" step="1"
                  placeholder="e.g. 3,000"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  style={INP}
                />
                <div style={{ fontSize: ".62rem", color: "rgba(17,17,17,.3)", marginTop: "3px" }}>Full amount owed</div>
              </div>
              <div>
                <label style={LBL}>Amount Paid Now (KES)</label>
                <input
                  type="number" min="0" step="1"
                  placeholder={costNum > 0 ? `Up to ${costNum.toLocaleString()}` : "e.g. 1,500"}
                  value={amountPaid}
                  onChange={(e) => { setAmountPaid(e.target.value); setPaymentError(null); }}
                  style={{ ...INP, borderColor: paymentError ? "var(--red)" : "rgba(17,17,17,.15)" }}
                />
                {paymentError
                  ? <div style={{ fontSize: ".62rem", color: "var(--red)", marginTop: "3px" }}>{paymentError}</div>
                  : <div style={{ fontSize: ".62rem", color: "rgba(17,17,17,.3)", marginTop: "3px" }}>Leave blank if no payment yet</div>
                }
              </div>
            </div>

            {/* Balance preview bar — shown when both values entered */}
            {costNum > 0 && paidNum > 0 && (
              <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "8px", padding: "10px 12px" }}>
                {/* Progress bar */}
                <div style={{ height: "6px", background: "rgba(17,17,17,.07)", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                  <div style={{ height: "100%", width: `${paidPct}%`, background: balance !== null && balance <= 0 ? "#16a34a" : "#E8490F", borderRadius: "3px", transition: "width .2s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".75rem" }}>
                  <div style={{ display: "flex", gap: "14px" }}>
                    <span style={{ color: "rgba(17,17,17,.4)" }}>
                      Total: <strong style={{ color: "var(--dark)" }}>KES {costNum.toLocaleString()}</strong>
                    </span>
                    <span style={{ color: "#16a34a" }}>
                      Paid: <strong>KES {paidNum.toLocaleString()}</strong>
                    </span>
                  </div>
                  {balance !== null && balance > 0 ? (
                    <span style={{ fontWeight: 700, color: "#b45309", background: "rgba(180,83,9,.08)", border: "1px solid rgba(180,83,9,.2)", borderRadius: "100px", padding: "2px 9px", fontSize: ".68rem" }}>
                      KES {balance.toLocaleString()} balance
                    </span>
                  ) : (
                    <span style={{ fontWeight: 700, color: "#16a34a", fontSize: ".68rem" }}>
                      <i className="fas fa-check-circle" style={{ marginRight: "4px" }} />Fully paid
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Payment method — shown only when amount is entered */}
            {paidNum > 0 && (
              <>
                <div>
                  <label style={LBL}>Payment Method *</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["cash", "mpesa", "bank_transfer"] as const).map((m) => {
                      const active = payMethod === m;
                      const labels: Record<string, string> = { cash: "Cash", mpesa: "M-Pesa", bank_transfer: "Bank" };
                      const icons:  Record<string, string> = { cash: "fa-money-bill", mpesa: "fa-mobile-alt", bank_transfer: "fa-university" };
                      return (
                        <button key={m} type="button" onClick={() => setPayMethod(m)} style={{
                          flex: 1, padding: "8px 6px", borderRadius: "8px", cursor: "pointer",
                          fontWeight: 700, fontSize: ".75rem",
                          background: active ? "rgba(232,73,15,.1)" : "rgba(17,17,17,.03)",
                          border:     active ? "1px solid rgba(232,73,15,.4)" : "1px solid rgba(17,17,17,.1)",
                          color:      active ? "#E8490F" : "rgba(17,17,17,.4)",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                        }}>
                          <i className={`fas ${icons[m]}`} style={{ fontSize: ".68rem" }} />
                          {labels[m]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {needsRef && (
                  <div>
                    <label style={LBL}>
                      {payMethod === "mpesa" ? "M-Pesa" : "Transfer"} Reference
                      <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, opacity: .5, marginLeft: "4px" }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder={payMethod === "mpesa" ? "e.g. QA12BCD3E4" : "e.g. TXN12345"}
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      style={INP}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={LBL}>Notes (optional)</label>
            <textarea
              {...register("notes")}
              placeholder="Any special requirements…"
              rows={2}
              style={{ ...INP, height: "auto", padding: "8px 12px", resize: "vertical" }}
            />
          </div>

          {/* API error */}
          {errors.root && (
            <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "8px", padding: "10px 14px", color: "#dc2626", fontSize: ".82rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-exclamation-triangle" />
              {errors.root.message}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "2px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid rgba(17,17,17,.15)", borderRadius: "8px", color: "rgba(17,17,17,.5)", fontSize: ".88rem", fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: "11px", background: "#E8490F", border: "none", borderRadius: "8px", color: "#fff", fontSize: ".88rem", fontWeight: 800, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin" />Creating…</>
              ) : paidNum > 0 ? (
                <><i className="fas fa-money-bill-wave" />Confirm & Record Payment</>
              ) : (
                <><i className="fas fa-calendar-check" />Confirm Booking</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
