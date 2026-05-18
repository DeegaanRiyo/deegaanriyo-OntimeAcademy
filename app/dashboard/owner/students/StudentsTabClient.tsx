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
  cash: "Cash", mpesa: "M-Pesa", bank_transfer: "Bank Transfer", both: "Cash + M-Pesa",
};

const STYPE: Record<string, { label: string; color: string; dot: string }> = {
  new:       { label: "New",        color: "#E8490F", dot: "rgba(232,73,15,.7)"  },
  returning: { label: "Old",        color: "#16a34a", dot: "rgba(22,163,74,.7)"  },
  online:    { label: "Zoom Class", color: "#7c3aed", dot: "rgba(124,58,237,.7)" },
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}
function cleanNotes(notes: string | null) {
  if (!notes) return "";
  const metaKeys = ["Class:", "student_type=", "monthly=", "reg_fee=", "total_due=", "cash=", "mpesa=", "mpesa_ref=", "joined_at="];
  return notes.split(". ").filter((p) => !metaKeys.some((k) => p.startsWith(k))).join(". ");
}
function initials(name: string | null) {
  const n = name || "?";
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Style tokens ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: "7px 12px", textAlign: "left", fontSize: ".58rem",
  fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em",
  color: "rgba(17,17,17,.35)", whiteSpace: "nowrap", background: "rgba(17,17,17,.015)",
};
const TD: React.CSSProperties = {
  padding: "0 12px", height: "40px", verticalAlign: "middle",
  fontSize: ".78rem", color: "var(--dark)",
};
const TD_M: React.CSSProperties = {
  padding: "0 12px", height: "40px", verticalAlign: "middle",
  fontSize: ".75rem", color: "rgba(17,17,17,.48)",
};
const ACT_BTN: React.CSSProperties = {
  width: "25px", height: "25px", display: "inline-flex", alignItems: "center",
  justifyContent: "center", background: "rgba(17,17,17,.05)",
  border: "none", borderRadius: "5px", cursor: "pointer",
  color: "rgba(17,17,17,.48)", fontSize: ".62rem", textDecoration: "none",
};

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ student, onClose, onDeleted }: {
  student:   PhysicalStudent;
  onClose:   () => void;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function confirm() {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`/api/owner/students/${student.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete");
      onDeleted(student.id); onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: "16px" }} onClick={onClose}>
      <div style={{ maxWidth: "400px", width: "100%", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,.18)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 20px", borderBottom: "1px solid rgba(17,17,17,.07)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".95rem", color: "#dc2626" }}>Delete Student</div>
            <div style={{ fontSize: ".7rem", color: "rgba(17,17,17,.4)", marginTop: "2px" }}>{student.name} · {student.class_name}</div>
          </div>
          <button onClick={onClose} style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,.06)", border: "none", borderRadius: "5px", cursor: "pointer", color: "rgba(17,17,17,.45)", fontSize: ".78rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <p style={{ fontSize: ".82rem", color: "rgba(17,17,17,.55)", margin: "0 0 18px", lineHeight: 1.65 }}>
            This will permanently delete this student record and all associated payment data.
            This action <strong style={{ color: "#dc2626" }}>cannot be undone</strong>.
          </p>
          {error && (
            <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "6px", padding: "8px 12px", color: "#dc2626", fontSize: ".78rem", marginBottom: "14px" }}>{error}</div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={confirm} disabled={loading} style={{ flex: 1, height: "40px", background: loading ? "rgba(220,38,38,.55)" : "#dc2626", color: "#fff", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".84rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              {loading ? <><i className="fas fa-spinner fa-spin" />Deleting…</> : <><i className="fas fa-trash" />Yes, Delete</>}
            </button>
            <button onClick={onClose} style={{ flex: 1, height: "40px", background: "rgba(17,17,17,.06)", border: "none", borderRadius: "7px", fontWeight: 700, fontSize: ".84rem", color: "var(--dark)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Resolve flag button ──────────────────────────────────────────────────────

function ResolveFlag({ flagId, onResolved }: { flagId: string; onResolved: () => void }) {
  const [loading, setLoading] = useState(false);
  async function resolve() {
    setLoading(true);
    try { await fetch(`/api/owner/student-flags/${flagId}`, { method: "PATCH" }); onResolved(); }
    finally { setLoading(false); }
  }
  return (
    <button onClick={resolve} disabled={loading} style={{ padding: "2px 9px", borderRadius: "4px", cursor: "pointer", border: "1px solid rgba(22,163,74,.25)", background: "rgba(22,163,74,.07)", color: "#16a34a", fontSize: ".65rem", fontWeight: 700, opacity: loading ? .6 : 1 }}>
      {loading ? "…" : "Resolve"}
    </button>
  );
}

// ─── Physical view ────────────────────────────────────────────────────────────

type CategoryFilter = "all" | "new" | "returning" | "online";

function PhysicalView({ students }: { students: PhysicalStudent[] }) {
  const [expandedFlags,  setExpandedFlags]  = useState<Set<string>>(new Set());
  const [resolvedFlags,  setResolvedFlags]  = useState<Set<string>>(new Set());
  const [deletedIds,     setDeletedIds]     = useState<Set<string>>(new Set());
  const [deleteTarget,   setDeleteTarget]   = useState<PhysicalStudent | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [hoveredRow,     setHoveredRow]     = useState<string | null>(null);

  function toggleFlags(id: string) {
    setExpandedFlags((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function markResolved(flagId: string) { setResolvedFlags((prev) => new Set(prev).add(flagId)); }
  function markDeleted(id: string)      { setDeletedIds((prev) => new Set(prev).add(id)); }

  const visible = students.filter((s) => !deletedIds.has(s.id));

  const countNew       = visible.filter((s) => s.student_type === "new" || s.student_type === null).length;
  const countReturning = visible.filter((s) => s.student_type === "returning").length;
  const countOnline    = visible.filter((s) => s.student_type === "online").length;

  const categorised =
    categoryFilter === "new"       ? visible.filter((s) => s.student_type === "new" || s.student_type === null) :
    categoryFilter === "returning" ? visible.filter((s) => s.student_type === "returning") :
    categoryFilter === "online"    ? visible.filter((s) => s.student_type === "online") :
    visible;

  const grouped: Record<string, PhysicalStudent[]> = {};
  for (const s of categorised) {
    const key = s.class_name || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const classes = Object.keys(grouped).sort();

  if (visible.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "60px 20px", textAlign: "center", color: "rgba(17,17,17,.3)", fontSize: ".82rem" }}>
        <i className="fas fa-chalkboard" style={{ fontSize: "1.6rem", opacity: .15, display: "block", marginBottom: "12px" }} />
        No students recorded yet
      </div>
    );
  }

  const chips: { key: CategoryFilter; label: string; count: number; icon: string; color: string; bg: string }[] = [
    { key: "all",       label: "All",          count: visible.length,   icon: "fa-users",      color: "rgba(17,17,17,.7)", bg: "rgba(17,17,17,.06)"    },
    { key: "new",       label: "New",          count: countNew,         icon: "fa-user-plus",  color: "#E8490F",           bg: "rgba(232,73,15,.08)"   },
    { key: "returning", label: "Current / Old",count: countReturning,   icon: "fa-user-check", color: "#16a34a",           bg: "rgba(22,163,74,.08)"   },
    { key: "online",    label: "Zoom Class",   count: countOnline,      icon: "fa-video",      color: "#7c3aed",           bg: "rgba(124,58,237,.08)"  },
  ];

  return (
    <>
      {deleteTarget && (
        <DeleteConfirmModal student={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={markDeleted} />
      )}

      {/* Category chips */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
        {chips.map(({ key, label, count, icon, color, bg }) => {
          const active = categoryFilter === key;
          return (
            <button
              key={key}
              onClick={() => setCategoryFilter((f) => f === key ? "all" : key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "4px 10px 4px 7px", borderRadius: "100px",
                border: active ? `1.5px solid ${color}` : "1px solid rgba(17,17,17,.11)",
                background: active ? bg : "#fff",
                color: active ? color : "rgba(17,17,17,.48)",
                fontSize: ".72rem", fontWeight: 600, cursor: "pointer", transition: "all .12s",
              }}
            >
              <i className={`fas ${icon}`} style={{ fontSize: ".58rem" }} />
              <span style={{ fontWeight: 800 }}>{count}</span>
              {label}
            </button>
          );
        })}
      </div>

      {categorised.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "40px 20px", textAlign: "center", color: "rgba(17,17,17,.35)", fontSize: ".82rem" }}>
          No students in this category
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  <th style={TH}>Student</th>
                  <th style={TH}>Phone</th>
                  <th style={TH}>Joined</th>
                  <th style={TH}>Category</th>
                  <th style={TH}>Monthly</th>
                  <th style={TH}>Due</th>
                  <th style={TH}>Paid</th>
                  <th style={TH}>Balance</th>
                  <th style={TH}>Method</th>
                  <th style={TH}>Registered</th>
                  <th style={{ ...TH, width: "1px" }}></th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <React.Fragment key={cls}>
                    {/* Subtle class divider */}
                    <tr>
                      <td colSpan={11} style={{ padding: "8px 14px 4px", background: "transparent" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: ".56rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(17,17,17,.28)", whiteSpace: "nowrap" }}>{cls}</span>
                          <div style={{ flex: 1, height: "1px", background: "rgba(17,17,17,.06)" }} />
                          <span style={{ fontSize: ".56rem", color: "rgba(17,17,17,.22)", fontWeight: 600 }}>{grouped[cls].length}</span>
                        </div>
                      </td>
                    </tr>

                    {grouped[cls].map((s) => {
                      const visibleFlags = s.open_flags.filter((f) => !resolvedFlags.has(f.id));
                      const hasFlagOpen  = visibleFlags.length > 0;
                      const flagsExpanded = expandedFlags.has(s.id);
                      const balance      = s.total_due ? Math.max(0, s.total_due - s.total_paid) : null;
                      const stype        = s.student_type ? STYPE[s.student_type] : null;
                      const isHovered    = hoveredRow === s.id;

                      return (
                        <React.Fragment key={s.id}>
                          <tr
                            onMouseEnter={() => setHoveredRow(s.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            style={{
                              borderBottom: (hasFlagOpen && flagsExpanded) ? "none" : "1px solid rgba(17,17,17,.045)",
                              borderLeft: hasFlagOpen ? "2px solid rgba(220,38,38,.3)" : "2px solid transparent",
                              background: hasFlagOpen
                                ? "rgba(220,38,38,.018)"
                                : isHovered ? "rgba(17,17,17,.018)" : "transparent",
                              transition: "background .08s",
                            }}
                          >
                            {/* Student */}
                            <td style={TD}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{
                                  width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                                  background: s.type === "online_class" ? "rgba(124,58,237,.13)" : "rgba(232,73,15,.1)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: ".5rem", fontWeight: 700,
                                  color: s.type === "online_class" ? "#7c3aed" : "#E8490F",
                                }}>
                                  {initials(s.name)}
                                </div>
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".8rem", whiteSpace: "nowrap" }}>{s.name}</span>
                                    {hasFlagOpen && (
                                      <button
                                        onClick={() => toggleFlags(s.id)}
                                        title={`${visibleFlags.length} open flag${visibleFlags.length !== 1 ? "s" : ""}`}
                                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: "3px", fontSize: ".58rem", fontWeight: 800, color: "#dc2626", background: "rgba(220,38,38,.1)", borderRadius: "3px", padding: "1px 5px" }}
                                      >
                                        <i className="fas fa-flag" style={{ fontSize: ".5rem" }} />{visibleFlags.length}
                                      </button>
                                    )}
                                  </div>
                                  {cleanNotes(s.notes) && (
                                    <div style={{ fontSize: ".63rem", color: "rgba(17,17,17,.38)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {cleanNotes(s.notes)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td style={TD_M}>{s.phone}</td>
                            <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(s.joined_at)}</td>

                            {/* Category */}
                            <td style={TD}>
                              {stype ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: ".68rem", fontWeight: 700, color: stype.color }}>
                                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: stype.dot, flexShrink: 0 }} />
                                  {stype.label}
                                </span>
                              ) : <span style={{ color: "rgba(17,17,17,.25)", fontSize: ".72rem" }}>—</span>}
                            </td>

                            <td style={TD_M}>{s.course_fee_monthly ? s.course_fee_monthly.toLocaleString() : "—"}</td>
                            <td style={TD_M}>{s.total_due ? s.total_due.toLocaleString() : "—"}</td>
                            <td style={{ ...TD, fontWeight: 600 }}>{s.total_paid.toLocaleString()}</td>

                            {/* Balance */}
                            <td style={TD}>
                              {balance !== null ? (
                                balance === 0 ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: ".72rem", color: "#16a34a", fontWeight: 600 }}>
                                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />Paid
                                  </span>
                                ) : (
                                  <span style={{ display: "inline-flex", alignItems: "center", fontSize: ".68rem", fontWeight: 700, background: "rgba(217,119,6,.09)", color: "#d97706", padding: "2px 7px", borderRadius: "100px", whiteSpace: "nowrap" }}>
                                    {balance.toLocaleString()} owes
                                  </span>
                                )
                              ) : <span style={{ color: "rgba(17,17,17,.25)", fontSize: ".72rem" }}>—</span>}
                            </td>

                            <td style={TD_M}>{METHOD_LABELS[s.method] ?? s.method}</td>
                            <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(s.payment_date)}</td>

                            {/* Actions — hover only */}
                            <td style={{ ...TD, textAlign: "right", paddingRight: "10px", opacity: isHovered ? 1 : 0, transition: "opacity .1s" }}>
                              <div style={{ display: "inline-flex", gap: "3px" }}>
                                <button onClick={() => setDeleteTarget(s)} title="Delete student" style={{ ...ACT_BTN, color: "#dc2626" }}>
                                  <i className="fas fa-trash" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Inline flag panel */}
                          {hasFlagOpen && flagsExpanded && (
                            <tr style={{ borderBottom: "1px solid rgba(17,17,17,.045)", borderLeft: "2px solid rgba(220,38,38,.3)", background: "rgba(220,38,38,.02)" }}>
                              <td colSpan={11} style={{ padding: "0 14px 10px 14px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "40px" }}>
                                  {visibleFlags.map((f) => (
                                    <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 12px", background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.12)", borderRadius: "6px" }}>
                                      <i className="fas fa-flag" style={{ color: "#dc2626", fontSize: ".68rem", marginTop: "2px", flexShrink: 0 }} />
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: ".78rem", color: "var(--dark)", fontWeight: 500 }}>{f.message}</div>
                                        <div style={{ fontSize: ".65rem", color: "rgba(17,17,17,.4)", marginTop: "2px" }}>
                                          {f.flagged_by ?? "receptionist"} · {fmtDate(f.created_at)} {fmtTime(f.created_at)}
                                        </div>
                                      </div>
                                      <ResolveFlag flagId={f.id} onResolved={() => markResolved(f.id)} />
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Online (platform) view ───────────────────────────────────────────────────

function OnlineView({ students }: { students: OnlineStudent[] }) {
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  if (students.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "60px 20px", textAlign: "center", color: "rgba(17,17,17,.3)", fontSize: ".82rem" }}>
        <i className="fas fa-laptop" style={{ fontSize: "1.6rem", opacity: .15, display: "block", marginBottom: "12px" }} />
        No platform students yet
      </div>
    );
  }

  const MODE_COLOR: Record<string, { color: string; bg: string }> = {
    online:   { color: "#2563eb", bg: "rgba(37,99,235,.08)"  },
    physical: { color: "#E8490F", bg: "rgba(232,73,15,.08)"  },
    hybrid:   { color: "#7c3aed", bg: "rgba(124,58,237,.08)" },
  };

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(17,17,17,.08)" }}>
              <th style={TH}>Student</th>
              <th style={TH}>Email</th>
              <th style={TH}>Courses</th>
              <th style={TH}>Joined</th>
              <th style={{ ...TH, width: "1px" }}></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const isOpen    = expanded.has(s.id);
              const isHovered = hoveredRow === s.id;
              const hasEnrols = s.enrolments.length > 0;

              return (
                <React.Fragment key={s.id}>
                  <tr
                    onMouseEnter={() => setHoveredRow(s.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => hasEnrols && toggle(s.id)}
                    style={{
                      borderBottom: (isOpen && hasEnrols) ? "none" : "1px solid rgba(17,17,17,.045)",
                      background: isHovered ? "rgba(17,17,17,.018)" : "transparent",
                      cursor: hasEnrols ? "pointer" : undefined,
                      transition: "background .08s",
                    }}
                  >
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(37,99,235,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".5rem", fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
                          {initials(s.full_name)}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".8rem", whiteSpace: "nowrap" }}>{s.full_name || "—"}</span>
                      </div>
                    </td>
                    <td style={TD_M}>{s.email || "—"}</td>
                    <td style={TD}>
                      {s.enrolments.length === 0
                        ? <span style={{ fontSize: ".72rem", color: "rgba(17,17,17,.28)" }}>No courses</span>
                        : <span style={{ fontSize: ".74rem", fontWeight: 700, color: "#2563eb" }}>{s.enrolments.length} course{s.enrolments.length !== 1 ? "s" : ""}</span>}
                    </td>
                    <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(s.created_at)}</td>
                    <td style={{ ...TD, paddingRight: "14px", textAlign: "right" }}>
                      {hasEnrols && (
                        <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: ".6rem", color: "rgba(17,17,17,.3)" }} />
                      )}
                    </td>
                  </tr>

                  {/* Enrolment rows */}
                  {isOpen && s.enrolments.map((e, idx) => {
                    const mc = MODE_COLOR[e.course_mode] ?? MODE_COLOR.online;
                    return (
                      <tr key={e.course_id} style={{ background: "rgba(37,99,235,.02)", borderBottom: idx === s.enrolments.length - 1 ? "1px solid rgba(17,17,17,.045)" : "1px solid rgba(17,17,17,.03)", borderLeft: "2px solid rgba(37,99,235,.2)" }}>
                        <td style={{ ...TD, paddingLeft: "46px" }}>
                          <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".76rem" }}>{e.course_title}</span>
                        </td>
                        <td style={TD_M}>
                          <span style={{ fontSize: ".64rem", fontWeight: 700, color: mc.color, background: mc.bg, borderRadius: "4px", padding: "2px 6px", textTransform: "capitalize" }}>
                            {e.course_mode}
                          </span>
                        </td>
                        <td style={{ ...TD_M, fontSize: ".7rem" }}>Enrolled {fmtDate(e.enrolled_at)}</td>
                        <td colSpan={2} style={{ ...TD_M, fontSize: ".7rem" }}>
                          {e.last_accessed_at ? `Last accessed ${fmtDate(e.last_accessed_at)}` : <span style={{ color: "rgba(17,17,17,.22)" }}>Not accessed</span>}
                        </td>
                      </tr>
                    );
                  })}
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* Tab bar + ghost search — single row */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", borderBottom: "1px solid rgba(17,17,17,.08)", paddingBottom: "0" }}>
        {(["physical", "online"] as Tab[]).map((t) => {
          const isActive = tab === t;
          const label    = t === "physical" ? "Walk-in Students" : "Platform Students";
          const icon     = t === "physical" ? "fa-chalkboard-teacher" : "fa-laptop";
          const count    = t === "physical" ? filteredPhysical.length : filteredOnline.length;
          const color    = t === "physical" ? "#E8490F" : "#2563eb";
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", background: "none", border: "none",
                borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                cursor: "pointer", fontSize: ".78rem", fontWeight: isActive ? 700 : 500,
                color: isActive ? color : "rgba(17,17,17,.42)",
                marginBottom: "-1px", transition: "all .12s",
              }}
            >
              <i className={`fas ${icon}`} style={{ fontSize: ".65rem" }} />
              {label}
              <span style={{ padding: "1px 6px", borderRadius: "8px", fontSize: ".62rem", fontWeight: 800, background: isActive ? (t === "physical" ? "rgba(232,73,15,.1)" : "rgba(37,99,235,.1)") : "rgba(17,17,17,.07)", color: isActive ? color : "rgba(17,17,17,.35)" }}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Flag hint */}
        {openFlags > 0 && tab === "physical" && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: ".7rem", color: "#dc2626", fontWeight: 600, marginLeft: "8px" }}>
            <i className="fas fa-flag" style={{ fontSize: ".6rem" }} />{openFlags} open · click badge to review
          </div>
        )}

        {/* Ghost search — pushed right */}
        <div style={{ marginLeft: "auto", position: "relative", display: "flex", alignItems: "center", paddingBottom: "6px" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: "6px", color: "rgba(17,17,17,.28)", fontSize: ".65rem", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder={tab === "physical" ? "Search name, phone, class…" : "Search name, email, course…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "220px", height: "28px", paddingLeft: "22px", paddingRight: search ? "22px" : "8px",
              background: "transparent", border: "none",
              borderBottom: "1.5px solid rgba(17,17,17,.1)",
              borderRadius: 0, fontSize: ".75rem", color: "var(--dark)",
              outline: "none", boxSizing: "border-box",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "0", background: "none", border: "none", color: "rgba(17,17,17,.3)", cursor: "pointer", fontSize: ".62rem", padding: "4px" }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {/* Empty search state */}
      {q && tab === "physical" && filteredPhysical.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "40px 20px", textAlign: "center", color: "rgba(17,17,17,.35)", fontSize: ".82rem" }}>
          No results for &ldquo;{search}&rdquo;
        </div>
      )}
      {q && tab === "online" && filteredOnline.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "40px 20px", textAlign: "center", color: "rgba(17,17,17,.35)", fontSize: ".82rem" }}>
          No results for &ldquo;{search}&rdquo;
        </div>
      )}

      {tab === "physical"
        ? ((!q || filteredPhysical.length > 0) && <PhysicalView students={filteredPhysical} />)
        : ((!q || filteredOnline.length > 0)   && <OnlineView   students={filteredOnline}   />)
      }
    </div>
  );
}
