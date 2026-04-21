"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Space } from "@/types";

// ─── Date helpers ───────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}
function maxISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

// ─── Validation schema ──────────────────────────────────────────────────────

const PURPOSE_OPTIONS = [
  { value: "meeting",    label: "Meeting / Boardroom session" },
  { value: "training",   label: "Training / Workshop" },
  { value: "podcast",    label: "Podcast / Audio recording" },
  { value: "content",    label: "Content creation / Photoshoot" },
  { value: "conference", label: "Conference / Seminar" },
  { value: "interview",  label: "Interview / HR session" },
  { value: "other",      label: "Other" },
];

const bookingSchema = z.object({
  booking_date: z.string()
    .min(1, "Select a date")
    .refine((d) => d >= todayISO(), { message: "Date cannot be in the past" })
    .refine((d) => d <= maxISO(),   { message: "Bookings are only accepted up to 30 days in advance" }),
  start_time: z.string().min(1, "Select a start time"),
  hours:      z.coerce.number().min(1).max(9),
  attendees:  z.coerce.number().min(1).max(50),
  purpose:    z.string().min(1, "Select a purpose"),
  phone:      z.string().optional(),
  notes:      z.string().optional(),
});

type BookingFields = z.infer<typeof bookingSchema>;

// ─── Time slots: 7:00 AM – 8:00 PM ────────────────────────────────────────

