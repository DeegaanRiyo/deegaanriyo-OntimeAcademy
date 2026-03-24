"use client";

import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhysicalStudent = {
  id:           string;
  name:         string;
  phone:        string;
  class_name:   string;
  total_paid:   number;
  method:       string;
  payment_date: string;
};

export type OnlineStudent = {
  id:         string;
  full_name:  string | null;
  email:      string | null;
  created_at: string;
  enrolments: {
    course_id:       string;
    course_title:    string;
    course_mode:     string;
    enrolled_at:     string;
    last_accessed_at: string | null;
  }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = { cash: "Cash", bank_transfer: "Bank Transfer" };

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string | null) {
  const n = name || "?";
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Physical tab ─────────────────────────────────────────────────────────────

function PhysicalView({ students }: { students: PhysicalStudent[] }) {
  const grouped: Record<string, PhysicalStudent[]> = {};
  for (const s of students) {
    const key = s.class_name || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const classes = Object.keys(grouped).sort();

  if (students.length === 0) {
    return (
      <div className="card">
        <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
          <i className="fas fa-chalkboard" style={{ fontSize: "1.8rem", opacity: .2, display: "block", marginBottom: "12px" }} />
          No physical class students recorded
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {classes.map((cls) => (
        <div key={cls} className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            padding: "10px 16px", borderBottom: "2px solid var(--teal2)",
            display: "flex", alignItems: "center", gap: "8px", background: "#fafafa",
          }}>
            <i className="fas fa-chalkboard-teacher" style={{ color: "var(--teal2)", fontSize: ".85rem" }} />
            <span style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--dark)" }}>{cls}</span>
            <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
              {grouped[cls].length} student{grouped[cls].length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(17,17,17,.03)", borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  {["Student", "Phone", "Amount Paid", "Method", "Registered"].map((h) => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped[cls].map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <div style={{
                          width: "30px", height: "30px", borderRadius: "50%",
                          background: "linear-gradient(135deg,var(--teal),var(--teal2))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: ".6rem", fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {initials(s.name)}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".78rem", color: "var(--muted)" }}>{s.phone}</td>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle", fontWeight: 700, color: "var(--dark)" }}>KES {s.total_paid.toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".78rem", color: "var(--muted)" }}>{METHOD_LABELS[s.method] ?? s.method}</td>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".75rem", color: "var(--muted)" }}>{fmtDate(s.payment_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Online tab ───────────────────────────────────────────────────────────────

function OnlineView({ students }: { students: OnlineStudent[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (students.length === 0) {
    return (
      <div className="card">
        <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
          <i className="fas fa-laptop" style={{ fontSize: "1.8rem", opacity: .2, display: "block", marginBottom: "12px" }} />
          No online students yet
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(17,17,17,.03)", borderBottom: "1px solid rgba(17,17,17,.08)" }}>
              {["Student", "Enrolments", "Joined", ""].map((h, i) => (
                <th key={i} style={{ padding: "8px 14px", textAlign: "left", fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const isOpen = expanded.has(s.id);
              return (
                <React.Fragment key={s.id}>
                  <tr style={{ borderBottom: "1px solid rgba(17,17,17,.06)", cursor: s.enrolments.length > 0 ? "pointer" : undefined }}
                      onClick={() => s.enrolments.length > 0 && toggle(s.id)}>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <div style={{
                          width: "30px", height: "30px", borderRadius: "50%",
                          background: "linear-gradient(135deg,#3b82f6,#60a5fa)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: ".6rem", fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {initials(s.full_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>{s.full_name || "—"}</div>
                          {s.email && <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{s.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                      {s.enrolments.length === 0
                        ? <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>No courses</span>
                        : <span style={{ fontSize: ".78rem", fontWeight: 600, color: "#2563eb" }}>{s.enrolments.length} course{s.enrolments.length !== 1 ? "s" : ""}</span>}
                    </td>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".75rem", color: "var(--muted)" }}>{fmtDate(s.created_at)}</td>
                    <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                      {s.enrolments.length > 0 && (
                        <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: ".7rem", color: "var(--muted)" }} />
                      )}
                    </td>
                  </tr>
                  {isOpen && s.enrolments.map((e) => (
                    <tr key={e.course_id} style={{ background: "rgba(59,130,246,.03)", borderBottom: "1px solid rgba(17,17,17,.04)" }}>
                      <td style={{ padding: "8px 14px 8px 52px" }} colSpan={1}>
                        <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--dark)" }}>{e.course_title}</span>
                      </td>
                      <td style={{ padding: "8px 14px" }}>
                        <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#2563eb", background: "rgba(37,99,235,.08)", borderRadius: "4px", padding: "2px 7px", textTransform: "capitalize" }}>
                          {e.course_mode}
                        </span>
                      </td>
                      <td style={{ padding: "8px 14px", fontSize: ".72rem", color: "var(--muted)" }}>
                        Enrolled {fmtDate(e.enrolled_at)}
                      </td>
                      <td style={{ padding: "8px 14px", fontSize: ".72rem", color: "var(--muted)" }}>
                        {e.last_accessed_at ? `Last: ${fmtDate(e.last_accessed_at)}` : "Not accessed"}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = "physical" | "online";

interface Props {
  physical: PhysicalStudent[];
  online:   OnlineStudent[];
}

export default function StudentsTabClient({ physical, online }: Props) {
  const [tab, setTab] = useState<Tab>("physical");

  const tabs: { key: Tab; label: string; icon: string; color: string; count: number }[] = [
    { key: "physical", label: "Physical Classes", icon: "fa-chalkboard-teacher", color: "var(--teal2)", count: physical.length },
    { key: "online",   label: "Online Students",  icon: "fa-laptop",             color: "#2563eb",      count: online.length   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Toggle */}
      <div style={{ display: "flex", gap: "8px" }}>
        {tabs.map((t) => {
          const isActive = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "9px 18px", borderRadius: "9px", cursor: "pointer",
              fontSize: ".82rem", fontWeight: 700,
              background: isActive ? t.color : "rgba(17,17,17,.04)",
              border: isActive ? `1px solid ${t.color}` : "1px solid rgba(17,17,17,.1)",
              color: isActive ? "#fff" : "var(--muted)", transition: "all .15s",
            }}>
              <i className={`fas ${t.icon}`} style={{ fontSize: ".75rem" }} />
              {t.label}
              <span style={{
                padding: "1px 7px", borderRadius: "8px", fontSize: ".65rem", fontWeight: 800,
                background: isActive ? "rgba(255,255,255,.25)" : "rgba(17,17,17,.08)",
                color: isActive ? "#fff" : "var(--muted)",
              }}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "physical" ? <PhysicalView students={physical} /> : <OnlineView students={online} />}
    </div>
  );
}
