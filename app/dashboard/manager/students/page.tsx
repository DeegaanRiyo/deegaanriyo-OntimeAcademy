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

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
const METHOD_LABELS: Record<string, string> = { cash: "Cash", bank_transfer: "Bank Transfer" };

type FlagTarget = { id: string; label: string };

export default function ManagerStudentsPage() {
  const [students,   setStudents]   = useState<Student[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [flagTarget, setFlagTarget] = useState<FlagTarget | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/receptionist/walk-in-members")
      .then((r) => r.json())
      .then((j) => setStudents((j.members ?? []).filter((m: any) => m.type === "physical_class")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.class_name.toLowerCase().includes(q);
  });

  const grouped: Record<string, Student[]> = {};
  for (const s of filtered) {
    const key = s.class_name || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }
  const classes = Object.keys(grouped).sort();

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Students</h2>
          <p>Physical class students — view only. Use flag to report corrections.</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "20px", maxWidth: "380px" }}>
        <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: ".8rem", pointerEvents: "none" }} />
        <input
          type="text" placeholder="Search by name, phone, or class…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="form-input" style={{ paddingLeft: "34px" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: ".8rem" }}>
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", color: "var(--muted)", fontSize: ".85rem" }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Loading…
        </div>
      ) : classes.length === 0 ? (
        <div className="card">
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            {search ? `No results for "${search}"` : "No students registered yet."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {classes.map((cls) => (
            <div key={cls} className="card">
              <div className="card-head">
                <h3><i className="fas fa-chalkboard-teacher" /> {cls}</h3>
                <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                  {grouped[cls].length} student{grouped[cls].length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Phone</th>
                      <th>Amount Paid</th>
                      <th>Method</th>
                      <th>Registered</th>
                      <th>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[cls].map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(193,68,14,.1)", border: "1px solid rgba(193,68,14,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 700, color: "var(--teal2)", flexShrink: 0 }}>
                              {initials(s.name)}
                            </div>
                            <span style={{ fontWeight: 600, color: "var(--dark)" }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: ".82rem" }}>{s.phone}</td>
                        <td style={{ fontWeight: 600, color: "var(--dark)" }}>KES {s.total_paid.toLocaleString()}</td>
                        <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>{METHOD_LABELS[s.method] ?? s.method}</td>
                        <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>{fmtDate(s.payment_date)}</td>
                        <td>
                          <button
                            onClick={() => setFlagTarget({ id: s.id, label: `${s.name} – ${cls}` })}
                            title="Flag for correction"
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", fontSize: ".72rem", fontWeight: 600, cursor: "pointer", background: "rgba(180,131,9,.07)", border: "1px solid rgba(180,131,9,.25)", color: "#b45309" }}
                          >
                            <i className="fas fa-flag" /> Flag
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
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
