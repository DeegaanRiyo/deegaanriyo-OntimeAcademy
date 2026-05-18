"use client";

import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlagInfo = {
  id:         string;
  message:    string;
  flagged_by: string | null;
  created_at: string;
};

export type PhysicalStudent = {
  id:                 string;
  type:               string;
  name:               string;
  phone:              string;
  class_name:         string;
  student_type:       string | null;
  total_paid:         number;
  total_due:          number | null;
  course_fee_monthly: number | null;
  joined_at:          string | null;
  notes:              string | null;
  method:             string;
  payment_date:       string;
  open_flags:         FlagInfo[];
};

export type OnlineStudent = {
  id:         string;
  full_name:  string | null;
  email:      string | null;
  created_at: string;
  enrolments: {
    course_id:        string;
    course_title:     string;
    course_mode:      string;
    enrolled_at:      string;
    last_accessed_at: string | null;
  }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  cash:          "Cash",
  mpesa:         "M-Pesa",
  bank_transfer: "Bank Transfer",
  both:          "Cash + M-Pesa",
};

const STYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "New",       color: "var(--teal2)", bg: "rgba(193,68,14,.1)"   },
  returning: { label: "Old",       color: "#16a34a",      bg: "rgba(34,197,94,.1)"   },
  online:    { label: "Online",    color: "#7c3aed",      bg: "rgba(124,58,237,.1)"  },
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function cleanNotes(notes: string | null) {
  if (!notes) return "";
  const metaKeys = ["Class:", "student_type=", "monthly=", "reg_fee=", "total_due=", "cash=", "mpesa=", "mpesa_ref=", "joined_at="];
  return notes.split(". ").filter((p) => !metaKeys.some((k) => p.startsWith(k))).join(". ");
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string | null) {
  const n = name || "?";
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: "relative", maxWidth: "380px" }}>
      <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: ".8rem", pointerEvents: "none" }} />
      <input
        type="text" placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input" style={{ paddingLeft: "34px" }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
          <i className="fas fa-times" />
        </button>
      )}
    </div>
  );
}

// ─── Flag resolve button ──────────────────────────────────────────────────────

function ResolveFlag({ flagId, onResolved }: { flagId: string; onResolved: () => void }) {
  const [loading, setLoading] = useState(false);

  async function resolve() {
    setLoading(true);
    try {
      await fetch(`/api/owner/student-flags/${flagId}`, { method: "PATCH" });
      onResolved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={resolve}
      disabled={loading}
      style={{
        fontSize: ".65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px",
        cursor: "pointer", border: "1px solid rgba(22,163,74,.3)",
        background: "rgba(22,163,74,.08)", color: "#16a34a",
        opacity: loading ? .6 : 1,
      }}
    >
      {loading ? "…" : "Resolve"}
    </button>
  );
}

// ─── Flag panel (expandable per student) ─────────────────────────────────────

function FlagsPanel({ flags, onResolved }: { flags: FlagInfo[]; onResolved: (id: string) => void }) {
  return (
    <div style={{
      marginTop: "8px", padding: "10px 12px",
      background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.2)",
      borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px",
    }}>
      {flags.map((f) => (
        <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <i className="fas fa-flag" style={{ color: "#dc2626", fontSize: ".75rem", marginTop: "2px", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: ".8rem", color: "var(--dark)", fontWeight: 500 }}>{f.message}</div>
            <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "2px" }}>
              Flagged by {f.flagged_by ?? "receptionist"} · {fmtDate(f.created_at)} {fmtTime(f.created_at)}
            </div>
          </div>
          <ResolveFlag flagId={f.id} onResolved={() => onResolved(f.id)} />
        </div>
      ))}
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ student, onClose, onDeleted }: {
  student: PhysicalStudent;
  onClose:   () => void;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/owner/students/${student.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete");
      onDeleted(student.id);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: "16px" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: "400px", width: "100%", padding: "24px", gap: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#dc2626", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}>
            <i className="fas fa-trash" />Delete Student
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>

        <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "9px", padding: "14px 16px", marginBottom: "18px" }}>
          <div style={{ fontWeight: 700, color: "var(--dark)", fontSize: ".88rem" }}>{student.name}</div>
          <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: "2px" }}>{student.class_name} · {student.phone}</div>
        </div>

        <p style={{ fontSize: ".82rem", color: "var(--muted)", margin: "0 0 18px", lineHeight: 1.6 }}>
          This will permanently delete this student record and all associated payment data. This action <strong style={{ color: "#dc2626" }}>cannot be undone</strong>.
        </p>

        {error && (
          <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "9px 12px", color: "#dc2626", fontSize: ".8rem", marginBottom: "14px" }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={confirm}
            disabled={loading}
            style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: ".85rem", cursor: "pointer", opacity: loading ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}
          >
            {loading
              ? <><i className="fas fa-spinner fa-spin" />Deleting…</>
              : <><i className="fas fa-trash" />Yes, Delete</>
            }
          </button>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Physical tab ─────────────────────────────────────────────────────────────

