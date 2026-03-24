"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BookSpaceForm from "@/components/dashboard/BookSpaceForm";

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
  created_at: string;
};

type Space = {
  id: string;
  name: string;
  slug: string;
  is_available: boolean;
  hourly_rate: number;
  description: string | null;
};

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function computeEndTime(startTime: string, hours: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function getEATTime(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "#eab308",
  confirmed: "#3b82f6",
  active:    "#22c55e",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

const TIMELINE_START = 7;
const TIMELINE_END   = 22;
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;

// ─── Payment confirmation modal ───────────────────────────────────────────────
type ConfirmModalState = {
  bookingId:     string;
  visitorName:   string;
  visitorPhone:  string;
  estimatedCost: number | null;
  bookingDate:   string;
  startTime:     string;
  hours:         number;
};

function ConfirmPaymentModal({
  booking,
  onClose,
  onConfirmed,
}: {
  booking: ConfirmModalState;
  onClose: () => void;
  onConfirmed: (bookingId: string) => void;
}) {
  const [amount,    setAmount]    = useState(String(booking.estimatedCost ?? ""));
  const [method,    setMethod]    = useState<"cash" | "bank_transfer">("cash");
  const [reference, setReference] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError("Enter a valid payment amount."); return; }
    setError(null); setLoading(true);

    const res = await fetch(`/api/receptionist/bookings/${booking.bookingId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:            "confirmed",
        amount_paid:       amt,
        payment_method:    method,
        payment_reference: reference.trim() || null,
        visitor_name:      booking.visitorName,
        visitor_phone:     booking.visitorPhone,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed"); return; }
    onConfirmed(booking.bookingId);
    onClose();
  }

  const end = computeEndTime(booking.startTime, booking.hours);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }}
      onClick={onClose}
    >
      <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ margin: 0 }}>
            <i className="fas fa-money-bill-wave" style={{ color: "var(--green)", marginRight: "8px" }} />
            Confirm & Record Payment
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div style={{ background: "var(--dark3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "18px", fontSize: ".82rem" }}>
          <div style={{ fontWeight: 700, color: "var(--white)" }}>{booking.visitorName}</div>
          <div style={{ color: "var(--muted)" }}>{booking.visitorPhone}</div>
          <div style={{ color: "var(--teal2)", marginTop: "4px", fontSize: ".75rem" }}>
            {fmtDate(booking.bookingDate)} · {fmt12(booking.startTime)} → {fmt12(end)} ({booking.hours} hr{booking.hours !== 1 ? "s" : ""})
          </div>
          {booking.estimatedCost !== null && (
            <div style={{ color: "rgba(234,179,8,.9)", marginTop: "2px", fontSize: ".72rem" }}>
              Estimated: KES {booking.estimatedCost.toLocaleString()}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
              Amount Paid (KES) <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input type="number" className="form-input" placeholder="e.g. 2500" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "5px" }}>
              Payment Method <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["cash", "bank_transfer"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)} style={{
                  flex: 1, padding: "9px 8px", borderRadius: "8px", cursor: "pointer",
                  fontWeight: 700, fontSize: ".78rem",
                  background: method === m ? "rgba(34,197,94,.15)" : "var(--dark3)",
                  border: method === m ? "1px solid rgba(34,197,94,.5)" : "1px solid var(--border)",
                  color: method === m ? "var(--green)" : "var(--muted)",
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
                Transfer Reference <span style={{ opacity: .5, fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="text" className="form-input" placeholder="e.g. TXN12345" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          )}
          {error && <p style={{ color: "var(--red)", fontSize: ".72rem", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? <><span className="spinner" /> Processing…</> : <><i className="fas fa-check" /> Confirm & Save Payment</>}
            </button>
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Labeled action button ────────────────────────────────────────────────────
function ActionBtn({
  label, icon, onClick, disabled, variant = "default",
}: {
  label: string; icon: string; onClick: () => void; disabled: boolean;
  variant?: "green" | "blue" | "red" | "gold" | "default";
}) {
  const colors: Record<string, { bg: string; border: string; color: string }> = {
    green:   { bg: "rgba(34,197,94,.1)",   border: "rgba(34,197,94,.35)",   color: "var(--green)" },
    blue:    { bg: "rgba(59,130,246,.1)",   border: "rgba(59,130,246,.35)",  color: "var(--blue)"  },
    red:     { bg: "rgba(239,68,68,.1)",    border: "rgba(239,68,68,.35)",   color: "var(--red)"   },
    gold:    { bg: "rgba(234,179,8,.1)",    border: "rgba(234,179,8,.35)",   color: "var(--gold2)" },
    default: { bg: "var(--dark3)",          border: "var(--border)",         color: "var(--muted)" },
  };
  const c = colors[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "5px 11px", borderRadius: "7px", cursor: disabled ? "not-allowed" : "pointer",
        fontSize: ".74rem", fontWeight: 600, whiteSpace: "nowrap",
        background: c.bg, border: `1px solid ${c.border}`, color: c.color,
        opacity: disabled ? .55 : 1,
      }}
    >
      <i className={`fas ${disabled ? "fa-spinner fa-spin" : icon}`} />
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  space: Space;
  todayBookings: Booking[];
  allSpaces: { id: string; name: string; slug: string }[];
  today: string;
  basePath: string;
}

export default function SpaceDetailClient({ space, todayBookings, allSpaces, today, basePath }: Props) {
  const router  = useRouter();
  const [bookings,     setBookings]     = useState<Booking[]>(todayBookings);
  const [showForm,     setShowForm]     = useState(false);
  const [updating,     setUpdating]     = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const nowTime = getEATTime();

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const res = await fetch(`/api/receptionist/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      router.refresh();
    }
    setUpdating(null);
  }

  async function deleteBooking(id: string) {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    setUpdating(id);
    const res = await fetch(`/api/receptionist/bookings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
      router.refresh();
    }
    setUpdating(null);
  }

  function timeToPercent(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return Math.max(0, Math.min(100, ((h + m / 60 - TIMELINE_START) / TIMELINE_HOURS) * 100));
  }

  const nowPercent     = timeToPercent(nowTime);
  const pendingList    = bookings.filter((b) => b.status === "pending");
  const activeBookings = bookings.filter((b) => ["confirmed", "active"].includes(b.status));
  const doneBookings   = bookings.filter((b) => ["completed", "cancelled"].includes(b.status));

  return (
    <div>
      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <Link href={`${basePath}/spaces`} style={{ color: "var(--muted)", fontSize: ".8rem", textDecoration: "none" }}>
            ← Spaces
          </Link>
          <h2 style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
            {space.name}
            <span style={{
              padding: "3px 10px", borderRadius: "20px", fontSize: ".65rem", fontWeight: 700,
              background: space.is_available ? "rgba(34,197,94,.12)" : "rgba(107,114,128,.12)",
              color: space.is_available ? "#86efac" : "#9ca3af",
              border: `1px solid ${space.is_available ? "rgba(34,197,94,.3)" : "rgba(107,114,128,.3)"}`,
            }}>
              {space.is_available ? "OPEN" : "CLOSED"}
            </span>
            {pendingList.length > 0 && (
              <span style={{
                padding: "3px 10px", borderRadius: "20px", fontSize: ".65rem", fontWeight: 700,
                background: "rgba(234,179,8,.12)", color: "var(--gold2)",
                border: "1px solid rgba(234,179,8,.35)",
              }}>
                {pendingList.length} pending
              </span>
            )}
          </h2>
          <p>Schedule for {new Date(today + "T00:00:00").toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ border: "none", cursor: "pointer" }} disabled={!space.is_available}>
          <i className="fas fa-plus" style={{ marginRight: "7px" }} />Book Now
        </button>
      </div>

      {/* ── Pending Requests ─────────────────────────────────────────────── */}
      {pendingList.length > 0 && (
        <div className="card" style={{ marginBottom: "20px", borderColor: "rgba(234,179,8,.3)" }}>
          <div className="card-head">
            <h3 style={{ color: "var(--gold2)" }}>
              <i className="fas fa-clock" style={{ marginRight: "8px" }} />
              Pending Requests
            </h3>
            <span style={{ fontSize: ".72rem", color: "var(--gold2)", opacity: .8 }}>
              {pendingList.length} awaiting confirmation
            </span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Est. Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((b) => {
                  const end = b.end_time ?? computeEndTime(b.start_time, b.hours ?? 1);
                  const isUpdating = updating === b.id;
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.visitor_name}</div>
                        <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>{b.visitor_phone}</div>
                      </td>
                      <td style={{ fontSize: ".82rem" }}>{fmtDate(b.booking_date)}</td>
                      <td style={{ fontSize: ".82rem" }}>{fmt12(b.start_time)} → {fmt12(end)}</td>
                      <td style={{ fontSize: ".82rem", color: "var(--teal2)", fontWeight: 600 }}>
                        {b.estimated_cost !== null ? `KES ${b.estimated_cost.toLocaleString()}` : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <ActionBtn
                            label="Confirm & Pay"
                            icon="fa-check"
                            variant="blue"
                            disabled={isUpdating}
                            onClick={() => setConfirmModal({
                              bookingId:     b.id,
                              visitorName:   b.visitor_name,
                              visitorPhone:  b.visitor_phone,
                              estimatedCost: b.estimated_cost,
                              bookingDate:   b.booking_date,
                              startTime:     b.start_time,
                              hours:         b.hours ?? 1,
                            })}
                          />
                          <ActionBtn label="Reject" icon="fa-times" variant="red" disabled={isUpdating} onClick={() => updateStatus(b.id, "rejected")} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-head">
          <h3><i className="fas fa-clock" /> Today&apos;s Timeline</h3>
          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>7:00 AM – 10:00 PM · Now: {fmt12(nowTime)}</span>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {Array.from({ length: TIMELINE_HOURS + 1 }, (_, i) => {
                const h = TIMELINE_START + i;
                return (
                  <span key={h} style={{ fontSize: ".62rem", color: "var(--muted)", transform: "translateX(-50%)" }}>
                    {h % 12 || 12}{h < 12 ? "am" : "pm"}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ position: "relative", height: "56px", background: "var(--dark3)", borderRadius: "8px", border: "1px solid var(--border)", overflow: "visible" }}>
            {Array.from({ length: TIMELINE_HOURS - 1 }, (_, i) => (
              <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${((i + 1) / TIMELINE_HOURS) * 100}%`, width: "1px", background: "var(--border)", opacity: .5 }} />
            ))}
            {activeBookings.map((b) => {
              const end   = b.end_time ?? computeEndTime(b.start_time, b.hours ?? 1);
              const left  = timeToPercent(b.start_time);
              const width = timeToPercent(end) - left;
              const isNow = b.start_time <= nowTime && end > nowTime;
              if (width <= 0) return null;
              return (
                <div key={b.id} title={`${b.visitor_name} · ${fmt12(b.start_time)} – ${fmt12(end)}`} style={{
                  position: "absolute", top: "6px", height: "44px",
                  left: `${left}%`, width: `${Math.max(width, 1)}%`,
                  background: isNow ? "linear-gradient(135deg,#16a34a,#22c55e)" : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                  borderRadius: "6px", display: "flex", alignItems: "center",
                  padding: "0 8px", overflow: "hidden",
                  boxShadow: isNow ? "0 0 10px rgba(34,197,94,.4)" : undefined,
                }}>
                  <div style={{ fontSize: ".68rem", color: "#fff", lineHeight: 1.3, overflow: "hidden" }}>
                    <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.visitor_name}</div>
                    {b.setup && <div style={{ opacity: .85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.setup}</div>}
                  </div>
                </div>
              );
            })}
            {nowPercent >= 0 && nowPercent <= 100 && (
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${nowPercent}%`, width: "2px", background: "var(--gold2)", zIndex: 10 }}>
                <div style={{ position: "absolute", top: "-16px", left: "50%", transform: "translateX(-50%)", background: "var(--gold2)", color: "var(--dark)", fontSize: ".58rem", fontWeight: 700, padding: "1px 4px", borderRadius: "3px", whiteSpace: "nowrap" }}>NOW</div>
              </div>
            )}
          </div>
          {activeBookings.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", fontSize: ".82rem", marginTop: "16px" }}>No confirmed bookings today</div>
          )}
        </div>
      </div>

      {/* ── Today's Bookings ─────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-head">
          <h3><i className="fas fa-list" /> Today&apos;s Bookings</h3>
          <span className="badge tl">{activeBookings.length} confirmed/active</span>
        </div>
        {activeBookings.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            No confirmed bookings for today. Click &quot;Book Now&quot; to add one.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Client</th><th>Setup</th><th>Time</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {activeBookings.map((b) => {
                  const end     = b.end_time ?? computeEndTime(b.start_time, b.hours ?? 1);
                  const isNow   = b.start_time <= nowTime && end > nowTime;
                  const isUpd   = updating === b.id;
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.visitor_name}</div>
                        <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>{b.visitor_phone}</div>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: ".82rem" }}>{b.setup ?? "—"}</td>
                      <td>
                        <div style={{ fontSize: ".82rem", fontWeight: 600 }}>{fmt12(b.start_time)} → {fmt12(end)}</div>
                        {isNow && <div style={{ fontSize: ".7rem", color: "var(--green)", marginTop: "2px" }}><i className="fas fa-circle" style={{ fontSize: ".5rem", marginRight: "4px" }} />In progress</div>}
                      </td>
                      <td>
                        <span className="badge" style={{ background: `${STATUS_COLORS[b.status]}22`, color: STATUS_COLORS[b.status], border: `1px solid ${STATUS_COLORS[b.status]}44` }}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {b.status === "confirmed" && (
                            <ActionBtn label="Check In" icon="fa-play" variant="green" disabled={isUpd} onClick={() => updateStatus(b.id, "active")} />
                          )}
                          {b.status === "active" && (
                            <ActionBtn label="End Session" icon="fa-flag-checkered" variant="blue" disabled={isUpd} onClick={() => updateStatus(b.id, "completed")} />
                          )}
                          {["confirmed", "active"].includes(b.status) && (
                            <ActionBtn label="Cancel" icon="fa-times" variant="red" disabled={isUpd} onClick={() => updateStatus(b.id, "cancelled")} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Completed / Cancelled ─────────────────────────────────────────── */}
      {doneBookings.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h3 style={{ color: "var(--muted)" }}><i className="fas fa-history" /> Completed / Cancelled Today</h3>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Client</th><th>Time</th><th>Setup</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {doneBookings.map((b) => {
                  const end = b.end_time ?? computeEndTime(b.start_time, b.hours ?? 1);
                  return (
                    <tr key={b.id} style={{ opacity: .6 }}>
                      <td style={{ fontWeight: 600 }}>{b.visitor_name}</td>
                      <td style={{ fontSize: ".82rem" }}>{fmt12(b.start_time)} → {fmt12(end)}</td>
                      <td style={{ fontSize: ".82rem", color: "var(--muted)" }}>{b.setup ?? "—"}</td>
                      <td>
                        <span className="badge" style={{ background: `${STATUS_COLORS[b.status]}22`, color: STATUS_COLORS[b.status], border: `1px solid ${STATUS_COLORS[b.status]}44` }}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <ActionBtn label="Delete" icon="fa-trash" variant="red" disabled={updating === b.id} onClick={() => deleteBooking(b.id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <BookSpaceForm
          spaces={allSpaces}
          defaultSpaceId={space.id}
          defaultDate={today}
          onClose={() => setShowForm(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {confirmModal && (
        <ConfirmPaymentModal
          booking={confirmModal}
          onClose={() => setConfirmModal(null)}
          onConfirmed={(id) => setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "confirmed" } : b))}
        />
      )}
    </div>
  );
}
