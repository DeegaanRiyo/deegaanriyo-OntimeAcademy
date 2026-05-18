"use client";

import { useEffect, useState } from "react";
import CorrectionNoteModal from "@/components/dashboard/CorrectionNoteModal";

type Student = {
  id:           string;
  name:         string;
  phone:        string;
  email:        string | null;
  profile_id:   string | null;
  class_name:   string;
  amount:       number;
  total_paid:   number;
  outstanding:  number;
  method:       string;
  reference:    string | null;
  notes:        string | null;
  payment_date: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function cleanNotes(notes: string | null) {
  if (!notes) return "";
  const metaKeys = ["Class:", "student_type=", "monthly=", "reg_fee=", "total_due=", "cash=", "mpesa=", "mpesa_ref=", "joined_at="];
  return notes.split(". ").filter(p => !metaKeys.some(k => p.startsWith(k))).join(". ");
}
const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", mpesa: "M-Pesa", both: "Cash + M-Pesa", bank_transfer: "Bank Transfer",
};

// ─── Style tokens ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: "6px 12px", textAlign: "left", fontSize: ".55rem",
  fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em",
  color: "rgba(17,17,17,.32)", whiteSpace: "nowrap", background: "rgba(17,17,17,.015)",
};
const TD: React.CSSProperties = {
  padding: "0 12px", height: "36px", verticalAlign: "middle",
  fontSize: ".75rem", color: "var(--dark)",
};
const TD_M: React.CSSProperties = {
  padding: "0 12px", height: "36px", verticalAlign: "middle",
  fontSize: ".72rem", color: "rgba(17,17,17,.45)",
};
const ACT_BTN: React.CSSProperties = {
  width: "24px", height: "24px", display: "inline-flex", alignItems: "center",
  justifyContent: "center", background: "transparent", border: "none",
  borderRadius: "4px", cursor: "pointer", color: "rgba(17,17,17,.35)",
  textDecoration: "none", fontSize: ".6rem", transition: "all .1s",
};

type FlagTarget = { id: string; label: string };

export default function ManagerStudentsPage() {
  const [students,   setStudents]   = useState<Student[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [flagTarget, setFlagTarget] = useState<FlagTarget | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/receptionist/walk-in-members")
      .then((r) => r.json())
      .then((j) => setStudents((j.members ?? []).filter((m: any) => m.type === "physical_class" || m.type === "online_class")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const q = search.trim().toLowerCase();
  const filtered = students.filter((s) =>
    !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.class_name.toLowerCase().includes(q)
  );

  const grouped: Record<string, Student[]> = {};
  for (const s of filtered) {
    const key = s.class_name || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const classes = Object.keys(grouped).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Students</h2>
          <p>Physical class students — view only. Use flag to report corrections.</p>
        </div>
      </div>

      {/* Ghost Search */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", maxWidth: "320px" }}>
        <i className="fas fa-search" style={{ position: "absolute", left: "8px", color: "rgba(17,17,17,.28)", fontSize: ".68rem", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="Search students…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", height: "30px", paddingLeft: "26px", paddingRight: search ? "26px" : "8px",
            background: "transparent", border: "none",
            borderBottom: "1.5px solid rgba(17,17,17,.1)",
            borderRadius: 0, fontSize: ".78rem", color: "var(--dark)",
            outline: "none", boxSizing: "border-box",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: "2px", background: "none", border: "none", color: "rgba(17,17,17,.3)", cursor: "pointer", fontSize: ".65rem", padding: "4px" }}>
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "48px 0", color: "rgba(17,17,17,.4)", fontSize: ".82rem", textAlign: "center" }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading student records…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", padding: "48px 20px", textAlign: "center", color: "rgba(17,17,17,.35)", fontSize: ".82rem" }}>
          {search ? `No results for "${search}"` : "No students registered yet."}
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  <th style={TH}>Student</th>
                  <th style={TH}>Phone</th>
                  <th style={TH}>Course</th>
                  <th style={TH}>Paid</th>
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
                      <td colSpan={7} style={{ padding: "8px 14px 4px", background: "transparent" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: ".56rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(17,17,17,.28)", whiteSpace: "nowrap" }}>
                            {cls}
                          </span>
                          <div style={{ flex: 1, height: "1px", background: "rgba(17,17,17,.06)" }} />
                          <span style={{ fontSize: ".56rem", color: "rgba(17,17,17,.22)", fontWeight: 600 }}>
                            {grouped[cls].length}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {grouped[cls].map((s) => {
                      const isHovered = hoveredRow === s.id;
                      return (
                        <tr
                          key={s.id}
                          onMouseEnter={() => setHoveredRow(s.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            borderBottom: "1px solid rgba(17,17,17,.045)",
                            background: isHovered ? "rgba(17,17,17,.018)" : "transparent",
                            transition: "background .08s",
                          }}
                        >
                          <td style={TD}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{
                                width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                                background: "rgba(232,73,15,.1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: ".5rem", fontWeight: 700, color: "#E8490F",
                              }}>
                                {initials(s.name)}
                              </div>
                              <span style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".8rem", whiteSpace: "nowrap" }}>{s.name}</span>
                            </div>
                          </td>
                          <td style={TD_M}>{s.phone}</td>
                          <td style={TD_M}>{s.class_name}</td>
                          <td style={{ ...TD, fontWeight: 600 }}>KES {s.total_paid.toLocaleString()}</td>
                          <td style={TD_M}>{METHOD_LABELS[s.method] ?? s.method}</td>
                          <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(s.payment_date)}</td>
                          <td style={{ ...TD, textAlign: "right", opacity: isHovered ? 1 : 0, transition: "opacity .1s", paddingRight: "10px" }}>
                            <button
                              onClick={() => setFlagTarget({ id: s.id, label: `${s.name} – ${cls}` })}
                              title="Flag for correction"
                              style={{ ...ACT_BTN, color: "#dc2626" }}
                            >
                              <i className="fas fa-flag" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {flagTarget && (
        <CorrectionNoteModal
          recordType="student"
          recordId={flagTarget.id}
          recordLabel={flagTarget.label}
          onClose={() => setFlagTarget(null)}
        />
      )}
    </div>
  );
}