function generateTimeSlots() {
  const slots: { value: string; label: string }[] = [];
  for (let h = 7; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break;
      const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      slots.push({
        value: `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`,
        label: `${h12}:${m === 0 ? "00" : "30"} ${ampm}`,
      });
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

const HOUR_OPTIONS = [
  { value: 1, label: "1 hr"     },
  { value: 2, label: "2 hrs"    },
  { value: 3, label: "3 hrs"    },
  { value: 4, label: "4 hrs"    },
  { value: 5, label: "5 hrs"    },
  { value: 6, label: "6 hrs"    },
  { value: 7, label: "7 hrs"    },
  { value: 8, label: "8 hrs"    },
  { value: 9, label: "Full Day" },
];

// ─── Shared input style (light card context) ────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "#fff", border: "1px solid rgba(17,17,17,.15)",
  borderRadius: "7px", padding: "7px 10px",
  color: "#111", fontSize: ".83rem", outline: "none",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: ".62rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em",
  color: "#6b7280", marginBottom: "4px",
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface BookingFormProps {
  space: Space;
  user:  { full_name: string; email: string; phone: string | null } | null;
}

// ─── Auth gate ──────────────────────────────────────────────────────────────

function AuthGate({ returnTo }: { returnTo: string }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "rgba(193,68,14,.1)", border: "1px solid rgba(193,68,14,.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px", fontSize: "1.2rem", color: "#C1440E",
      }}>
        <i className="fas fa-lock" />
      </div>
      <p style={{ fontSize: ".88rem", fontWeight: 700, color: "#111", marginBottom: "6px" }}>
        Sign in to book this space
      </p>
      <p style={{ fontSize: ".78rem", color: "#6b7280", marginBottom: "20px", lineHeight: 1.6 }}>
        Create a free account or log in. We&apos;ll send a WhatsApp confirmation once your booking is approved.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Link
          href={`/signup?return=${encodeURIComponent(returnTo)}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "12px 16px", borderRadius: "9px", textDecoration: "none",
            fontSize: ".88rem", fontWeight: 700,
            background: "linear-gradient(135deg,#C1440E,#E05520)", color: "#fff",
          }}
        >
          <i className="fas fa-user-plus" /> Create Free Account
        </Link>
        <Link
          href={`/login?return=${encodeURIComponent(returnTo)}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "11px 16px", borderRadius: "9px", textDecoration: "none",
            fontSize: ".85rem", fontWeight: 600,
            background: "transparent", border: "1px solid rgba(17,17,17,.18)",
            color: "#6b7280",
          }}
        >
          <i className="fas fa-arrow-right-to-bracket" /> Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BookingForm({ space, user }: BookingFormProps) {
  const pathname  = usePathname();
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [showNotes,  setShowNotes]  = useState(false);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (showNotes && notesRef.current) notesRef.current.focus();
  }, [showNotes]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFields>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: { booking_date: todayISO(), hours: 1, start_time: "08:00", attendees: 1, purpose: "meeting" },
  });

  const watchedHours  = watch("hours");
  const estimatedCost = space.hourly_rate > 0
    ? space.hourly_rate * (watchedHours === 9 ? 8 : Number(watchedHours))
    : null;

  if (!user) return <AuthGate returnTo={pathname} />;

  // ── Success ──────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "32px 8px" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(22,163,74,.1)", border: "1px solid rgba(22,163,74,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: "1.3rem", color: "#16a34a",
        }}>
          <i className="fas fa-check" />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 800, color: "#111" }}>
          Request submitted!
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: ".82rem", color: "#6b7280", lineHeight: 1.6 }}>
          Our team will review and send you a WhatsApp confirmation once payment is arranged.
        </p>
        <button
          onClick={() => { setSubmitted(false); setApiError(null); }}
          style={{ background: "none", border: "none", color: "#C1440E", fontSize: ".82rem", fontWeight: 700, cursor: "pointer" }}
        >
          Make another booking
        </button>
      </div>
    );
  }

  const onSubmit = async (data: BookingFields) => {
    setSubmitting(true);
    setApiError(null);
    const hoursValue = Number(data.hours);
    const cost = space.hourly_rate > 0 ? space.hourly_rate * (hoursValue === 9 ? 8 : hoursValue) : 0;

    const purposeLabel = PURPOSE_OPTIONS.find((p) => p.value === data.purpose)?.label ?? data.purpose;
    const structuredNote = [
      `Purpose: ${purposeLabel}`,
      `Attendees: ${data.attendees}`,
      data.notes?.trim() ? `Notes: ${data.notes.trim()}` : "",
    ].filter(Boolean).join(" | ");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id:       space.id,
          visitor_name:   user.full_name,
          visitor_email:  user.email,
          visitor_phone:  user.phone || data.phone || "",
          booking_date:   data.booking_date,
          start_time:     data.start_time,
          hours:          hoursValue,
          estimated_cost: cost,
          notes:          structuredNote,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setApiError(json.error ?? "Could not submit booking. Please try again.");
        setSubmitting(false);
        return;
      }
    } catch {
      setApiError("Network error — please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  // ── Form ─────────────────────────────────────────────────────────────────
  const { ref: notesRegRef, ...notesRest } = register("notes");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* Who's booking */}
      <div>
        <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#6b7280", marginBottom: "4px" }}>
          Booking as
        </div>
        <div style={{
          background: "rgba(193,68,14,.06)", border: "1px solid rgba(193,68,14,.18)",
          borderRadius: "7px", padding: "7px 12px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(193,68,14,.12)", border: "1px solid rgba(193,68,14,.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#C1440E", fontSize: ".72rem", flexShrink: 0,
          }}>
            <i className="fas fa-user" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: ".83rem", color: "#111", lineHeight: 1.3 }}>
              {user.full_name}
            </div>
            <div style={{ fontSize: ".68rem", color: "#6b7280" }}>{user.email}</div>
            {user.phone && (
              <div style={{ fontSize: ".68rem", color: "#6b7280" }}>{user.phone}</div>
            )}
          </div>
        </div>
      </div>

      {/* Phone — only shown when not on profile */}
      {!user.phone && (
        <div>
          <label style={labelStyle}>
            Phone <span style={{ color: "#6b7280", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <input
            type="tel"
            placeholder="07XX XXX XXX"
            style={inputStyle}
            {...register("phone")}
          />
        </div>
      )}

      {/* Date + Start time + Duration in one row on narrow screens */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <label style={labelStyle}>Date <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            type="date"
            min={todayISO()}
            max={maxISO()}
            style={inputStyle}
            {...register("booking_date")}
          />
          {errors.booking_date && (
            <p style={{ color: "#ef4444", fontSize: ".65rem", marginTop: "2px" }}>{errors.booking_date.message}</p>
          )}
        </div>
        <div>
          <label style={labelStyle}>Start Time <span style={{ color: "#ef4444" }}>*</span></label>
          <select style={inputStyle} {...register("start_time")}>
            {TIME_SLOTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration + Attendees */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <label style={labelStyle}>Duration <span style={{ color: "#ef4444" }}>*</span></label>
          <select style={inputStyle} {...register("hours")}>
            {HOUR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Attendees <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            type="number"
            min={1}
            max={50}
            style={inputStyle}
            {...register("attendees")}
          />
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label style={labelStyle}>Purpose <span style={{ color: "#ef4444" }}>*</span></label>
        <select style={inputStyle} {...register("purpose")}>
          {PURPOSE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Notes — collapsible */}
      {showNotes ? (
        <div>
          <label style={labelStyle}>Notes <span style={{ opacity: .45, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
          <textarea
            rows={2}
            placeholder="Any special setup or requirements..."
            style={{ ...inputStyle, resize: "none" }}
            ref={(el) => { notesRegRef(el); notesRef.current = el; }}
            {...notesRest}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          style={{
            background: "none", border: "1px dashed rgba(17,17,17,.18)", borderRadius: "7px",
            padding: "6px 10px", color: "#9ca3af", fontSize: ".75rem", cursor: "pointer",
            textAlign: "left", display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          <i className="fas fa-plus" style={{ fontSize: ".65rem" }} />
          Add a note (optional)
        </button>
      )}

      {/* Cost estimator */}
      <div style={{
        background: "rgba(193,68,14,.07)", border: "1px solid rgba(193,68,14,.2)",
        borderRadius: "7px", padding: "9px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#C1440E" }}>
          Est. Cost
        </span>
        <span style={{ fontSize: "1rem", fontWeight: 800, color: "#C1440E" }}>
          {estimatedCost !== null ? `KES ${estimatedCost.toLocaleString()}` : "Rate on enquiry"}
        </span>
      </div>

      {/* API error */}
      {apiError && (
        <p style={{ color: "#ef4444", fontSize: ".75rem", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
          <i className="fas fa-circle-exclamation" /> {apiError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: "8px", border: "none",
          background: submitting ? "rgba(193,68,14,.5)" : "linear-gradient(135deg,#C1440E,#E05520)",
          color: "#fff", fontSize: ".88rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}
      >
        <i className="fas fa-calendar-check" />
        {submitting ? "Submitting…" : "Request Booking"}
      </button>

      <p style={{ margin: 0, fontSize: ".65rem", color: "#9ca3af", textAlign: "center" }}>
        Confirmation via WhatsApp once payment is arranged.
      </p>
    </form>
  );
}
