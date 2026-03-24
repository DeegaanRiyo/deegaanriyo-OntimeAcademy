"use client";

import { useState } from "react";

export type TeacherCourse = {
  id: string;
  title: string;
  mode: string;
  is_published: boolean;
  price: number;
};

export type TeacherRow = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  courses: TeacherCourse[];
};

const MODE_LABELS: Record<string, string> = {
  online:   "Online",
  physical: "Physical",
  hybrid:   "Hybrid",
};

const MODE_BADGE: Record<string, string> = {
  online:   "badge bl",
  physical: "badge tl",
  hybrid:   "badge pu",
};

export default function TeacherExpandTable({ teachers }: { teachers: TeacherRow[] }) {
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
            <th>Total</th>
            <th>Published</th>
            <th>Online</th>
            <th>Physical</th>
            <th>Status</th>
            <th style={{ width: 28 }} />
          </tr>
        </thead>
        <tbody>
          {teachers.map(t => {
            const open      = openId === t.id;
            const published = t.courses.filter(c => c.is_published).length;
            const online    = t.courses.filter(c => c.mode === "online").length;
            const physical  = t.courses.filter(c => c.mode !== "online").length;
            const initials  = (t.full_name || t.email || "?")
              .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

            return (
              <>
                <tr key={t.id} className="tbl-expand-row" onClick={() => toggle(t.id)}>
                  <td>
                    <div className="td-name">
                      <div className="td-avatar" style={{ background: "linear-gradient(135deg,var(--blue),#3b82f6)" }}>
                        {initials}
                      </div>
                      <div>
                        <div className="td-main">{t.full_name || "—"}</div>
                        <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{t.courses.length}</td>
                  <td>
                    {published > 0
                      ? <span className="badge gr">{published} live</span>
                      : <span className="badge" style={{ color: "var(--muted)" }}>0</span>}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>{online}</td>
                  <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>{physical}</td>
                  <td>
                    <span className={t.is_active ? "badge gr" : "badge rd"}>
                      <span className="badge-dot" />{t.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <i
                      className="fas fa-chevron-down expand-chevron"
                      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
                    />
                  </td>
                </tr>

                {open && (
                  <tr key={`${t.id}-detail`} className="tbl-expand-body">
                    <td colSpan={7}>
                      <div className="row-detail">
                        <div className="detail-grid" style={{ marginBottom: 12 }}>
                          <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{t.email || "—"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Joined</span>
                            <span className="detail-value">
                              {new Date(t.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Account</span>
                            <span className="detail-value">
                              <span className={t.is_active ? "badge gr" : "badge rd"}>
                                <span className="badge-dot" />{t.is_active ? "Active" : "Inactive"}
                              </span>
                            </span>
                          </div>
                        </div>

                        {t.courses.length > 0 && (
                          <>
                            <div className="detail-sub-label">Courses ({t.courses.length})</div>
                            <div className="detail-rows">
                              {t.courses.map(c => (
                                <div key={c.id} className="detail-row">
                                  <span className="detail-row-name">{c.title}</span>
                                  <span className={MODE_BADGE[c.mode] ?? "badge"}>
                                    {MODE_LABELS[c.mode] ?? c.mode}
                                  </span>
                                  <span className={c.is_published ? "badge gr" : "badge gd"}>
                                    {c.is_published ? "Live" : "Draft"}
                                  </span>
                                  <span className="detail-row-meta">
                                    {c.price > 0 ? `KES ${c.price.toLocaleString()}` : "Free"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {t.courses.length === 0 && (
                          <p style={{ fontSize: "11.5px", color: "var(--muted)", margin: 0 }}>No courses created yet.</p>
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
