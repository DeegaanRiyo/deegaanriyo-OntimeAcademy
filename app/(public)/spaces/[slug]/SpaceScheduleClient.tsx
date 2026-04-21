"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Space } from "@/types";

type UserProfile = { full_name: string; email: string; phone: string | null };

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

const PURPOSE_OPTIONS = [
  { value: "meeting",       label: "Meeting / Boardroom session" },
  { value: "training",      label: "Training / Workshop" },
  { value: "podcast",       label: "Podcast / Audio recording" },
  { value: "content",       label: "Content creation / Photoshoot" },
  { value: "conference",    label: "Conference / Seminar" },
  { value: "interview",     label: "Interview / HR session" },
  { value: "other",         label: "Other" },
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
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

function maxISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
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

/** Return the slot state for a given hour */
function slotState(h: number, bookings: BookingSlot[]): "free" | "pending" | "booked" {
  const hit = bookings.find((b) => {
    const startH = parseInt(b.start_time.split(":")[0], 10);
    return h >= startH && h < startH + b.hours;
  });
  if (!hit) return "free";
  if (hit.status === "pending") return "pending";
  return "booked";
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
  user,
  onClose,
}: {
  space:   Space;
  initial: ModalState;
  user:    UserProfile;
  onClose: () => void;
}) {
  const [date,      setDate]      = useState(initial.date);
  const [startTime, setStartTime] = useState(initial.start_time);
  const [hours,     setHours]     = useState(1);
  const [attendees, setAttendees] = useState(1);
  const [purpose,   setPurpose]   = useState("meeting");
  const [notes,     setNotes]     = useState("");
  const [submitting,setSubmitting]= useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [done,      setDone]      = useState(false);

  const startH     = parseInt(startTime.split(":")[0], 10);
  const endH       = startH + hours;
  const endTooLate = endH > 22;

  const estimatedCost = space.hourly_rate > 0 ? space.hourly_rate * hours : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endTooLate) {
      setError("Session would end after 10 PM. Reduce duration or pick an earlier time.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const cost = space.hourly_rate > 0 ? space.hourly_rate * hours : 0;

    // Build a structured notes string so the receptionist sees full context
    const purposeLabel = PURPOSE_OPTIONS.find((p) => p.value === purpose)?.label ?? purpose;
    const structuredNote = [
      `Purpose: ${purposeLabel}`,
      `Attendees: ${attendees}`,
      notes.trim() ? `Notes: ${notes.trim()}` : "",
    ].filter(Boolean).join(" | ");

    try {
      const res = await fetch("/api/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id:       space.id,
          visitor_name:   user.full_name,
          visitor_email:  user.email,
          visitor_phone:  user.phone ?? "",
          booking_date:   date,
          start_time:     startTime,
          hours,
          estimated_cost: cost,
          notes:          structuredNote,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Could not submit booking. Please try again.");
        setSubmitting(false);
        return;
      }
    } catch {
      setError("Network error — please check your connection and try again.");
      setSubmitting(false);
      return;
    }

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
            <h3 style={{ marginBottom: "8px" }}>Request Submitted!</h3>
            <p style={{ color: "var(--muted)", fontSize: ".85rem", marginBottom: "20px" }}>
              Our team will review your booking and send you a WhatsApp confirmation once payment is arranged.
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

            {/* Who's booking */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                Booking as
              </div>
              <div style={{
                background: "rgba(193,68,14,.06)", border: "1px solid rgba(193,68,14,.18)",
                borderRadius: "8px", padding: "9px 12px",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(193,68,14,.15)", border: "1px solid rgba(193,68,14,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--teal2)", fontSize: ".75rem", flexShrink: 0,
                }}>
                  <i className="fas fa-user" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".85rem", color: "var(--white)" }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{user.email}</div>
                  {user.phone && (
                    <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{user.phone}</div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

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
                    max={maxISO()}
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

              {/* Duration + Attendees */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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
                    <p style={{ color: "var(--red)", fontSize: ".65rem", marginTop: "3px" }}>
                      Ends after 10 PM — reduce duration.
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                    Attendees <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    max={50}
                    value={attendees}
                    onChange={(e) => setAttendees(Math.max(1, Math.min(50, Number(e.target.value))))}
                    required
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                  Purpose <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                >
                  {PURPOSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Additional notes */}
              <div>
                <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
                  Additional notes <span style={{ opacity: .5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea
                  className="form-input"
                  placeholder="E.g. need mic setup, projector, specific seating arrangement…"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: "none" }}
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
                <i className="fas fa-calendar-check" style={{ fontSize: "1rem" }} />
                {submitting ? "Submitting…" : "Request Booking"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Schedule Component ──────────────────────────────────────────────────

export default function SpaceScheduleClient({
  space,
  user,
}: {
  space: Space;
  user:  UserProfile | null;
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [bookings,     setBookings]     = useState<BookingSlot[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState<ModalState | null>(null);

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
    if (!user) {
      router.push(`/signup?return=${encodeURIComponent(pathname)}`);
      return;
    }
    setModal({ date: selectedDate, start_time: fmt24Value(h) });
  };

  // Navigate dates
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    const iso = d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
    if (iso >= todayISO() && iso <= maxISO()) setSelectedDate(iso);
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
          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: "10px", padding: "10px 14px", marginBottom: "16px",
        }}>
          <button
            onClick={() => shiftDate(-1)}
            disabled={selectedDate <= todayISO()}
            style={{
              background: "none", border: "none",
              color: selectedDate <= todayISO() ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.85)",
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
              max={maxISO()}
              onChange={(e) => {
                const v = e.target.value;
                if (v >= todayISO() && v <= maxISO()) setSelectedDate(v);
              }}
              style={{
                background: "none", border: "none", color: "#ffffff",
                fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
                textAlign: "center", colorScheme: "dark",
              }}
            />
            <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.6)", marginTop: "2px", fontWeight: 500 }}>
              {formatDateDisplay(selectedDate)}
            </div>
          </div>

          <button
            onClick={() => shiftDate(1)}
            disabled={selectedDate >= maxISO()}
            style={{
              background: "none", border: "none",
              color: selectedDate >= maxISO() ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.85)",
              cursor: selectedDate >= maxISO() ? "not-allowed" : "pointer",
              fontSize: ".9rem", padding: "4px 8px",
            }}
          >
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: ".7rem", color: "rgba(255,255,255,.55)" }}>
            <span style={{ width: "11px", height: "11px", borderRadius: "3px", background: "rgba(239,68,68,.25)", border: "1px solid rgba(239,68,68,.5)", display: "inline-block" }} />
            Booked
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: ".7rem", color: "rgba(255,255,255,.55)" }}>
            <span style={{ width: "11px", height: "11px", borderRadius: "3px", background: "rgba(251,191,36,.2)", border: "1px solid rgba(251,191,36,.45)", display: "inline-block" }} />
            Reserved
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: ".7rem", color: "rgba(255,255,255,.55)" }}>
            <span style={{ width: "11px", height: "11px", borderRadius: "3px", background: "rgba(34,197,94,.18)", border: "1px solid rgba(34,197,94,.45)", display: "inline-block" }} />
            Free — click to book
          </div>
        </div>
        <p style={{ fontSize: ".68rem", color: "rgba(255,255,255,.4)", marginBottom: "12px" }}>
          <i className="fas fa-calendar-range" style={{ marginRight: "5px" }} />
          Bookings open for the next 30 days · up to {new Date(maxISO() + "T12:00:00").toLocaleDateString("en-KE", { day: "numeric", month: "long" })}
        </p>

        {/* Time grid — 4 columns always, compact pills */}
        {loading ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "rgba(255,255,255,.4)", fontSize: ".82rem" }}>
            <span className="spinner" style={{ marginRight: "8px" }} />
            Loading schedule…
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "6px",
          }}>
            {GRID_HOURS.map((h) => {
              const state = slotState(h, bookings);

              if (state === "booked") return (
                <div key={h} title="Confirmed booking" style={{
                  padding: "8px 4px", borderRadius: "7px", textAlign: "center",
                  background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                  cursor: "not-allowed",
                }}>
                  <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#fca5a5", lineHeight: 1.2 }}>{fmt24(h)}</div>
                  <div style={{ fontSize: ".55rem", color: "rgba(252,165,165,.6)", marginTop: "2px" }}>Booked</div>
                </div>
              );

              if (state === "pending") return (
                <div key={h} title="Pending reservation" style={{
                  padding: "8px 4px", borderRadius: "7px", textAlign: "center",
                  background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.35)",
                  cursor: "not-allowed",
                }}>
                  <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#fde68a", lineHeight: 1.2 }}>{fmt24(h)}</div>
                  <div style={{ fontSize: ".55rem", color: "rgba(253,230,138,.6)", marginTop: "2px" }}>Reserved</div>
                </div>
              );

              return (
                <button
                  key={h}
                  onClick={() => openModal(h)}
                  title="Click to book"
                  style={{
                    padding: "8px 4px", borderRadius: "7px", textAlign: "center",
                    background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.25)",
                    cursor: "pointer", transition: "background .15s, border-color .15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,.18)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(34,197,94,.5)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,.07)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(34,197,94,.25)";
                  }}
                >
                  <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#86efac", lineHeight: 1.2 }}>{fmt24(h)}</div>
                  <div style={{ fontSize: ".55rem", color: "rgba(134,239,172,.6)", marginTop: "2px" }}>Free</div>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {modal && user && (
        <BookingModal
          space={space}
          initial={modal}
          user={user}
          onClose={() => {
            setModal(null);
            fetchSchedule(selectedDate);
          }}
        />
      )}
    </>
  );
}
