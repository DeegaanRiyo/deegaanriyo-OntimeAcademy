"use client";

import { useState, useCallback } from "react";
import BookSpaceForm from "@/components/dashboard/BookSpaceForm";

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id:             string;
  visitor_name:   string;
  visitor_phone:  string;
  setup:          string | null;
  booking_date:   string;
  start_time:     string;
  end_time:       string | null;
  hours:          number;
  status:         string;
  notes:          string | null;
  estimated_cost: number | null;
  total_paid:     number;
  created_at:     string;
  spaces:         { id: string; name: string; slug: string } | null;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(t: string): string {
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
  return new Date(iso + "T00:00:00").toLocaleDateString("en-KE", {
    weekday: "short", day: "numeric", month: "short",
  });
}

// ─── PaymentFields ────────────────────────────────────────────────────────────

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

function PaymentModal({ booking, onClose, onDone }: {
  booking: ModalState;
  onClose: () => void;
  onDone:  () => void;
}) {
  const [amount,    setAmount]    = useState(String(booking.estimatedCost != null ? Math.max(0, booking.estimatedCost - booking.totalPaid) : ""));
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action:             "record_payment",
        amount_paid:        amt,
        payment_method:     method,
        payment_reference:  reference.trim() || null,
        visitor_name:       booking.visitorName,
        visitor_phone:      booking.visitorPhone,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed"); return; }
    onDone();
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "440px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ margin: 0, color: "var(--dark)" }}>
            <i className="fas fa-money-bill-wave" style={{ color: "var(--teal2)", marginRight: "8px" }} />Record Payment
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div style={{ background: "rgba(17,17,17,.04)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", fontSize: ".82rem", border: "1px solid rgba(17,17,17,.1)" }}>
          <div style={{ fontWeight: 700, color: "var(--dark)" }}>{booking.visitorName}</div>
          <div style={{ color: "var(--muted)" }}>{booking.visitorPhone}</div>
          <div style={{ color: "var(--muted)", fontSize: ".75rem", marginTop: "2px" }}>
            {booking.spaceName} · {booking.bookingDate} · {booking.startTime} – {booking.endTime}
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <PaymentFields
            amount={amount} setAmount={setAmount}
            method={method} setMethod={setMethod}
            reference={reference} setReference={setReference}
            estimatedCost={booking.estimatedCost} totalPaid={booking.totalPaid}
          />
          {error && <p style={{ color: "var(--red)", fontSize: ".72rem", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading
                ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }} />Processing…</>
                : <><i className="fas fa-check" style={{ marginRight: "6px" }} />Record Payment</>
              }
            </button>
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Cancel confirm ───────────────────────────────────────────────────────────

function CancelModal({ name, onConfirm, onClose, loading }: {
  name: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "380px", width: "100%", padding: "24px", gap: 0, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: "2rem", color: "#dc2626", marginBottom: "12px" }}>
          <i className="fas fa-calendar-xmark" />
        </div>
        <h3 style={{ margin: "0 0 8px", color: "var(--dark)" }}>Cancel Booking?</h3>
        <p style={{ color: "var(--muted)", fontSize: ".83rem", margin: "0 0 20px" }}>
          This will cancel <strong>{name}</strong>&apos;s booking. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onConfirm} disabled={loading}
            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", opacity: loading ? .6 : 1 }}
          >
            {loading ? "Cancelling…" : "Yes, Cancel"}
          </button>
          <button
            onClick={onClose} disabled={loading}
            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid rgba(17,17,17,.15)", background: "transparent", fontWeight: 600, fontSize: ".85rem", color: "var(--muted)", cursor: "pointer" }}
          >
            Keep Booking
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  bookings:  Booking[];
  allSpaces: { id: string; name: string; slug: string }[];
  today:     string;
}

