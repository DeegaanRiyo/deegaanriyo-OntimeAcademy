"use client";

import { useState, useEffect, useCallback } from "react";
import type { Space } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

// Grid hours: 9 AM – 9 PM (last bookable start time; session ends ≤ 10 PM)
const GRID_HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // [9,10,...,21]

const HOUR_OPTIONS = [
  { value: 1, label: "1 hr" },
  { value: 2, label: "2 hrs" },
  { value: 3, label: "3 hrs" },
  { value: 4, label: "4 hrs" },
  { value: 5, label: "5 hrs" },
  { value: 6, label: "6 hrs" },
  { value: 7, label: "7 hrs" },
];

function fmt24(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:00 ${ampm}`;
}

function fmt24Value(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingSlot = {
  id: string;
  start_time: string; // "HH:MM:SS"
  hours: number;
  status: string;
  visitor_name: string;
};

type ModalState = {
  date: string;
  start_time: string; // "HH:00"
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return true if hour h is occupied by any confirmed/active booking */
function isOccupied(h: number, bookings: BookingSlot[]): boolean {
  return bookings.some((b) => {
    const startH = parseInt(b.start_time.split(":")[0], 10);
    const endH   = startH + b.hours;
    return h >= startH && h < endH;
  });
}

/** Format YYYY-MM-DD → "Mon, 24 Mar 2025" */
function formatDateDisplay(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-KE", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Booking Modal ────────────────────────────────────────────────────────────

function BookingModal({
  space,
  initial,
  onClose,
}: {
  space: Space;
  initial: ModalState;
  onClose: () => void;
}) {
  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [email,    setEmail]    = useState("");
  const [date,     setDate]     = useState(initial.date);
  const [startTime, setStartTime] = useState(initial.start_time);
  const [hours,    setHours]    = useState(1);
  const [notes,    setNotes]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [done,     setDone]     = useState(false);

  const startH = parseInt(startTime.split(":")[0], 10);
  const endH   = startH + hours;
  const endTooLate = endH > 22; // session must end by 10 PM

  const estimatedCost =
    space.hourly_rate > 0 ? space.hourly_rate * hours : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !date || !startTime) {
      setError("Please fill in all required fields.");
      return;
    }
    if (endTooLate) {
      setError(`Session would end after 10 PM. Please reduce duration or pick an earlier start time.`);
      return;
    }
    setError(null);
    setSubmitting(true);

    const cost = space.hourly_rate > 0 ? space.hourly_rate * hours : 0;

    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id:       space.id,
          visitor_name:   name.trim(),
          visitor_email:  email.trim() || null,
          visitor_phone:  phone.trim(),
          booking_date:   date,
          start_time:     startTime,
          hours,
          estimated_cost: cost,
        }),
      });
    } catch {
      // Non-blocking
    }

    // Build WhatsApp message
    const h12Start = startH > 12 ? startH - 12 : startH;
    const ampmStart = startH < 12 ? "AM" : "PM";
    const h12End   = endH > 12 ? endH - 12 : endH;
    const ampmEnd  = endH <= 12 ? "AM" : "PM";

    const lines = [
      `Hi, I'd like to book the *${space.name}* at Ontime Academy.`,
      ``,
      `*Name:* ${name.trim()}`,
      `*Phone:* ${phone.trim()}`,
      ...(email.trim() ? [`*Email:* ${email.trim()}`] : []),
      `*Date:* ${date}`,
      `*Time:* ${h12Start}:00 ${ampmStart} – ${h12End}:00 ${ampmEnd} (${hours} ${hours === 1 ? "hr" : "hrs"})`,
      ...(estimatedCost !== null ? [`*Estimated cost:* KES ${estimatedCost.toLocaleString()}`] : []),
      ...(notes.trim() ? [`*Notes:* ${notes.trim()}`] : []),
    ];

    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
    const waURL    = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(waURL, "_blank", "noopener,noreferrer");

    setSubmitting(false);
    setDone(true);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 60, padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: "480px", width: "100%", padding: "28px", gap: 0, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: "2.2rem", color: "var(--green)", marginBottom: "12px" }}>
              <i className="fas fa-check-circle" />
            </div>
            <h3 style={{ marginBottom: "8px" }}>Request Sent!</h3>
            <p style={{ color: "var(--muted)", fontSize: ".85rem", marginBottom: "20px" }}>
              WhatsApp has opened with your booking details. Our team will confirm once payment is received.
            </p>
            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>
                <i className="fas fa-calendar-plus" style={{ marginRight: "8px", color: "var(--teal2)" }} />
                Book a Slot
              </h3>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "1.1rem", cursor: "pointer", padding: "4px" }}
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Name + Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                    Name <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Jane Kamau"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                    Phone <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+254 7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                  Email <span style={{ opacity: .5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Date + Start Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                    Date <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    min={todayISO()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                    Start Time <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <select
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    {GRID_HOURS.map((h) => (
                      <option key={h} value={fmt24Value(h)}>
                        {fmt24(h)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                  Duration <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                >
                  {HOUR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {endTooLate && (
                  <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>
                    Session would end after 10 PM. Reduce duration or pick an earlier time.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                  Notes <span style={{ opacity: .5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea
                  className="form-input"
                  placeholder="E.g. podcast recording for 2 people, need mic setup…"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Cost estimate */}
              {estimatedCost !== null && (
                <div style={{
                  background: "rgba(193,68,14,.08)",
                  border: "1px solid rgba(193,68,14,.2)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--teal2)" }}>
                    Estimated Cost
                  </span>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--teal2)" }}>
                    KES {estimatedCost.toLocaleString()}
                  </span>
                </div>
              )}

              {error && (
                <p style={{ color: "var(--red)", fontSize: ".72rem" }}>{error}</p>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || endTooLate}
                style={{ marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: "1.1rem" }} />
                {submitting ? "Opening WhatsApp…" : "Book via WhatsApp"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Schedule Component ──────────────────────────────────────────────────

export default function SpaceScheduleClient({ space }: { space: Space }) {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);

  const fetchSchedule = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/spaces/${space.id}/schedule?date=${date}`);
      const json = await res.json();
      setBookings(json.bookings ?? []);
    } catch {
      setBookings([]);
    }
    setLoading(false);
  }, [space.id]);

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate, fetchSchedule]);

  const openModal = (h: number) => {
    setModal({ date: selectedDate, start_time: fmt24Value(h) });
  };

  // Navigate dates
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split("T")[0];
    if (iso >= todayISO()) setSelectedDate(iso);
  };

  return (
    <>
      <div style={{ marginBottom: "32px" }}>

        {/* Section header */}
        <h3 style={{ fontSize: ".95rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-clock" style={{ color: "var(--teal2)", fontSize: ".9rem" }} />
          Availability
        </h3>

        {/* Date navigator */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          background: "var(--dark2)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "10px 14px", marginBottom: "16px",
        }}>
          <button
            onClick={() => shiftDate(-1)}
            disabled={selectedDate <= todayISO()}
            style={{
              background: "none", border: "none",
              color: selectedDate <= todayISO() ? "var(--muted)" : "var(--white)",
              cursor: selectedDate <= todayISO() ? "not-allowed" : "pointer",
              fontSize: ".9rem", padding: "4px 8px",
            }}
          >
            <i className="fas fa-chevron-left" />
          </button>

          <div style={{ flex: 1, textAlign: "center" }}>
            <input
              type="date"
              value={selectedDate}
              min={todayISO()}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: "none", border: "none", color: "var(--white)",
                fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
                textAlign: "center",
              }}
            />
            <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: "1px" }}>
              {formatDateDisplay(selectedDate)}
            </div>
          </div>

          <button
            onClick={() => shiftDate(1)}
            style={{
              background: "none", border: "none", color: "var(--white)",
              cursor: "pointer", fontSize: ".9rem", padding: "4px 8px",
            }}
          >
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: ".72rem", color: "var(--muted)" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)", display: "inline-block" }} />
            Booked
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: ".72rem", color: "var(--muted)" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", display: "inline-block" }} />
            Available — click to book
          </div>
        </div>

        {/* Time grid */}
        {loading ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)", fontSize: ".82rem" }}>
            <span className="spinner" style={{ marginRight: "8px" }} />
            Loading schedule…
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            gap: "8px",
          }}>
            {GRID_HOURS.map((h) => {
              const occupied = isOccupied(h, bookings);
              return occupied ? (
                <div
                  key={h}
                  style={{
                    padding: "10px 8px",
                    borderRadius: "8px",
                    textAlign: "center",
                    background: "rgba(239,68,68,.1)",
                    border: "1px solid rgba(239,68,68,.35)",
                    cursor: "not-allowed",
                  }}
                >
                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#fca5a5" }}>
                    {fmt24(h)}
                  </div>
                  <div style={{ fontSize: ".62rem", color: "rgba(252,165,165,.7)", marginTop: "3px" }}>
                    Booked
                  </div>
                </div>
              ) : (
                <button
                  key={h}
                  onClick={() => openModal(h)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: "8px",
                    textAlign: "center",
                    background: "rgba(34,197,94,.07)",
                    border: "1px solid rgba(34,197,94,.28)",
                    cursor: "pointer",
                    transition: "background .15s, border-color .15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,.18)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(34,197,94,.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,.07)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(34,197,94,.28)";
                  }}
                >
                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#86efac" }}>
                    {fmt24(h)}
                  </div>
                  <div style={{ fontSize: ".62rem", color: "rgba(134,239,172,.7)", marginTop: "3px" }}>
                    Available
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {modal && (
        <BookingModal
          space={space}
          initial={modal}
          onClose={() => {
            setModal(null);
            // Refresh schedule so newly-pending slots don't confuse (confirmed ones matter)
            fetchSchedule(selectedDate);
          }}
        />
      )}
    </>
  );
}
