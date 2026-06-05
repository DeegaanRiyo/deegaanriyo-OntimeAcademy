"use client";

import React, { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentRef = {
  id:      string;
  name:    string;
  phone:   string;
  type:    string;
  course:  string | null;
  subject: string;
};

type TeacherSummary = {
  name:          string;
  subjects:      string[];
  student_count: number;
  students:      StudentRef[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  new:          { bg: "rgba(232,73,15,.1)",   fg: "#E8490F" },
  current_old:  { bg: "rgba(22,163,74,.1)",   fg: "#16a34a" },
  zoom_virtual: { bg: "rgba(124,58,237,.13)", fg: "#7c3aed" },
};
const TYPE_LABEL: Record<string, string> = {
  new: "New", current_old: "Returning", zoom_virtual: "Zoom",
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── TeacherCard ──────────────────────────────────────────────────────────────

function TeacherCard({ teacher }: { teacher: TeacherSummary }) {
  const [open, setOpen] = useState(false);

  const avatarColors = [
    { bg: "rgba(37,99,235,.12)",  fg: "#2563eb" },
    { bg: "rgba(22,163,74,.12)",  fg: "#16a34a" },
    { bg: "rgba(232,73,15,.12)",  fg: "#E8490F" },
    { bg: "rgba(124,58,237,.12)", fg: "#7c3aed" },
    { bg: "rgba(219,39,119,.12)", fg: "#db2777" },
  ];
  // Deterministic color per teacher name
  const colorIdx = teacher.name.charCodeAt(0) % avatarColors.length;
  const color = avatarColors[colorIdx];

  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${open ? color.fg : "rgba(17,17,17,.09)"}`,
      borderRadius: "12px",
      overflow: "hidden",
      transition: "border-color .15s, box-shadow .15s",
      boxShadow: open ? `0 0 0 3px ${color.fg}20` : "none",
    }}>
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "14px",
          padding: "16px 18px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        {/* Avatar */}
        <div style={{
          width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
          background: color.bg, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: ".75rem", fontWeight: 800, color: color.fg,
        }}>
          {initials(teacher.name)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: ".88rem", color: "var(--dark)", marginBottom: "4px" }}>
            {teacher.name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {teacher.subjects.length > 0 ? teacher.subjects.map((s) => (
              <span key={s} style={{
                fontSize: ".6rem", fontWeight: 700, background: `${color.fg}14`,
                color: color.fg, border: `1px solid ${color.fg}25`,
                borderRadius: "100px", padding: "2px 8px",
              }}>{s}</span>
            )) : (
              <span style={{ fontSize: ".68rem", color: "rgba(17,17,17,.3)" }}>No subjects listed</span>
            )}
          </div>
        </div>

        {/* Count + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: color.fg, lineHeight: 1 }}>
              {teacher.student_count}
            </div>
            <div style={{ fontSize: ".6rem", color: "rgba(17,17,17,.4)", textTransform: "uppercase", letterSpacing: ".06em" }}>
              {teacher.student_count === 1 ? "student" : "students"}
            </div>
          </div>
          <i
            className={`fas fa-chevron-${open ? "up" : "down"}`}
            style={{ fontSize: ".65rem", color: "rgba(17,17,17,.3)", transition: "transform .15s" }}
          />
        </div>
      </button>

      {/* Expanded student list */}
      {open && (
        <div style={{ borderTop: "1px solid rgba(17,17,17,.06)" }}>
          {teacher.students.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "rgba(17,17,17,.35)", fontSize: ".78rem" }}>
              No students assigned.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(17,17,17,.018)" }}>
                    {["Student", "Subject", "Type", "Course", "Phone"].map((h) => (
                      <th key={h} style={{
                        padding: "6px 14px", textAlign: "left", fontSize: ".54rem",
                        fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em",
                        color: "#6B7280", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teacher.students.map((s, i) => {
                    const tc = TYPE_COLOR[s.type] ?? { bg: "rgba(17,17,17,.06)", fg: "#374151" };
                    return (
                      <tr key={`${s.id}-${i}`}
                        style={{ borderTop: "1px solid rgba(17,17,17,.045)" }}>
                        {/* Student name */}
                        <td style={{ padding: "0 14px", height: "38px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{
                              width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                              background: tc.bg, display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: ".5rem", fontWeight: 700, color: tc.fg,
                            }}>
                              {initials(s.name)}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: ".78rem", color: "#111827", whiteSpace: "nowrap" }}>
                              {s.name}
                            </span>
                          </div>
                        </td>
                        {/* Subject */}
                        <td style={{ padding: "0 14px", height: "38px", verticalAlign: "middle" }}>
                          {s.subject ? (
                            <span style={{
                              fontSize: ".65rem", fontWeight: 600, background: `${color.fg}12`,
                              color: color.fg, borderRadius: "4px", padding: "2px 7px",
                            }}>{s.subject}</span>
                          ) : (
                            <span style={{ color: "rgba(17,17,17,.2)", fontSize: ".7rem" }}>—</span>
                          )}
                        </td>
                        {/* Type badge */}
                        <td style={{ padding: "0 14px", height: "38px", verticalAlign: "middle" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", fontSize: ".62rem",
                            fontWeight: 700, background: tc.bg, color: tc.fg,
                            borderRadius: "100px", padding: "2px 8px", whiteSpace: "nowrap",
                          }}>
                            {TYPE_LABEL[s.type] ?? s.type}
                          </span>
                        </td>
                        {/* Course */}
                        <td style={{ padding: "0 14px", height: "38px", verticalAlign: "middle", fontSize: ".75rem", color: "#4B5563" }}>
                          {s.course ?? <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                        </td>
                        {/* Phone */}
                        <td style={{ padding: "0 14px", height: "38px", verticalAlign: "middle", fontSize: ".72rem", color: "#6B7280" }}>
                          {s.phone}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  function load() {
    setLoading(true);
    fetch("/api/receptionist/teachers")
      .then((r) => r.json())
      .then((j) => setTeachers(j.teachers ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const q        = search.trim().toLowerCase();
  const filtered = teachers.filter((t) =>
    !q ||
    t.name.toLowerCase().includes(q) ||
    t.subjects.some((s) => s.toLowerCase().includes(q))
  );

  const totalStudents = teachers.reduce((sum, t) => sum + t.student_count, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Teachers</h2>
          <p>
            {loading ? "Loading…" : `${teachers.length} teacher${teachers.length !== 1 ? "s" : ""} · ${totalStudents} student assignment${totalStudents !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={load}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            height: "34px", padding: "0 14px",
            background: "rgba(17,17,17,.05)", border: "1px solid rgba(17,17,17,.1)",
            borderRadius: "7px", cursor: "pointer", fontSize: ".78rem",
            fontWeight: 600, color: "var(--dark)",
          }}
        >
          <i className="fas fa-sync-alt" style={{ fontSize: ".68rem" }} />Refresh
        </button>
      </div>

      {/* Search */}
      {teachers.length > 0 && (
        <div style={{ position: "relative", display: "flex", alignItems: "center", maxWidth: "340px" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: "10px", color: "rgba(17,17,17,.28)", fontSize: ".68rem", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search by name or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", height: "32px", paddingLeft: "30px",
              paddingRight: search ? "30px" : "10px",
              background: "#fff", border: "1px solid rgba(17,17,17,.12)",
              borderRadius: "7px", fontSize: ".78rem", color: "var(--dark)",
              outline: "none", boxSizing: "border-box",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "6px", background: "none", border: "none", color: "rgba(17,17,17,.3)", cursor: "pointer", fontSize: ".65rem", padding: "4px" }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(17,17,17,.4)", fontSize: ".82rem" }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading teachers…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid rgba(17,17,17,.08)",
          borderRadius: "12px", padding: "60px 20px", textAlign: "center",
        }}>
          <i className="fas fa-chalkboard-teacher" style={{ fontSize: "1.6rem", color: "rgba(17,17,17,.1)", marginBottom: "12px", display: "block" }} />
          <div style={{ fontSize: ".88rem", fontWeight: 700, color: "rgba(17,17,17,.5)", marginBottom: "6px" }}>
            {search ? `No teachers match "${search}"` : "No teachers assigned yet"}
          </div>
          <div style={{ fontSize: ".75rem", color: "rgba(17,17,17,.35)" }}>
            {!search && "Assign teachers when registering or editing a student."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((t) => (
            <TeacherCard key={t.name} teacher={t} />
          ))}
        </div>
      )}
    </div>
  );
}