export default function BookingsManageClient({ bookings: initial, allSpaces, today }: Props) {
  const [bookings,    setBookings]    = useState(initial);
  const [showForm,    setShowForm]    = useState(false);
  const [payModal,    setPayModal]    = useState<ModalState | null>(null);
  const [cancelModal, setCancelModal] = useState<Booking | null>(null);
  const [updating,    setUpdating]    = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [spaceFilter, setSpaceFilter] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/receptionist/bookings?status=confirmed");
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

  async function checkIn(id: string) {
    setUpdating(id);
    const res = await fetch(`/api/receptionist/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    if (res.ok) await refresh();
    setUpdating(null);
  }

  async function doCancel(b: Booking) {
    setUpdating(b.id);
    const res = await fetch(`/api/receptionist/bookings/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) setBookings((prev) => prev.filter((x) => x.id !== b.id));
    setUpdating(null);
    setCancelModal(null);
  }

  // ── Filter ───────────────────────────────────────────────────────────────

  const q = search.trim().toLowerCase();
  const displayed = bookings.filter((b) => {
    const matchSearch = !q
      || b.visitor_name.toLowerCase().includes(q)
      || b.visitor_phone.includes(q);
    const matchSpace = !spaceFilter || b.spaces?.id === spaceFilter;
    return matchSearch && matchSpace;
  });

  // ── Table styles ─────────────────────────────────────────────────────────

  const TH: React.CSSProperties = {
    padding: "9px 14px", textAlign: "left",
    fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: ".09em", color: "var(--muted)", whiteSpace: "nowrap",
    background: "rgba(17,17,17,.025)",
    borderBottom: "1px solid rgba(17,17,17,.07)",
  };
  const TD: React.CSSProperties = {
    padding: "10px 14px", verticalAlign: "middle",
  };

  function openPayModal(b: Booking) {
    const endTime = b.end_time ?? computeEnd(b.start_time, b.hours ?? 1);
    setPayModal({
      bookingId:     b.id,
      visitorName:   b.visitor_name,
      visitorPhone:  b.visitor_phone,
      estimatedCost: b.estimated_cost,
      totalPaid:     b.total_paid,
      spaceName:     b.spaces?.name ?? null,
      bookingDate:   b.booking_date,
      startTime:     fmt12(b.start_time),
      endTime:       fmt12(endTime),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Bookings</h2>
          <p>Confirmed space reservations</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ border: "none", cursor: "pointer" }}>
          <i className="fas fa-plus" style={{ marginRight: "7px" }} />New Booking
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", flex: "1 1 220px", maxWidth: "340px" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: "10px", color: "rgba(17,17,17,.28)", fontSize: ".68rem", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", height: "34px", paddingLeft: "30px", paddingRight: search ? "30px" : "10px", background: "#fff", border: "1px solid rgba(17,17,17,.12)", borderRadius: "7px", fontSize: ".78rem", color: "var(--dark)", outline: "none", boxSizing: "border-box" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "6px", background: "none", border: "none", color: "rgba(17,17,17,.3)", cursor: "pointer", fontSize: ".65rem", padding: "4px" }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        {/* Space filter */}
        {allSpaces.length > 1 && (
          <select
            value={spaceFilter}
            onChange={(e) => setSpaceFilter(e.target.value)}
            style={{ height: "34px", padding: "0 10px", background: "#fff", border: "1px solid rgba(17,17,17,.12)", borderRadius: "7px", fontSize: ".78rem", color: "var(--dark)", outline: "none", cursor: "pointer" }}
          >
            <option value="">All spaces</option>
            {allSpaces.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        {/* Count */}
        <span style={{ fontSize: ".75rem", color: "var(--muted)", marginLeft: "auto" }}>
          {displayed.length} booking{displayed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Spreadsheet ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {displayed.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className="fas fa-calendar-check" style={{ fontSize: "1.8rem", opacity: .18, display: "block", marginBottom: "12px" }} />
            {search || spaceFilter
              ? "No bookings match your filters"
              : "No confirmed bookings upcoming"
            }
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Client</th>
                  <th style={TH}>Space</th>
                  <th style={TH}>Date</th>
                  <th style={TH}>Time</th>
                  <th style={TH}>Duration</th>
                  <th style={TH}>Est. Cost</th>
                  <th style={TH}>Payment</th>
                  <th style={TH}>Notes</th>
                  <th style={{ ...TH, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((b, idx) => {
                  const endTime    = b.end_time ?? computeEnd(b.start_time, b.hours ?? 1);
                  const outstanding = b.estimated_cost !== null ? b.estimated_cost - b.total_paid : null;
                  const isToday     = b.booking_date === today;
                  const isBusy      = updating === b.id;

                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: "1px solid rgba(17,17,17,.055)",
                        background: isToday ? "rgba(193,68,14,.025)" : idx % 2 === 0 ? "#fff" : "rgba(17,17,17,.012)",
                      }}
                    >
                      {/* Client */}
                      <td style={TD}>
                        <div style={{ fontWeight: 700, fontSize: ".83rem", color: "var(--dark)" }}>
                          {isToday && (
                            <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#E8490F", marginRight: "6px", verticalAlign: "middle", boxShadow: "0 0 0 2px rgba(232,73,15,.2)" }} />
                          )}
                          {b.visitor_name}
                        </div>
                        <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "1px" }}>{b.visitor_phone}</div>
                      </td>

                      {/* Space */}
                      <td style={TD}>
                        {b.spaces ? (
                          <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--teal2)", background: "rgba(193,68,14,.07)", border: "1px solid rgba(193,68,14,.18)", borderRadius: "5px", padding: "3px 9px", whiteSpace: "nowrap" }}>
                            {b.spaces.name}
                          </span>
                        ) : <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>—</span>}
                      </td>

                      {/* Date */}
                      <td style={TD}>
                        <div style={{ fontSize: ".82rem", fontWeight: isToday ? 700 : 600, color: isToday ? "#E8490F" : "var(--dark)", whiteSpace: "nowrap" }}>
                          {fmtDate(b.booking_date, today)}
                        </div>
                        <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "1px", whiteSpace: "nowrap" }}>
                          {new Date(b.booking_date + "T12:00:00").toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </td>

                      {/* Time */}
                      <td style={{ ...TD, whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: ".8rem", color: "var(--dark)" }}>
                          {fmt12(b.start_time)}
                        </div>
                        <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: "1px" }}>
                          – {fmt12(endTime)}
                        </div>
                      </td>

                      {/* Duration */}
                      <td style={{ ...TD, whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: ".8rem", color: "var(--dark)" }}>
                          {b.hours} hr{b.hours !== 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* Est. Cost */}
                      <td style={{ ...TD, whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--dark)" }}>
                          {b.estimated_cost !== null ? `KES ${b.estimated_cost.toLocaleString()}` : "—"}
                        </span>
                      </td>

                      {/* Payment */}
                      <td style={TD}>
                        {b.total_paid > 0 ? (
                          <div>
                            <span style={{ fontSize: ".72rem", fontWeight: 600, color: "#16a34a" }}>
                              <i className="fas fa-check-circle" style={{ marginRight: "4px" }} />
                              KES {b.total_paid.toLocaleString()}
                            </span>
                            {outstanding !== null && outstanding > 0 && (
                              <div style={{ fontSize: ".65rem", color: "#b45309", marginTop: "2px", fontWeight: 600 }}>
                                KES {outstanding.toLocaleString()} due
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td style={{ ...TD, maxWidth: "180px" }}>
                        {b.notes ? (
                          <span style={{ fontSize: ".72rem", color: "var(--muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {b.notes}
                          </span>
                        ) : <span style={{ color: "rgba(17,17,17,.2)", fontSize: ".72rem" }}>—</span>}
                      </td>

                      {/* Actions */}
                      <td style={{ ...TD, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "nowrap" }}>

                          {/* Record Payment */}
                          {outstanding !== null && outstanding > 0 && (
                            <button
                              onClick={() => openPayModal(b)}
                              disabled={isBusy}
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, whiteSpace: "nowrap", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? .5 : 1, background: "rgba(180,131,9,.08)", border: "1px solid rgba(180,131,9,.3)", color: "#b45309" }}
                            >
                              <i className="fas fa-plus-circle" /> Payment
                            </button>
                          )}

                          {/* Check In */}
                          {isToday && (
                            <button
                              onClick={() => checkIn(b.id)}
                              disabled={isBusy}
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, whiteSpace: "nowrap", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? .5 : 1, background: "rgba(22,163,74,.08)", border: "1px solid rgba(22,163,74,.3)", color: "#16a34a" }}
                            >
                              <i className={isBusy ? "fas fa-spinner fa-spin" : "fas fa-play"} /> Check In
                            </button>
                          )}

                          {/* Cancel */}
                          <button
                            onClick={() => setCancelModal(b)}
                            disabled={isBusy}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, whiteSpace: "nowrap", cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? .5 : 1, background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.25)", color: "#dc2626" }}
                          >
                            <i className="fas fa-ban" /> Cancel
                          </button>

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

      {/* ── Modals ──────────────────────────────────────────────── */}
      {showForm && (
        <BookSpaceForm
          spaces={allSpaces}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refresh(); }}
        />
      )}
      {payModal && (
        <PaymentModal
          booking={payModal}
          onClose={() => setPayModal(null)}
          onDone={refresh}
        />
      )}
      {cancelModal && (
        <CancelModal
          name={cancelModal.visitor_name}
          loading={updating === cancelModal.id}
          onConfirm={() => doCancel(cancelModal)}
          onClose={() => setCancelModal(null)}
        />
      )}
    </div>
  );
}
