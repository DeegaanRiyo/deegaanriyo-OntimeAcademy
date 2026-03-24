"use client";

import { useState } from "react";

export type StudentEnrolment = {
  course_id: string;
  course_title: string;
  course_mode: string;
  enrolled_at: string;
  last_accessed_at: string | null;
};

export type StudentRow = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  enrolments: StudentEnrolment[];
};

const MODE_BADGE: Record<string, string> = {
  online:   "badge bl",
  physical: "badge tl",
  hybrid:   "badge pu",
};
const MODE_LABELS: Record<string, string> = {
  online:   "Online",
  physical: "Physical",
  hybrid:   "Hybrid",
};

function fmtDateShort(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function StudentExpandTable({ students }: { students: StudentRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId(prev => prev === id ? null : id);
  }

  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Joined</th>
            <th>Courses</th>
            <th>Online</th>
            <th>Physical / Hybrid</th>
            <th style={{ width: 28 }} />
          </tr>
        </thead>
        <tbody>
          {students.map(s => {
            const open     = openId === s.id;
            const online   = s.enrolments.filter(e => e.course_mode === "online").length;
            const physical = s.enrolments.filter(e => e.course_mode !== "online").length;
            const initials = (s.full_name || s.email || "?")
              .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

            return (
              <>
                <tr key={s.id} className="tbl-expand-row" onClick={() => toggle(s.id)}>
                  <td>
                    <div className="td-name">
                      <div className="td-avatar" style={{ background: "linear-gradient(135deg,var(--purple),#a78bfa)" }}>
                        {initials}
                      </div>
                      <div>
                        <div className="td-main">{s.full_name || "—"}</div>
                        <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                    {fmtDateShort(s.created_at)}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {s.enrolments.length > 0 ? s.enrolments.length : <span style={{ color: "var(--muted)" }}>0</span>}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>{online}</td>
                  <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>{physical}</td>
                  <td>
                    <i
                      className="fas fa-chevron-down expand-chevron"
                      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
                    />
                  </td>
                </tr>

                {open && (
                  <tr key={`${s.id}-detail`} className="tbl-expand-body">
                    <td colSpan={6}>
                      <div className="row-detail">
                        <div className="detail-grid" style={{ marginBottom: s.enrolments.length > 0 ? 12 : 0 }}>
                          <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{s.email || "—"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Joined</span>
                            <span className="detail-value">{fmtDateShort(s.created_at)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Total Enrolled</span>
                            <span className="detail-value">{s.enrolments.length} course{s.enrolments.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>

                        {s.enrolments.length > 0 && (
                          <>
                            <div className="detail-sub-label">Enrolled Courses</div>
                            <div className="detail-rows">
                              {s.enrolments.map(e => (
                                <div key={e.course_id} className="detail-row">
                                  <span className="detail-row-name">{e.course_title}</span>
                                  <span className={MODE_BADGE[e.course_mode] ?? "badge"}>
                                    {MODE_LABELS[e.course_mode] ?? e.course_mode}
                                  </span>
                                  <span className="detail-row-meta">
                                    Enrolled {fmtDateShort(e.enrolled_at)}
                                  </span>
                                  {e.last_accessed_at && (
                                    <span className="detail-row-meta">
                                      · Last seen {fmtDateShort(e.last_accessed_at)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {s.enrolments.length === 0 && (
                          <p style={{ fontSize: "11.5px", color: "var(--muted)", margin: 0 }}>Not enrolled in any courses yet.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
