"use client";

import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlagInfo = {
  id:         string;
  message:    string;
  flagged_by: string | null;
  created_at: string;
};

type Teacher = { name: string; subject: string };

export type PhysicalStudent = {
  id:                  string;
  student_type:        "new" | "current_old" | "zoom_virtual";
  name:                string;
  phone:               string;
  email:               string | null;
  course_name:         string | null;
  teachers:            Teacher[] | null;
  course_fee_monthly:  number | null;
  registration_fee:    number | null;
  total_due:           number | null;
  amount:              number;           // amount paid at registration
  method:              string;
  reference:           string | null;
  notes:               string | null;
  recorder:            string | null;
  created_at:          string;
  open_flags:          FlagInfo[];
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

// ─── Category definitions ─────────────────────────────────────────────────────

const CATS = [
  {
    key:    "new"          as const,
    dbKey:  "new"          as const,
    label:  "New Students",
    sub:    "First-time enrolments",
    color:  "#E8490F",
    soft:   "rgba(232,73,15,.09)",
    border: "rgba(232,73,15,.22)",
    icon:   "fa-user-plus",
  },
  {
    key:    "current_old"  as const,
    dbKey:  "current_old"  as const,
    label:  "Current / Old",
    sub:    "Returning & continuing",
    color:  "#16a34a",
    soft:   "rgba(22,163,74,.09)",
    border: "rgba(22,163,74,.22)",
    icon:   "fa-user-check",
  },
  {
    key:    "zoom_virtual" as const,
    dbKey:  "zoom_virtual" as const,
    label:  "Zoom / Virtual",
    sub:    "Online live-class students",
    color:  "#7c3aed",
    soft:   "rgba(124,58,237,.09)",
    border: "rgba(124,58,237,.22)",
    icon:   "fa-video",
  },
  {
    key:    "platform"     as const,
    dbKey:  null,
    label:  "Online Platform",
    sub:    "Self-registered via website",
    color:  "#2563eb",
    soft:   "rgba(37,99,235,.09)",
    border: "rgba(37,99,235,.22)",
    icon:   "fa-laptop",
  },
] as const;

type CatKey = typeof CATS[number]["key"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  cash:          "Cash",
  mpesa:         "M-Pesa",
  bank_transfer: "Bank Transfer",
  both:          "Cash + M-Pesa",
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function initials(name: string | null) {
  const n = name || "?";
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function kes(n: number) {
  return `KES ${n.toLocaleString()}`;
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({ student, onClose, onDeleted }: {
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
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90, padding: 16 }} onClick={onClose}>
      <div style={{ maxWidth: 400, width: "100%", background: "#fff", borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,.18)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(17,17,17,.07)" }}>
          <div style={{ fontWeight: 800, color: "#dc2626" }}>Remove Student Record</div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: 2 }}>{student.name} · {student.phone}</div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: ".82rem", color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
            This permanently removes the registration record. This action <strong style={{ color: "#dc2626" }}>cannot be undone</strong>.
          </p>
          {error && <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: 6, padding: "8px 12px", color: "#dc2626", fontSize: ".78rem", marginBottom: 12 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirm} disabled={loading} style={{ flex: 1, height: 40, background: loading ? "rgba(220,38,38,.5)" : "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: ".84rem", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Removing…" : "Yes, Remove"}
            </button>
            <button onClick={onClose} style={{ flex: 1, height: 40, background: "rgba(17,17,17,.06)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: ".84rem", color: "var(--dark)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit modal (full) ────────────────────────────────────────────────────────

const F_INP: React.CSSProperties = {
  width: "100%", height: "34px", background: "#fff",
  border: "1px solid rgba(17,17,17,.12)", borderRadius: "6px",
  padding: "0 10px", color: "var(--dark)", fontSize: ".8rem",
  outline: "none", boxSizing: "border-box",
};
const F_LBL: React.CSSProperties = {
  display: "block", fontSize: ".58rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".1em",
  color: "rgba(17,17,17,.35)", marginBottom: "3px",
};

type PayMethod = "cash" | "mpesa" | "bank_transfer" | "both";

function EditModal({ student, onClose, onSaved }: {
  student:  PhysicalStudent;
  onClose:  () => void;
  onSaved:  (updated: Partial<PhysicalStudent>) => void;
}) {
  const [studentType, setStudentType] = useState(student.student_type);
  const [name,        setName]        = useState(student.name);
  const [phone,       setPhone]       = useState(student.phone);
  const [email,       setEmail]       = useState(student.email ?? "");
  const [courseName,  setCourseName]  = useState(student.course_name ?? "");
  const [teachers,    setTeachers]    = useState<Teacher[]>(
    student.teachers && student.teachers.length > 0 ? student.teachers : [{ name: "", subject: "" }]
  );
  const [courseFee,   setCourseFee]   = useState(student.course_fee_monthly?.toString() ?? "");
  const [regFee,      setRegFee]      = useState(student.registration_fee?.toString() ?? "");
  const [totalDue,    setTotalDue]    = useState(student.total_due?.toString() ?? "");
  const [amount,      setAmount]      = useState(student.amount.toString());
  const [method,      setMethod]      = useState<PayMethod>(student.method as PayMethod ?? "cash");
  const [reference,   setReference]   = useState(student.reference ?? "");
  const [notes,       setNotes]       = useState(student.notes ?? "");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const showRef = method === "mpesa" || method === "bank_transfer" || method === "both";

  const TYPES: { v: "new" | "current_old" | "zoom_virtual"; label: string }[] = [
    { v: "new",          label: "New"          },
    { v: "current_old",  label: "Current / Old"},
    { v: "zoom_virtual", label: "Zoom / Virtual"},
  ];
  const METHODS: { v: PayMethod; label: string }[] = [
    { v: "cash",          label: "Cash"        },
    { v: "mpesa",         label: "M-Pesa"      },
    { v: "bank_transfer", label: "Bank"        },
    { v: "both",          label: "Cash+M-Pesa" },
  ];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const payload = {
      student_type:        studentType,
      customer_name:       name,
      customer_phone:      phone,
      customer_email:      email || null,
      course_name:         courseName.trim() || null,
      teachers:            teachers.filter((t) => t.name.trim() || t.subject.trim()).map((t) => ({ name: t.name.trim(), subject: t.subject.trim() })),
      course_fee_monthly:  courseFee  ? Number(courseFee)  : null,
      registration_fee:    regFee     ? Number(regFee)     : null,
      total_due:           totalDue   ? Number(totalDue)   : null,
      amount:              Number(amount),
      method,
      reference:           reference || null,
      notes:               notes     || null,
    };
    try {
      const res  = await fetch(`/api/owner/students/${student.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      onSaved({
        student_type:       payload.student_type,
        name:               payload.customer_name,
        phone:              payload.customer_phone,
        email:              payload.customer_email,
        course_name:        payload.course_name,
        teachers:           payload.teachers && payload.teachers.length > 0 ? payload.teachers : null,
        course_fee_monthly: payload.course_fee_monthly,
        registration_fee:   payload.registration_fee,
        total_due:          payload.total_due,
        amount:             payload.amount,
        method:             payload.method,
        reference:          payload.reference,
        notes:              payload.notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 95, padding: 16 }} onClick={onClose}>
      <div style={{ maxWidth: 520, width: "100%", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,.18)" }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(17,17,17,.06)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".92rem", color: "var(--dark)" }}>Edit Student</div>
            <div style={{ fontSize: ".68rem", color: "rgba(17,17,17,.35)", marginTop: 1 }}>{student.name}</div>
          </div>
          <button onClick={onClose} style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,.05)", border: "none", borderRadius: 5, cursor: "pointer", color: "rgba(17,17,17,.4)", fontSize: ".75rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={save} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.15)", borderRadius: 6, padding: "8px 12px", color: "#dc2626", fontSize: ".75rem" }}>{error}</div>
          )}

          {/* Student type */}
          <div>
            <label style={F_LBL}>Student Category</label>
            <div style={{ display: "flex", background: "rgba(17,17,17,.04)", borderRadius: 6, padding: 2, gap: 1 }}>
              {TYPES.map(({ v, label }) => (
                <button key={v} type="button" onClick={() => setStudentType(v)}
                  style={{ flex: 1, height: 30, borderRadius: 5, border: "none", cursor: "pointer", fontSize: ".72rem", fontWeight: studentType === v ? 700 : 500, background: studentType === v ? "#fff" : "transparent", color: studentType === v ? "#E8490F" : "rgba(17,17,17,.4)", boxShadow: studentType === v ? "0 1px 3px rgba(0,0,0,.08)" : "none", transition: "all .12s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Name / Phone / Email */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={F_LBL}>Full Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required style={F_INP} />
            </div>
            <div>
              <label style={F_LBL}>Phone *</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required style={F_INP} />
            </div>
            <div>
              <label style={F_LBL}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={F_INP} />
            </div>
          </div>

          {/* Course */}
          <div>
            <label style={F_LBL}>Course Enrolled</label>
            <input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. Arabic, Tajweed, Quran…" style={F_INP} />
          </div>

          {/* Teachers */}
          <div>
            <label style={{ ...F_LBL, marginBottom: 8 }}>Teachers</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teachers.map((t, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "end" }}>
                  <div>
                    {i === 0 && <label style={F_LBL}>Name</label>}
                    <input
                      value={t.name}
                      onChange={(e) => setTeachers(teachers.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                      placeholder="e.g. Ustadh Ali"
                      style={F_INP}
                    />
                  </div>
                  <div>
                    {i === 0 && <label style={F_LBL}>Subject</label>}
                    <input
                      value={t.subject}
                      onChange={(e) => setTeachers(teachers.map((x, idx) => idx === i ? { ...x, subject: e.target.value } : x))}
                      placeholder="e.g. English, Swahili"
                      style={F_INP}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setTeachers(teachers.filter((_, idx) => idx !== i))}
                    disabled={teachers.length === 1}
                    style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: teachers.length === 1 ? "rgba(17,17,17,.04)" : "rgba(220,38,38,.07)", border: "none", borderRadius: 6, cursor: teachers.length === 1 ? "default" : "pointer", color: teachers.length === 1 ? "rgba(17,17,17,.2)" : "#dc2626", fontSize: ".65rem", flexShrink: 0 }}
                  >
                    <i className="fas fa-minus" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setTeachers([...teachers, { name: "", subject: "" }])}
                style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", background: "rgba(17,17,17,.04)", border: "1px dashed rgba(17,17,17,.18)", borderRadius: 6, cursor: "pointer", color: "rgba(17,17,17,.5)", fontSize: ".72rem", fontWeight: 600 }}
              >
                <i className="fas fa-plus" style={{ fontSize: ".6rem" }} />Add Teacher
              </button>
            </div>
          </div>

          {/* Fees */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={F_LBL}>Monthly Fee (KES)</label>
              <input type="number" min="0" value={courseFee} onChange={(e) => setCourseFee(e.target.value)} style={F_INP} />
            </div>
            <div>
              <label style={F_LBL}>Reg Fee (KES)</label>
              <input type="number" min="0" value={regFee} onChange={(e) => setRegFee(e.target.value)} style={F_INP} />
            </div>
            <div>
              <label style={F_LBL}>Total Due (KES)</label>
              <input type="number" min="0" value={totalDue} onChange={(e) => setTotalDue(e.target.value)} style={F_INP} />
            </div>
          </div>

          {/* Amount paid */}
          <div>
            <label style={F_LBL}>Amount Paid (KES) *</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required style={F_INP} />
          </div>

          {/* Payment method */}
          <div>
            <label style={F_LBL}>Payment Method *</label>
            <div style={{ display: "flex", gap: 4 }}>
              {METHODS.map(({ v, label }) => (
                <button key={v} type="button" onClick={() => setMethod(v)}
                  style={{ flex: 1, height: 30, borderRadius: 6, border: method === v ? "none" : "1px solid rgba(17,17,17,.12)", background: method === v ? "#E8490F" : "transparent", color: method === v ? "#fff" : "rgba(17,17,17,.45)", fontWeight: method === v ? 700 : 500, fontSize: ".7rem", cursor: "pointer", transition: "all .12s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          {showRef && (
            <div>
              <label style={F_LBL}>Reference</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} style={F_INP} />
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={F_LBL}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              style={{ ...F_INP, height: "auto", padding: "6px 10px", resize: "vertical", fontSize: ".75rem" }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, height: 40, background: loading ? "rgba(232,73,15,.5)" : "#E8490F", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: ".84rem", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" onClick={onClose}
              style={{ flex: 1, height: 40, background: "rgba(17,17,17,.06)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: ".84rem", color: "var(--dark)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Resolve flag inline button ───────────────────────────────────────────────

function ResolveFlag({ flagId, onResolved }: { flagId: string; onResolved: () => void }) {
  const [loading, setLoading] = useState(false);
  async function resolve() {
    setLoading(true);
    try {
      await fetch("/api/corrections", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flagId, status: "resolved" }),
      });
      onResolved();
    }
    finally { setLoading(false); }
  }
  return (
    <button onClick={resolve} disabled={loading} style={{ padding: "2px 9px", borderRadius: 4, cursor: "pointer", border: "1px solid rgba(22,163,74,.25)", background: "rgba(22,163,74,.07)", color: "#16a34a", fontSize: ".65rem", fontWeight: 700 }}>
      {loading ? "…" : "Resolve"}
    </button>
  );
}

// ─── Table styles ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: "8px 12px", textAlign: "left", fontSize: ".58rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".09em", color: "#6b7280",
  whiteSpace: "nowrap", background: "rgba(17,17,17,.02)", borderBottom: "1px solid rgba(17,17,17,.07)",
};
const TD: React.CSSProperties = {
  padding: "0 12px", height: 44, verticalAlign: "middle", fontSize: ".78rem", color: "#111827",
};
const TDm: React.CSSProperties = {
  padding: "0 12px", height: 44, verticalAlign: "middle", fontSize: ".75rem", color: "#4b5563",
};

// ─── Physical student table ───────────────────────────────────────────────────

function PhysicalTable({ students, accentColor }: { students: PhysicalStudent[]; accentColor: string }) {
  const [rows,          setRows]          = useState<PhysicalStudent[]>(students);
  const [deletedIds,    setDeletedIds]    = useState<Set<string>>(new Set());
  const [deleteTarget,  setDeleteTarget]  = useState<PhysicalStudent | null>(null);
  const [editTarget,    setEditTarget]    = useState<PhysicalStudent | null>(null);
  const [resolvedFlags, setResolvedFlags] = useState<Set<string>>(new Set());
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set());
  const [hoveredRow,    setHoveredRow]    = useState<string | null>(null);

  // keep rows in sync when parent re-filters
  React.useEffect(() => { setRows(students); }, [students]);

  const visible = rows.filter((s) => !deletedIds.has(s.id));

  if (visible.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".82rem" }}>
        <i className="fas fa-users-slash" style={{ fontSize: "1.5rem", opacity: .15, display: "block", marginBottom: 10 }} />
        No students in this category
      </div>
    );
  }

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          student={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => setDeletedIds((p) => new Set(p).add(id))}
        />
      )}
      {editTarget && (
        <EditModal
          student={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setRows((prev) => prev.map((s) => s.id === editTarget.id ? { ...s, ...updated } : s));
            setEditTarget(null);
          }}
        />
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={TH}>Student</th>
              <th style={TH}>Course</th>
              <th style={TH}>Teachers</th>
              <th style={TH}>Phone</th>
              <th style={TH}>Email</th>
              <th style={TH}>Monthly Fee</th>
              <th style={TH}>Reg Fee</th>
              <th style={TH}>Total Due</th>
              <th style={TH}>Paid</th>
              <th style={TH}>Balance</th>
              <th style={TH}>Method</th>
              <th style={TH}>Date</th>
              <th style={TH}>Recorded By</th>
              <th style={{ ...TH, width: "1px" }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const visFlags    = s.open_flags.filter((f) => !resolvedFlags.has(f.id));
              const hasFlagOpen = visFlags.length > 0;
              const isExpanded  = expandedFlags.has(s.id);
              const isHovered   = hoveredRow === s.id;
              const balance     = s.total_due != null ? s.total_due - s.amount : null;

              return (
                <React.Fragment key={s.id}>
                  <tr
                    onMouseEnter={() => setHoveredRow(s.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: hasFlagOpen && isExpanded ? "none" : "1px solid rgba(17,17,17,.045)",
                      borderLeft:   hasFlagOpen ? "2px solid rgba(220,38,38,.35)" : "2px solid transparent",
                      background:   hasFlagOpen ? "rgba(220,38,38,.018)" : isHovered ? "rgba(17,17,17,.018)" : "transparent",
                      transition:   "background .08s",
                    }}
                  >
                    {/* Student */}
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".52rem", fontWeight: 800, color: accentColor, flexShrink: 0 }}>
                          {initials(s.name)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontWeight: 700, color: "#111827", fontSize: ".8rem", whiteSpace: "nowrap" }}>{s.name}</span>
                          {hasFlagOpen && (
                            <button
                              onClick={() => setExpandedFlags((p) => { const n = new Set(p); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                              style={{ background: "rgba(220,38,38,.1)", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, fontSize: ".58rem", fontWeight: 800, color: "#dc2626", borderRadius: 3, padding: "1px 5px" }}
                            >
                              <i className="fas fa-flag" style={{ fontSize: ".5rem" }} />{visFlags.length}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td style={TDm}>
                      {s.course_name
                        ? <span style={{ fontWeight: 600, color: "var(--dark)" }}>{s.course_name}</span>
                        : <span style={{ color: "rgba(17,17,17,.22)" }}>—</span>}
                    </td>

                    {/* Teachers */}
                    <td style={TDm}>
                      {s.teachers && s.teachers.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {s.teachers.map((t, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                              <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".75rem" }}>{t.name}</span>
                              {t.subject && (
                                <span style={{ fontSize: ".6rem", background: "rgba(17,17,17,.06)", color: "#4B5563", borderRadius: 4, padding: "1px 5px" }}>{t.subject}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "rgba(17,17,17,.22)" }}>—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td style={TDm}>{s.phone}</td>

                    {/* Email */}
                    <td style={TDm}>
                      {s.email ? (
                        <span style={{ fontSize: ".73rem" }}>{s.email}</span>
                      ) : (
                        <span style={{ color: "rgba(17,17,17,.22)" }}>—</span>
                      )}
                    </td>

                    {/* Monthly fee */}
                    <td style={{ ...TDm, whiteSpace: "nowrap" }}>
                      {s.course_fee_monthly != null
                        ? <span style={{ fontWeight: 600, color: accentColor }}>{kes(s.course_fee_monthly)}</span>
                        : <span style={{ color: "rgba(17,17,17,.22)" }}>—</span>}
                    </td>

                    {/* Reg fee */}
                    <td style={{ ...TDm, whiteSpace: "nowrap" }}>
                      {s.registration_fee != null && s.registration_fee > 0
                        ? kes(s.registration_fee)
                        : <span style={{ color: "rgba(17,17,17,.22)" }}>—</span>}
                    </td>

                    {/* Total due */}
                    <td style={{ ...TD, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {s.total_due != null
                        ? kes(s.total_due)
                        : <span style={{ color: "rgba(17,17,17,.22)", fontWeight: 400, fontSize: ".72rem" }}>—</span>}
                    </td>

                    {/* Paid */}
                    <td style={{ ...TD, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {kes(s.amount)}
                    </td>

                    {/* Balance */}
                    <td style={TD}>
                      {balance == null ? (
                        <span style={{ color: "rgba(17,17,17,.22)", fontSize: ".68rem" }}>—</span>
                      ) : balance <= 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: ".7rem", color: "#16a34a", fontWeight: 700 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a" }} /> Paid
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 20, fontSize: ".68rem", fontWeight: 700, background: "rgba(180,83,9,.09)", color: "#b45309", whiteSpace: "nowrap" }}>
                          {kes(balance)} owes
                        </span>
                      )}
                    </td>

                    {/* Method */}
                    <td style={TDm}>
                      <span style={{ fontSize: ".72rem", fontWeight: 600, background: "rgba(17,17,17,.05)", color: "#374151", padding: "2px 7px", borderRadius: 100, whiteSpace: "nowrap" }}>
                        {METHOD_LABELS[s.method] ?? s.method ?? "—"}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ ...TDm, whiteSpace: "nowrap" }}>{fmtDate(s.created_at)}</td>

                    {/* Recorded by */}
                    <td style={{ ...TDm, maxWidth: 120 }}>
                      {s.recorder ? (
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.recorder}</span>
                      ) : <span style={{ color: "rgba(17,17,17,.22)" }}>—</span>}
                    </td>

                    {/* Actions */}
                    <td style={{ ...TD, textAlign: "right", paddingRight: 10 }}>
                      <div style={{ display: "inline-flex", gap: 4 }}>
                        <button
                          onClick={() => setEditTarget(s)}
                          title="Edit record"
                          style={{ width: 28, height: 28, background: "#f3f4f6", border: "none", borderRadius: 6, cursor: "pointer", color: "#6b7280", fontSize: ".6rem" }}
                        >
                          <i className="fas fa-pencil-alt" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          title="Remove record"
                          style={{ width: 28, height: 28, background: "#f3f4f6", border: "none", borderRadius: 6, cursor: "pointer", color: "#ef4444", fontSize: ".6rem" }}
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline flag panel */}
                  {hasFlagOpen && isExpanded && (
                    <tr style={{ borderBottom: "1px solid rgba(17,17,17,.045)", borderLeft: "2px solid rgba(220,38,38,.3)", background: "rgba(220,38,38,.018)" }}>
                      <td colSpan={14} style={{ padding: "0 14px 10px 54px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {visFlags.map((f) => (
                            <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.12)", borderRadius: 6 }}>
                              <i className="fas fa-flag" style={{ color: "#dc2626", fontSize: ".68rem", marginTop: 2, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: ".78rem", color: "var(--dark)", fontWeight: 500 }}>{f.message}</div>
                                <div style={{ fontSize: ".65rem", color: "rgba(17,17,17,.4)", marginTop: 2 }}>
                                  {f.flagged_by ?? "receptionist"} · {fmtDate(f.created_at)}
                                </div>
                              </div>
                              <ResolveFlag flagId={f.id} onResolved={() => setResolvedFlags((p) => new Set(p).add(f.id))} />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Online platform table ────────────────────────────────────────────────────

function PlatformTable({ students }: { students: OnlineStudent[] }) {
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (students.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".82rem" }}>
        <i className="fas fa-laptop" style={{ fontSize: "1.5rem", opacity: .15, display: "block", marginBottom: 10 }} />
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
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Student", "Email", "Courses", "Date Joined", ""].map((h, i) => (
              <th key={i} style={TH}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const isOpen    = expanded.has(s.id);
            const hasEnrols = s.enrolments.length > 0;
            const isHovered = hoveredRow === s.id;
            return (
              <React.Fragment key={s.id}>
                <tr
                  onMouseEnter={() => setHoveredRow(s.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => hasEnrols && setExpanded((p) => { const n = new Set(p); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                  style={{
                    borderBottom: isOpen && hasEnrols ? "none" : "1px solid rgba(17,17,17,.045)",
                    background:   isHovered ? "rgba(17,17,17,.018)" : "transparent",
                    cursor:       hasEnrols ? "pointer" : undefined,
                    transition:   "background .08s",
                  }}
                >
                  <td style={TD}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".52rem", fontWeight: 800, color: "#2563eb", flexShrink: 0 }}>
                        {initials(s.full_name)}
                      </div>
                      <span style={{ fontWeight: 700, color: "#111827", fontSize: ".8rem", whiteSpace: "nowrap" }}>{s.full_name || "—"}</span>
                    </div>
                  </td>
                  <td style={TDm}>{s.email || "—"}</td>
                  <td style={TD}>
                    {s.enrolments.length === 0
                      ? <span style={{ fontSize: ".72rem", color: "rgba(17,17,17,.28)" }}>No courses</span>
                      : <span style={{ fontSize: ".74rem", fontWeight: 700, color: "#2563eb" }}>{s.enrolments.length} course{s.enrolments.length !== 1 ? "s" : ""}</span>}
                  </td>
                  <td style={{ ...TDm, whiteSpace: "nowrap" }}>{fmtDate(s.created_at)}</td>
                  <td style={{ ...TD, paddingRight: 14, textAlign: "right" }}>
                    {hasEnrols && <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: ".6rem", color: "rgba(17,17,17,.3)" }} />}
                  </td>
                </tr>
                {isOpen && s.enrolments.map((e, idx) => {
                  const mc = MODE_COLOR[e.course_mode] ?? MODE_COLOR.online;
                  return (
                    <tr key={e.course_id} style={{ background: "rgba(37,99,235,.02)", borderBottom: idx === s.enrolments.length - 1 ? "1px solid rgba(17,17,17,.045)" : "1px solid rgba(17,17,17,.03)", borderLeft: "2px solid rgba(37,99,235,.2)" }}>
                      <td style={{ ...TD, paddingLeft: 50 }}>
                        <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".76rem" }}>{e.course_title}</span>
                      </td>
                      <td style={TDm}>
                        <span style={{ fontSize: ".64rem", fontWeight: 700, color: mc.color, background: mc.bg, borderRadius: 4, padding: "2px 6px", textTransform: "capitalize" }}>{e.course_mode}</span>
                      </td>
                      <td style={{ ...TDm, fontSize: ".7rem" }}>Enrolled {fmtDate(e.enrolled_at)}</td>
                      <td colSpan={2} style={{ ...TDm, fontSize: ".7rem" }}>
                        {e.last_accessed_at ? `Last accessed ${fmtDate(e.last_accessed_at)}` : <span style={{ color: "rgba(17,17,17,.22)" }}>Not yet accessed</span>}
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
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  physical: PhysicalStudent[];
  online:   OnlineStudent[];
}

export default function StudentsTabClient({ physical, online }: Props) {
  const [activeKey, setActiveKey] = useState<CatKey | null>(null);
  const [search,    setSearch]    = useState("");

  const q = search.trim().toLowerCase();

  const byType = {
    new:          physical.filter((s) => s.student_type === "new"),
    current_old:  physical.filter((s) => s.student_type === "current_old"),
    zoom_virtual: physical.filter((s) => s.student_type === "zoom_virtual"),
  };

  const counts: Record<CatKey, number> = {
    new:          byType.new.length,
    current_old:  byType.current_old.length,
    zoom_virtual: byType.zoom_virtual.length,
    platform:     online.length,
  };

  function studentsForKey(key: CatKey): PhysicalStudent[] {
    const base = key === "new" ? byType.new : key === "current_old" ? byType.current_old : byType.zoom_virtual;
    if (!q) return base;
    return base.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.email ?? "").toLowerCase().includes(q)
    );
  }

  function handleCardClick(key: CatKey) {
    setActiveKey((prev) => (prev === key ? null : key));
    setSearch("");
  }

  const activeCat = CATS.find((c) => c.key === activeKey);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── 4 Category cards ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {CATS.map((cat) => {
          const isActive = activeKey === cat.key;
          const count    = counts[cat.key];

          return (
            <button
              key={cat.key}
              onClick={() => handleCardClick(cat.key)}
              style={{
                background:   isActive ? cat.soft : "#fff",
                border:       `2px solid ${isActive ? cat.color : "rgba(17,17,17,.08)"}`,
                borderRadius: "14px",
                padding:      "20px 20px 18px",
                cursor:       "pointer",
                textAlign:    "left",
                transition:   "all .15s",
                boxShadow:    isActive ? `0 4px 20px ${cat.color}22` : "0 1px 3px rgba(0,0,0,.04)",
                position:     "relative",
                overflow:     "hidden",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: cat.color, borderRadius: "12px 12px 0 0" }} />

              <div style={{ width: 40, height: 40, borderRadius: 12, background: isActive ? `${cat.color}22` : `${cat.color}12`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <i className={`fas ${cat.icon}`} style={{ color: cat.color, fontSize: "1rem" }} />
              </div>

              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: isActive ? cat.color : "var(--dark)", lineHeight: 1, marginBottom: 6 }}>
                {count}
              </div>

              <div style={{ fontSize: ".82rem", fontWeight: 700, color: isActive ? cat.color : "var(--dark)", marginBottom: 3 }}>
                {cat.label}
              </div>

              <div style={{ fontSize: ".68rem", color: "var(--muted)", lineHeight: 1.4 }}>
                {cat.sub}
              </div>

              {isActive && (
                <div style={{ position: "absolute", bottom: 14, right: 16, display: "flex", alignItems: "center", gap: 4, fontSize: ".62rem", fontWeight: 700, color: cat.color }}>
                  <i className="fas fa-table" style={{ fontSize: ".55rem" }} /> Viewing
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Open table ───────────────────────────────────────────────────── */}
      {activeKey && activeCat && (
        <div style={{ background: "#fff", border: `1px solid ${activeCat.border}`, borderRadius: 14, overflow: "hidden", boxShadow: `0 4px 20px ${activeCat.color}10` }}>

          {/* Table header bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(17,17,17,.07)", background: activeCat.soft }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${activeCat.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className={`fas ${activeCat.icon}`} style={{ color: activeCat.color, fontSize: ".85rem" }} />
            </div>
            <div>
              <div style={{ fontSize: ".85rem", fontWeight: 800, color: activeCat.color }}>{activeCat.label}</div>
              <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>{counts[activeKey]} student{counts[activeKey] !== 1 ? "s" : ""} total</div>
            </div>

            {/* Search — not for platform */}
            {activeKey !== "platform" && (
              <div style={{ marginLeft: "auto", position: "relative", display: "flex", alignItems: "center" }}>
                <i className="fas fa-search" style={{ position: "absolute", left: 8, color: "rgba(17,17,17,.3)", fontSize: ".62rem", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Search name, phone, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ height: 30, paddingLeft: 26, paddingRight: search ? 26 : 10, width: 220, borderRadius: 7, border: "1px solid rgba(17,17,17,.12)", fontSize: ".74rem", color: "var(--dark)", background: "#fff", outline: "none" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ position: "absolute", right: 6, background: "none", border: "none", color: "rgba(17,17,17,.3)", cursor: "pointer", fontSize: ".6rem" }}>
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
            )}
          </div>

          {activeKey === "platform"
            ? <PlatformTable students={online} />
            : <PhysicalTable
                students={studentsForKey(activeKey)}
                accentColor={activeCat.color}
              />
          }
        </div>
      )}

      {/* Prompt when nothing selected */}
      {!activeKey && (
        <div style={{ background: "rgba(17,17,17,.025)", border: "1.5px dashed rgba(17,17,17,.1)", borderRadius: 14, padding: "32px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".82rem" }}>
          <i className="fas fa-hand-pointer" style={{ fontSize: "1.4rem", opacity: .2, display: "block", marginBottom: 10 }} />
          Select a category above to view the student list
        </div>
      )}
    </div>
  );
}