type CategoryFilter = "all" | "new" | "returning" | "online";

function PhysicalView({ students }: { students: PhysicalStudent[] }) {
  const [expandedFlags,   setExpandedFlags]   = useState<Set<string>>(new Set());
  const [resolvedFlags,   setResolvedFlags]   = useState<Set<string>>(new Set());
  const [deletedIds,      setDeletedIds]      = useState<Set<string>>(new Set());
  const [deleteTarget,    setDeleteTarget]    = useState<PhysicalStudent | null>(null);
  const [categoryFilter,  setCategoryFilter]  = useState<CategoryFilter>("all");

  function toggleFlags(id: string) {
    setExpandedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function markResolved(flagId: string) {
    setResolvedFlags((prev) => new Set(prev).add(flagId));
  }

  function markDeleted(id: string) {
    setDeletedIds((prev) => new Set(prev).add(id));
  }

  // Filter out locally deleted rows
  const visible = students.filter((s) => !deletedIds.has(s.id));

  // Category counts (before filter)
  const countNew       = visible.filter((s) => s.student_type === "new"       || s.student_type === null).length;
  const countReturning = visible.filter((s) => s.student_type === "returning").length;
  const countOnline    = visible.filter((s) => s.student_type === "online").length;

  // Apply category filter
  const categorised =
    categoryFilter === "new"       ? visible.filter((s) => s.student_type === "new" || s.student_type === null) :
    categoryFilter === "returning" ? visible.filter((s) => s.student_type === "returning") :
    categoryFilter === "online"    ? visible.filter((s) => s.student_type === "online") :
    visible;

  // Group by class
  const grouped: Record<string, PhysicalStudent[]> = {};
  for (const s of categorised) {
    const key = s.class_name || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const classes = Object.keys(grouped).sort();

  if (visible.length === 0) {
    return (
      <div className="card">
        <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
          <i className="fas fa-chalkboard" style={{ fontSize: "1.8rem", opacity: .2, display: "block", marginBottom: "12px" }} />
          No students recorded yet
        </div>
      </div>
    );
  }

  const categoryBtns: { key: CategoryFilter; label: string; icon: string; count: number; color: string; bg: string }[] = [
    { key: "all",       label: "All",         icon: "fa-users",        count: visible.length, color: "var(--dark)",  bg: "rgba(17,17,17,.06)"    },
    { key: "new",       label: "New",         icon: "fa-user-plus",    count: countNew,       color: "var(--teal2)", bg: "rgba(193,68,14,.06)"   },
    { key: "returning", label: "Current/Old", icon: "fa-user-check",   count: countReturning, color: "#16a34a",      bg: "rgba(34,197,94,.06)"   },
    { key: "online",    label: "Online",      icon: "fa-wifi",         count: countOnline,    color: "#7c3aed",      bg: "rgba(124,58,237,.06)"  },
  ];

  return (
    <>
      {deleteTarget && (
        <DeleteConfirmModal
          student={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={markDeleted}
        />
      )}
      {/* Category filter strip */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {categoryBtns.map((btn) => {
          const active = categoryFilter === btn.key;
          return (
            <button
              key={btn.key}
              onClick={() => setCategoryFilter((f) => f === btn.key ? "all" : btn.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                fontSize: ".78rem", fontWeight: 700,
                background: active ? btn.bg : "rgba(17,17,17,.03)",
                border: active ? `1.5px solid ${btn.color}` : "1px solid rgba(17,17,17,.1)",
                color: active ? btn.color : "var(--muted)", transition: "all .15s",
              }}
            >
              <i className={`fas ${btn.icon}`} style={{ fontSize: ".7rem" }} />
              {btn.label}
              <span style={{
                padding: "1px 6px", borderRadius: "6px", fontSize: ".62rem", fontWeight: 800,
                background: active ? `${btn.color}22` : "rgba(17,17,17,.08)",
                color: active ? btn.color : "var(--muted)",
              }}>
                {btn.count}
              </span>
            </button>
          );
        })}
      </div>

      {categorised.length === 0 ? (
        <div className="card">
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            No students in this category
          </div>
        </div>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {classes.map((cls) => (
          <div key={cls} className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Class header */}
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
                    {["Student", "Phone", "Joined", "Category", "Monthly Fee", "Paid", "Due", "Balance", "Method", "Registered", ""].map((h, i) => (
                      <th key={i} style={{ padding: "8px 14px", textAlign: i === 10 ? "right" : "left", fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grouped[cls].map((s) => {
                    const visibleFlags = s.open_flags.filter((f) => !resolvedFlags.has(f.id));
                    const hasFlagOpen  = visibleFlags.length > 0;
                    const balance      = s.total_due ? Math.max(0, s.total_due - s.total_paid) : null;
                    const stype        = s.student_type ? STYPE_LABELS[s.student_type] : null;

                    return (
                      <React.Fragment key={s.id}>
                        <tr style={{ borderBottom: hasFlagOpen ? "none" : "1px solid rgba(17,17,17,.06)", background: hasFlagOpen ? "rgba(239,68,68,.02)" : undefined }}>
                          {/* Name */}
                          <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                              <div style={{
                                width: "30px", height: "30px", borderRadius: "50%",
                                background: s.type === "online_class"
                                  ? "linear-gradient(135deg,#7c3aed,#a78bfa)"
                                  : "linear-gradient(135deg,var(--teal),var(--teal2))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: ".6rem", fontWeight: 700, color: "#fff", flexShrink: 0,
                              }}>
                                {initials(s.name)}
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>{s.name}</span>
                                  {hasFlagOpen && (
                                    <button
                                      onClick={() => toggleFlags(s.id)}
                                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                      title={`${visibleFlags.length} open flag${visibleFlags.length !== 1 ? "s" : ""}`}
                                    >
                                      <span style={{ fontSize: ".6rem", fontWeight: 800, background: "rgba(239,68,68,.15)", color: "#dc2626", padding: "1px 6px", borderRadius: "4px" }}>
                                        <i className="fas fa-flag" style={{ marginRight: "3px" }} />{visibleFlags.length}
                                      </span>
                                    </button>
                                  )}
                                </div>
                                {cleanNotes(s.notes) && (
                                  <div style={{ fontSize: ".68rem", color: "var(--muted)", fontStyle: "italic", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cleanNotes(s.notes)}>
                                    {cleanNotes(s.notes)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", fontSize: ".78rem", color: "var(--muted)" }}>{s.phone}</td>
                          {/* Joined date */}
                          <td style={{ padding: "10px 14px", fontSize: ".75rem", color: "var(--muted)" }}>
                            {fmtDate(s.joined_at)}
                          </td>
                          {/* Category badge */}
                          <td style={{ padding: "10px 14px" }}>
                            {stype ? (
                              <span style={{ fontSize: ".65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", padding: "2px 7px", borderRadius: "4px", color: stype.color, background: stype.bg }}>
                                {stype.label}
                              </span>
                            ) : <span style={{ color: "var(--muted)", fontSize: ".75rem" }}>—</span>}
                          </td>
                          {/* Monthly fee */}
                          <td style={{ padding: "10px 14px", fontSize: ".78rem", color: "var(--muted)" }}>
                            {s.course_fee_monthly ? `KES ${s.course_fee_monthly.toLocaleString()}` : "—"}
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--dark)", fontSize: ".82rem" }}>
                            KES {s.total_paid.toLocaleString()}
                          </td>
                          <td style={{ padding: "10px 14px", fontSize: ".78rem", color: "var(--muted)" }}>
                            {s.total_due ? `KES ${s.total_due.toLocaleString()}` : "—"}
                          </td>
                          {/* Balance with Paid/Owes badges */}
                          <td style={{ padding: "10px 14px", fontSize: ".8rem" }}>
                            {balance !== null ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontWeight: 700, color: balance > 0 ? "#d97706" : "#16a34a" }}>
                                  {balance > 0 ? `KES ${balance.toLocaleString()}` : "0"}
                                </span>
                                {balance === 0 && (
                                  <span style={{ fontSize: ".6rem", fontWeight: 800, textTransform: "uppercase", background: "rgba(22,163,74,.12)", color: "#16a34a", padding: "1px 5px", borderRadius: "4px" }}>Paid</span>
                                )}
                                {balance > 0 && (
                                  <span style={{ fontSize: ".6rem", fontWeight: 800, textTransform: "uppercase", background: "rgba(245,158,11,.12)", color: "#d97706", padding: "1px 5px", borderRadius: "4px" }}>Owes</span>
                                )}
                              </div>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "10px 14px", fontSize: ".75rem", color: "var(--muted)" }}>
                            {METHOD_LABELS[s.method] ?? s.method}
                          </td>
                          <td style={{ padding: "10px 14px", fontSize: ".75rem", color: "var(--muted)" }}>
                            {fmtDate(s.payment_date)}
                          </td>
                          {/* Delete action */}
                          <td style={{ padding: "10px 14px", textAlign: "right" }}>
                            <button
                              onClick={() => setDeleteTarget(s)}
                              title="Delete student"
                              style={{
                                background: "none", border: "1px solid rgba(220,38,38,.2)",
                                borderRadius: "6px", padding: "4px 8px", cursor: "pointer",
                                color: "#dc2626", fontSize: ".7rem", lineHeight: 1,
                              }}
                            >
                              <i className="fas fa-trash" />
                            </button>
                          </td>
                        </tr>
                        {/* Flag panel */}
                        {hasFlagOpen && expandedFlags.has(s.id) && (
                          <tr style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}>
                            <td colSpan={11} style={{ padding: "0 14px 12px 52px" }}>
                              <FlagsPanel flags={visibleFlags} onResolved={markResolved} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      )}
    </>
  );
}

// ─── Online tab (platform students) ──────────────────────────────────────────

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
          No platform students yet
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
                  <tr
                    style={{ borderBottom: "1px solid rgba(17,17,17,.06)", cursor: s.enrolments.length > 0 ? "pointer" : undefined }}
                    onClick={() => s.enrolments.length > 0 && toggle(s.id)}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".6rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {initials(s.full_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>{s.full_name || "—"}</div>
                          {s.email && <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{s.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {s.enrolments.length === 0
                        ? <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>No courses</span>
                        : <span style={{ fontSize: ".78rem", fontWeight: 600, color: "#2563eb" }}>{s.enrolments.length} course{s.enrolments.length !== 1 ? "s" : ""}</span>}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: ".75rem", color: "var(--muted)" }}>{fmtDate(s.created_at)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {s.enrolments.length > 0 && <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: ".7rem", color: "var(--muted)" }} />}
                    </td>
                  </tr>
                  {isOpen && s.enrolments.map((e) => (
                    <tr key={e.course_id} style={{ background: "rgba(59,130,246,.03)", borderBottom: "1px solid rgba(17,17,17,.04)" }}>
                      <td style={{ padding: "8px 14px 8px 52px" }}>
                        <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--dark)" }}>{e.course_title}</span>
                      </td>
                      <td style={{ padding: "8px 14px" }}>
                        <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#2563eb", background: "rgba(37,99,235,.08)", borderRadius: "4px", padding: "2px 7px", textTransform: "capitalize" }}>
                          {e.course_mode}
                        </span>
                      </td>
                      <td style={{ padding: "8px 14px", fontSize: ".72rem", color: "var(--muted)" }}>Enrolled {fmtDate(e.enrolled_at)}</td>
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
  const [tab,    setTab]    = useState<Tab>("physical");
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();

  const filteredPhysical = physical.filter((s) =>
    !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.class_name.toLowerCase().includes(q)
  );
  const filteredOnline = online.filter((s) =>
    !q ||
    (s.full_name ?? "").toLowerCase().includes(q) ||
    (s.email ?? "").toLowerCase().includes(q) ||
    s.enrolments.some((e) => e.course_title.toLowerCase().includes(q))
  );

  const openFlags = physical.reduce((n, s) => n + s.open_flags.length, 0);

  const tabs: { key: Tab; label: string; icon: string; color: string; count: number }[] = [
    { key: "physical", label: "Walk-in Students", icon: "fa-chalkboard-teacher", color: "var(--teal2)", count: filteredPhysical.length },
    { key: "online",   label: "Platform Students", icon: "fa-laptop",            color: "#2563eb",      count: filteredOnline.length   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <SearchBar
        value={search} onChange={(v) => setSearch(v)}
        placeholder={tab === "physical" ? "Search by name, phone, or class…" : "Search by name, email, or course…"}
      />

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
              <span style={{ padding: "1px 7px", borderRadius: "8px", fontSize: ".65rem", fontWeight: 800, background: isActive ? "rgba(255,255,255,.25)" : "rgba(17,17,17,.08)", color: isActive ? "#fff" : "var(--muted)" }}>
                {t.count}
              </span>
            </button>
          );
        })}
        {openFlags > 0 && tab === "physical" && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: ".75rem", color: "#dc2626", fontWeight: 600 }}>
            <i className="fas fa-flag" style={{ fontSize: ".7rem" }} />
            Click the flag badge on a student to review
          </div>
        )}
      </div>

      {q && tab === "physical" && filteredPhysical.length === 0 && (
        <div className="card"><div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>No results for &ldquo;{search}&rdquo;</div></div>
      )}
      {q && tab === "online" && filteredOnline.length === 0 && (
        <div className="card"><div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>No results for &ldquo;{search}&rdquo;</div></div>
      )}

      {tab === "physical"
        ? ((!q || filteredPhysical.length > 0) && <PhysicalView students={filteredPhysical} />)
        : ((!q || filteredOnline.length > 0)   && <OnlineView   students={filteredOnline}   />)
      }
    </div>
  );
}
