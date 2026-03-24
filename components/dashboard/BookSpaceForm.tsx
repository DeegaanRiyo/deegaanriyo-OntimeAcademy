"use client";

import { useRouter } from "next/navigation";
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
  space_id:       z.string().min(1, "Please select a space"),
  setup:          z.string().optional(),
  visitor_name:   z.string().min(2, "Name must be at least 2 characters"),
  visitor_phone:  z.string().regex(/^(\+?254|0)7\d{8}$/, "Enter a valid Kenyan phone (e.g. 07XX XXX XXX)"),
  booking_date:   z.string().min(1, "Please select a date"),
  start_time:     z.string().min(1, "Please select a start time"),
  end_time:       z.string().min(1, "Please select an end time"),
  estimated_cost: z.string().optional(),
  notes:          z.string().optional(),
}).refine(
  (d) => !d.start_time || !d.end_time || d.end_time > d.start_time,
  { message: "End time must be after start time", path: ["end_time"] }
);

type FormData = z.infer<typeof schema>;

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
    <p className="text-[.7rem] text-[var(--red)] flex items-center gap-1 mt-1">
      <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
      {msg}
    </p>
  );
}

const inputCls = (hasError?: boolean) =>
  `w-full bg-[rgba(17,17,17,.04)] border rounded-lg px-3 py-2.5 text-[var(--dark)] text-[.88rem] focus:outline-none transition-all duration-200 ${
    hasError
      ? "border-[var(--red)] focus:border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(239,68,68,.1)]"
      : "border-[rgba(17,17,17,.15)] focus:border-[rgba(193,68,14,.45)] focus:shadow-[0_0_0_3px_rgba(193,68,14,.08)]"
  }`;

