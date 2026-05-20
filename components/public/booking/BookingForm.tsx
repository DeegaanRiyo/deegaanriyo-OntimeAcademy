"use client";

import { useState } from "react";
import type { Space } from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const WA_NUMBER = "254746628668";

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}
function maxISO() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

const PURPOSE_OPTIONS = [
  { value: "meeting",    label: "Meeting / Boardroom session"  },
  { value: "training",   label: "Training / Workshop"          },
  { value: "podcast",    label: "Podcast / Audio recording"    },
  { value: "content",    label: "Content creation / Photoshoot"},
  { value: "conference", label: "Conference / Seminar"         },
  { value: "interview",  label: "Interview / HR session"       },
  { value: "other",      label: "Other"                        },
];

const HOUR_OPTIONS = [1,2,3,4,5,6,7,8,9].map((n) => ({
  value: n,
  label: n === 9 ? "Full Day" : `${n} hr${n !== 1 ? "s" : ""}`,
}));

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

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function computeEndLabel(startTime: string, hours: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const mins   = h * 60 + m + (hours === 9 ? 8 : hours) * 60;
  const endH   = Math.floor(mins / 60) % 24;
  const endM   = mins % 60;
  return fmt12(`${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "#fff", border: "1px solid rgba(17,17,17,.15)",
  borderRadius: "7px", padding: "7px 10px",
  color: "#111", fontSize: ".83rem", outline: "none", fontFamily: "inherit",
};
const LBL: React.CSSProperties = {
  display: "block", fontSize: ".62rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".08em",
  color: "#6b7280", marginBottom: "4px",
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  space: Space;
}

export default function BookingForm({ space }: Props) {
  const [form, setForm] = useState({
    full_name:    "",
    phone:        "",
    email:        "",
    booking_date: todayISO(),
    start_time:   "08:00",
    hours:        1,
    attendees:    1,
    purpose:      "meeting",
    notes:        "",
  });
  const [showNotes, setShowNotes] = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const estimatedCost = space.hourly_rate > 0
    ? space.hourly_rate * (form.hours === 9 ? 8 : Number(form.hours))
    : null;

  const endLabel = computeEndLabel(form.start_time, Number(form.hours));

  function buildMessage(): string {
    const purposeLabel = PURPOSE_OPTIONS.find((p) => p.value === form.purpose)?.label ?? form.purpose;
    const dateStr = new Date(form.booking_date + "T12:00:00").toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const durationLabel = form.hours === 9 ? "Full Day (8 hrs)" : `${form.hours} hr${Number(form.hours) !== 1 ? "s" : ""}`;

    const lines = [
      `Hi, I'd like to book the *${space.name}* at Ontime Academy & Co-working Space.`,
      ``,
      `📅 *Date:* ${dateStr}`,
      `🕐 *Time:* ${fmt12(form.start_time)} – ${endLabel}`,
      `⏱ *Duration:* ${durationLabel}`,
      `👥 *Attendees:* ${form.attendees}`,
      `📌 *Purpose:* ${purposeLabel}`,
      ...(estimatedCost !== null ? [`💰 *Est. Cost:* KES ${estimatedCost.toLocaleString()}`] : []),
      ``,
      `*My Details:*`,
      `👤 ${form.full_name}`,
      `📞 ${form.phone}`,
      ...(form.email.trim() ? [`📧 ${form.email.trim()}`] : []),
      ...(form.notes.trim() ? [``, `📝 ${form.notes.trim()}`] : []),
    ];
    return lines.join("\n");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.full_name.trim()) { setError("Please enter your full name.");   return; }
    if (!form.phone.trim())     { setError("Please enter your phone number."); return; }
    if (!form.booking_date)     { setError("Please select a date.");           return; }

    const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildMessage())}`;
    window.open(waURL, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "32px 8px" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(37,211,102,.1)", border: "1px solid rgba(37,211,102,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: "1.4rem", color: "#25D366",
        }}>
          <i className="fab fa-whatsapp" />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 800, color: "#111" }}>
          WhatsApp opened!
        </h3>
        <p style={{ margin: "0 0 6px", fontSize: ".82rem", color: "#374151", lineHeight: 1.6 }}>
          Your booking details have been pre-filled.
        </p>
        <p style={{ margin: "0 0 20px", fontSize: ".78rem", color: "#6b7280", lineHeight: 1.6 }}>
          Simply press <strong>Send</strong> in WhatsApp — our team will confirm your booking shortly.
        </p>
        <button
          onClick={() => { setSent(false); setError(null); }}
          style={{ background: "none", border: "none", color: "#C1440E", fontSize: ".82rem", fontWeight: 700, cursor: "pointer" }}
        >
          Make another booking
        </button>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* Name + Phone */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <label style={LBL}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            value={form.full_name} onChange={set("full_name")}
            placeholder="Jane Mwangi" style={INP} required
          />
        </div>
        <div>
          <label style={LBL}>Phone <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            type="tel" value={form.phone} onChange={set("phone")}
            placeholder="07XX XXX XXX" style={INP} required
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label style={LBL}>
          Email{" "}
          <span style={{ color: "#6b7280", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
            (optional)
          </span>
        </label>
        <input
          type="email" value={form.email} onChange={set("email")}
          placeholder="jane@email.com" style={INP}
        />
      </div>

      {/* Date + Start time */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <label style={LBL}>Date <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            type="date" min={todayISO()} max={maxISO()}
            value={form.booking_date} onChange={set("booking_date")}
            style={INP} required
          />
        </div>
        <div>
          <label style={LBL}>Start Time <span style={{ color: "#ef4444" }}>*</span></label>
          <select value={form.start_time} onChange={set("start_time")} style={INP}>
            {TIME_SLOTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration + Attendees */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <label style={LBL}>Duration <span style={{ color: "#ef4444" }}>*</span></label>
          <select
            value={form.hours}
            onChange={(e) => setForm((p) => ({ ...p, hours: Number(e.target.value) }))}
            style={INP}
          >
            {HOUR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={LBL}>Attendees <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            type="number" min={1} max={50}
            value={form.attendees}
            onChange={(e) => setForm((p) => ({ ...p, attendees: Number(e.target.value) }))}
            style={INP}
          />
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label style={LBL}>Purpose <span style={{ color: "#ef4444" }}>*</span></label>
        <select value={form.purpose} onChange={set("purpose")} style={INP}>
          {PURPOSE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Time preview */}
      <div style={{
        background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.1)",
        borderRadius: "7px", padding: "8px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: ".78rem",
      }}>
        <span style={{ color: "#6b7280" }}>Session time</span>
        <span style={{ fontWeight: 700, color: "#111" }}>
          {fmt12(form.start_time)} – {endLabel}
        </span>
      </div>

      {/* Notes — collapsible */}
      {showNotes ? (
        <div>
          <label style={LBL}>
            Notes{" "}
            <span style={{ opacity: .45, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              (optional)
            </span>
          </label>
          <textarea
            rows={2} value={form.notes} onChange={set("notes")}
            placeholder="Any special setup or requirements..."
            style={{ ...INP, resize: "none" }}
            autoFocus
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

      {/* Error */}
      {error && (
        <p style={{ color: "#ef4444", fontSize: ".75rem", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
          <i className="fas fa-circle-exclamation" /> {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        style={{
          width: "100%", padding: "11px 14px", borderRadius: "8px", border: "none",
          background: "linear-gradient(135deg,#25D366,#128C7E)",
          color: "#fff", fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}
      >
        <i className="fab fa-whatsapp" style={{ fontSize: "1rem" }} />
        Book via WhatsApp
      </button>

      <p style={{ margin: 0, fontSize: ".65rem", color: "#9ca3af", textAlign: "center" }}>
        Opens WhatsApp with your details pre-filled — no account needed.
      </p>
    </form>
  );
}
