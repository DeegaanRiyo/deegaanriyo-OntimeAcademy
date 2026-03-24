"use client";

import { useState } from "react";
import Link from "next/link";
import BookSpaceForm from "@/components/dashboard/BookSpaceForm";

type Props = {
  activeCount:    number;
  pendingCount:   number;
  todayCount:     number;
  confirmedCount: number;
  todayRevenue:   number;
  memberCount:    number;
  studentCount:   number;
  allSpaces:      { id: string; name: string; slug: string }[];
  today:          string;
  nowTime:        string;
};

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function ReceptionistDashboardClient({
  activeCount,
  pendingCount,
  todayCount,
  confirmedCount,
  todayRevenue,
  memberCount,
  studentCount,
  allSpaces,
  today,
  nowTime,
}: Props) {
  const [showBookForm, setShowBookForm] = useState(false);

  const greeting = (() => {
    const h = parseInt(nowTime.split(":")[0], 10);
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const dateLabel = new Date(today + "T00:00:00").toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const stats = [
    {
      label: "Pending",
      value: pendingCount,
      icon: "fa-clock",
      color: "#d97706",
      bg: "rgba(217,119,6,.08)",
      border: "rgba(217,119,6,.22)",
      href: "/dashboard/receptionist/bookings",
      note: "awaiting confirmation",
    },
    {
      label: "Confirmed",
      value: confirmedCount,
      icon: "fa-calendar-check",
      color: "#2563eb",
      bg: "rgba(37,99,235,.08)",
      border: "rgba(37,99,235,.22)",
      href: "/dashboard/receptionist/bookings",
      note: "upcoming sessions",
    },
    {
      label: "Active Now",
      value: activeCount,
      icon: "fa-circle-dot",
      color: "#16a34a",
      bg: "rgba(22,163,74,.08)",
      border: "rgba(22,163,74,.22)",
      href: "/dashboard/receptionist/bookings",
      note: "in progress",
    },
    {
      label: "Today's Bookings",
      value: todayCount,
      icon: "fa-calendar-day",
      color: "#0891b2",
      bg: "rgba(8,145,178,.08)",
      border: "rgba(8,145,178,.22)",
      href: "/dashboard/receptionist/bookings",
      note: "total today",
    },
    {
      label: "Revenue Today",
      value: `KES ${todayRevenue.toLocaleString()}`,
      icon: "fa-coins",
      color: "var(--teal2)",
      bg: "rgba(15,179,187,.08)",
      border: "rgba(15,179,187,.22)",
      href: null,
      note: "walk-in payments",
    },
    {
      label: "Members",
      value: memberCount,
      icon: "fa-id-card",
      color: "#7c3aed",
      bg: "rgba(124,58,237,.08)",
      border: "rgba(124,58,237,.22)",
      href: "/dashboard/receptionist/members",
      note: "active memberships",
    },
    {
      label: "Students",
      value: studentCount,
      icon: "fa-user-graduate",
      color: "#db2777",
      bg: "rgba(219,39,119,.08)",
      border: "rgba(219,39,119,.22)",
      href: "/dashboard/receptionist/students",
      note: "physical class",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontSize: ".7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: "4px" }}>
            {dateLabel}
          </div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "var(--dark)" }}>
            {greeting} 👋
          </h2>
          <div style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: "3px" }}>
            Current time: <strong style={{ color: "var(--dark)" }}>{fmt12(nowTime)}</strong>
          </div>
        </div>

        <button
          onClick={() => setShowBookForm(true)}
          className="btn-primary"
          style={{ border: "none", cursor: "pointer", fontSize: ".82rem" }}
        >
          <i className="fas fa-calendar-plus" style={{ marginRight: "7px" }} />
          New Booking
        </button>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
        {stats.map((s) => {
          const inner = (
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: "12px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "transform .15s, box-shadow .15s",
              cursor: s.href ? "pointer" : "default",
            }}
              onMouseEnter={(e) => { if (s.href) { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,.07)"; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>
                  {s.label}
                </span>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px",
                  background: s.bg, border: `1px solid ${s.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: ".8rem" }} />
                </div>
              </div>
              <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "var(--dark)", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: ".68rem", color: "var(--muted)", lineHeight: 1.3 }}>
                {s.note}
                {s.href && (
                  <span style={{ color: s.color, marginLeft: "4px", fontWeight: 600 }}>→</span>
                )}
              </div>
            </div>
          );

          return s.href ? (
            <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
              {inner}
            </Link>
          ) : (
            <div key={s.label}>{inner}</div>
          );
        })}
      </div>

      {/* ── Quick Links ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "14px" }}>
          Quick Access
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            { href: "/dashboard/receptionist/bookings", icon: "fa-calendar-alt",  label: "Bookings",       color: "#2563eb" },
            { href: "/dashboard/receptionist/students", icon: "fa-user-graduate", label: "Students",       color: "#db2777" },
            { href: "/dashboard/receptionist/members",  icon: "fa-id-card",       label: "Members",        color: "#7c3aed" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
                fontSize: ".78rem", fontWeight: 600,
                background: "rgba(17,17,17,.04)",
                border: "1px solid rgba(17,17,17,.1)",
                color: "var(--dark)",
                transition: "background .15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(17,17,17,.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(17,17,17,.04)"; }}
            >
              <i className={`fas ${l.icon}`} style={{ color: l.color, fontSize: ".8rem" }} />
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Book Space Modal */}
      {showBookForm && allSpaces.length > 0 && (
        <BookSpaceForm
          spaces={allSpaces}
          onClose={() => setShowBookForm(false)}
        />
      )}
    </div>
  );
}