export default function BookSpaceForm({ spaces, defaultSpaceId, defaultDate, onClose, onSuccess }: Props) {
  const router = useRouter();
  const todayStr = defaultDate ?? new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

  // Payment state (not part of react-hook-form since it's conditional)
  const [collectPayment,  setCollectPayment]  = useState(false);
  const [amountPaid,      setAmountPaid]      = useState("");
  const [paymentMethod,   setPaymentMethod]   = useState<"cash" | "bank_transfer">("cash");
  const [paymentRef,      setPaymentRef]      = useState("");
  const [paymentError,    setPaymentError]    = useState<string | null>(null);

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
  const estimatedCost = watch("estimated_cost");
  const selectedSpace = spaces.find((s) => s.id === spaceId);
  const setups        = selectedSpace ? (SPACE_SETUPS[selectedSpace.slug] ?? []) : [];

  // Duration display
  let durationLabel = "";
  if (startT && endT && endT > startT) {
    const [sh, sm] = startT.split(":").map(Number);
    const [eh, em] = endT.split(":").map(Number);
    const total = (eh * 60 + em) - (sh * 60 + sm);
    const hrs   = Math.floor(total / 60);
    const mins  = total % 60;
    durationLabel = hrs > 0 && mins > 0 ? `${hrs}h ${mins}m` : hrs > 0 ? `${hrs} hour${hrs > 1 ? "s" : ""}` : `${mins} minutes`;
  }

  // Outstanding after payment
  const estNum     = Number(estimatedCost);
  const paidNum    = Number(amountPaid);
  const outstanding = collectPayment && estNum > 0 && paidNum > 0 ? estNum - paidNum : null;

  const onSubmit = async (data: FormData) => {
    // Validate payment if collecting
    if (collectPayment) {
      const amt = Number(amountPaid);
      if (!amountPaid || isNaN(amt) || amt <= 0) {
        setPaymentError("Enter a valid payment amount.");
        return;
      }
      setPaymentError(null);
    }

    try {
      const res = await fetch("/api/receptionist/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          space_id:          data.space_id,
          visitor_name:      data.visitor_name.trim(),
          visitor_phone:     data.visitor_phone.trim(),
          setup:             data.setup || null,
          booking_date:      data.booking_date,
          start_time:        data.start_time,
          end_time:          data.end_time,
          notes:             data.notes?.trim() || null,
          estimated_cost:    data.estimated_cost ? Number(data.estimated_cost) : null,
          // Payment fields (only sent if collecting now)
          ...(collectPayment && amountPaid ? {
            amount_paid:        Number(amountPaid),
            payment_method:     paymentMethod,
            payment_reference:  paymentRef.trim() || null,
          } : {}),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError("root", { message: json.error ?? "Failed to create booking." });
        return;
      }

      onSuccess?.();
      router.refresh();
      onClose();
    } catch {
      setError("root", { message: "Network error — please try again." });
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[rgba(0,0,0,.7)] backdrop-blur-sm flex items-center justify-center p-5">
      <div className="bg-[var(--dark2)] border border-[var(--border)] rounded-2xl p-8 w-full max-w-[540px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[1.2rem] font-bold m-0">Book a Space</h2>
            <p className="text-[.78rem] text-[var(--muted)] mt-1 m-0">Create a confirmed reservation</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--white)] text-[1.1rem] p-1 transition-colors duration-200"
            aria-label="Close"
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

          {/* Space selector */}
          <div>
            <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
              Space
            </label>
            <select {...register("space_id")} className={inputCls(!!errors.space_id)}>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <FieldError msg={errors.space_id?.message} />
          </div>

          {/* Setup */}
          {setups.length > 0 && (
            <div>
              <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
                Setup / Configuration
              </label>
              <select {...register("setup")} className={inputCls()}>
                <option value="">— Select setup —</option>
                {setups.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Client name + phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
                Client Name *
              </label>
              <input
                type="text"
                placeholder="Full name"
                {...register("visitor_name")}
                className={inputCls(!!errors.visitor_name)}
              />
              <FieldError msg={errors.visitor_name?.message} />
            </div>
            <div>
              <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
                Phone *
              </label>
              <input
                type="tel"
                placeholder="07XX XXX XXX"
                {...register("visitor_phone")}
                className={inputCls(!!errors.visitor_phone)}
              />
              <FieldError msg={errors.visitor_phone?.message} />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
              Date *
            </label>
            <input
              type="date"
              {...register("booking_date")}
              className={inputCls(!!errors.booking_date)}
            />
            <FieldError msg={errors.booking_date?.message} />
          </div>

          {/* Start + End time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
                From *
              </label>
              <input
                type="time"
                {...register("start_time")}
                className={inputCls(!!errors.start_time)}
              />
              <FieldError msg={errors.start_time?.message} />
            </div>
            <div>
              <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
                To *
              </label>
              <input
                type="time"
                {...register("end_time")}
                className={inputCls(!!errors.end_time)}
              />
              <FieldError msg={errors.end_time?.message} />
            </div>
          </div>

          {/* Duration preview */}
          {durationLabel && (
            <p className="text-[.78rem] text-[var(--teal2)] font-semibold -mt-1">
              <i className="fas fa-clock mr-1.5" aria-hidden="true" />
              Duration: {durationLabel}
            </p>
          )}

          {/* Estimated cost */}
          <div>
            <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
              Estimated Cost (KES)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 3000"
              {...register("estimated_cost")}
              className={inputCls()}
            />
          </div>

          {/* ── Payment Section ─────────────────────────────────── */}
          <div style={{ border: "1px solid rgba(17,17,17,.1)", borderRadius: "10px", overflow: "hidden" }}>
            {/* Toggle header */}
            <button
              type="button"
              onClick={() => { setCollectPayment((v) => !v); setPaymentError(null); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 14px", background: collectPayment ? "rgba(22,163,74,.06)" : "rgba(17,17,17,.03)",
                border: "none", cursor: "pointer",
                borderBottom: collectPayment ? "1px solid rgba(22,163,74,.15)" : "none",
                transition: "background .15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-money-bill-wave" style={{ color: collectPayment ? "#16a34a" : "var(--muted)", fontSize: ".82rem" }} />
                <span style={{ fontSize: ".8rem", fontWeight: 700, color: collectPayment ? "#16a34a" : "var(--muted)" }}>
                  Collect Payment Now
                </span>
              </div>
              <div style={{
                width: "36px", height: "20px", borderRadius: "10px", position: "relative",
                background: collectPayment ? "#16a34a" : "rgba(17,17,17,.2)",
                transition: "background .2s", flexShrink: 0,
              }}>
                <div style={{
                  position: "absolute", top: "2px",
                  left: collectPayment ? "18px" : "2px",
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: "#fff", transition: "left .2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                }} />
              </div>
            </button>

            {/* Payment fields */}
            {collectPayment && (
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Amount */}
                <div>
                  <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
                    Amount Paid (KES) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={estimatedCost ? `Max: ${Number(estimatedCost).toLocaleString()}` : "e.g. 2500"}
                    value={amountPaid}
                    onChange={(e) => { setAmountPaid(e.target.value); setPaymentError(null); }}
                    className={inputCls(!!paymentError)}
                  />
                  {paymentError && (
                    <p className="text-[.7rem] text-[var(--red)] flex items-center gap-1 mt-1">
                      <i className="fa-solid fa-circle-exclamation" /> {paymentError}
                    </p>
                  )}
                  {/* Outstanding preview */}
                  {outstanding !== null && (
                    <p style={{ fontSize: ".72rem", marginTop: "4px", fontWeight: 600,
                      color: outstanding > 0 ? "#b45309" : "#16a34a" }}>
                      {outstanding > 0
                        ? `KES ${outstanding.toLocaleString()} will remain outstanding`
                        : "Full payment — cleared"}
                    </p>
                  )}
                </div>

                {/* Payment method */}
                <div>
                  <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
                    Payment Method *
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {(["cash", "bank_transfer"] as const).map((m) => (
                      <button
                        key={m} type="button" onClick={() => setPaymentMethod(m)}
                        style={{
                          flex: 1, padding: "9px 8px", borderRadius: "8px", cursor: "pointer",
                          fontWeight: 700, fontSize: ".78rem",
                          background: paymentMethod === m ? "rgba(22,163,74,.1)" : "rgba(17,17,17,.04)",
                          border:     paymentMethod === m ? "1px solid rgba(22,163,74,.4)" : "1px solid rgba(17,17,17,.12)",
                          color:      paymentMethod === m ? "#16a34a" : "var(--muted)",
                        }}
                      >
                        <i className={`fas ${m === "cash" ? "fa-money-bill" : "fa-university"}`} style={{ marginRight: "6px" }} />
                        {m === "cash" ? "Cash" : "Bank Transfer"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reference (bank only) */}
                {paymentMethod === "bank_transfer" && (
                  <div>
                    <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
                      Transfer Reference <span style={{ opacity: .5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TXN12345"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className={inputCls()}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[.68rem] font-bold uppercase tracking-[.1em] text-[var(--muted)] block mb-1.5">
              Notes (optional)
            </label>
            <textarea
              {...register("notes")}
              placeholder="Any special requirements..."
              rows={2}
              className={`${inputCls()} resize-none`}
            />
          </div>

          {/* API error */}
          {errors.root && (
            <div className="bg-[rgba(239,68,68,.1)] border border-[rgba(239,68,68,.3)] rounded-lg px-3.5 py-2.5 text-[#f87171] text-[.82rem] flex items-center gap-2">
              <i className="fas fa-exclamation-triangle" aria-hidden="true" />
              {errors.root.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-[11px] bg-transparent border border-[var(--border)] rounded-lg text-[var(--muted)] text-[.88rem] hover:border-[rgba(193,68,14,.3)] hover:text-[var(--white)] transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-[11px] rounded-lg text-white text-[.88rem] font-bold border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-opacity duration-200 gradient-brand"
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin mr-2" aria-hidden="true" />Creating...</>
              ) : collectPayment ? (
                <><i className="fas fa-money-bill-wave mr-2" aria-hidden="true" />Confirm & Record Payment</>
              ) : (
                <><i className="fas fa-calendar-check mr-2" aria-hidden="true" />Confirm Booking</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
