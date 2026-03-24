"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StaffMember = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  courses?: {
    id: string;
    title: string;
    mode: string;
    is_published: boolean;
    price: number | null;
  }[];
};

type TabKey = "manager" | "receptionist" | "teacher" | "social_media";

const TAB_CONFIG: { key: TabKey; label: string; icon: string; color: string }[] = [
  { key: "manager",      label: "Managers",      icon: "fa-user-shield",        color: "var(--teal2)" },
  { key: "receptionist", label: "Receptionists", icon: "fa-user-tie",           color: "#3b82f6"      },
  { key: "teacher",      label: "Teachers",       icon: "fa-chalkboard-teacher", color: "#8b5cf6"      },
  { key: "social_media", label: "Content Team",   icon: "fa-bullhorn",           color: "var(--gold)"  },
];

const ROLE_AVATAR: Record<string, string> = {
  manager:      "linear-gradient(135deg,var(--teal),var(--teal2))",
  receptionist: "linear-gradient(135deg,#3b82f6,#60a5fa)",
  teacher:      "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  social_media: "linear-gradient(135deg,var(--gold),var(--gold2))",
};

const MODE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  online:   { label: "Online",   color: "#2563eb", bg: "rgba(37,99,235,.1)"  },
  physical: { label: "Physical", color: "var(--teal2)", bg: "rgba(15,179,187,.1)" },
  hybrid:   { label: "Hybrid",   color: "#8b5cf6", bg: "rgba(139,92,246,.1)" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string | null, username: string | null) {
  const n = name || username || "?";
  return n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Teacher row (expandable) ─────────────────────────────────────────────────

function TeacherRow({ staff }: { staff: StaffMember }) {
  const [open, setOpen] = useState(false);
  const courses = staff.courses ?? [];
  const live = courses.filter((c) => c.is_published).length;

  return (
    <>
      <tr style={{ cursor: courses.length > 0 ? "pointer" : undefined }}
          onClick={() => courses.length > 0 && setOpen((p) => !p)}>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: staff.is_active ? ROLE_AVATAR[staff.role] : "var(--dark3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: ".62rem", fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {initials(staff.full_name, staff.username)}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>
                {staff.full_name || "—"}
              </div>
              {staff.email && (
                <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{staff.email}</div>
              )}
            </div>
          </div>
        </td>
        <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>
          {courses.length === 0
            ? <span style={{ color: "var(--muted)" }}>No courses</span>
            : <span>{courses.length} course{courses.length !== 1 ? "s" : ""} · <span style={{ color: "#16a34a", fontWeight: 600 }}>{live} live</span></span>}
        </td>
        <td>
          {staff.is_active
            ? <span style={{ fontSize: ".72rem", fontWeight: 700, color: "#16a34a", background: "rgba(22,163,74,.1)", border: "1px solid rgba(22,163,74,.25)", borderRadius: "5px", padding: "2px 8px" }}>Active</span>
            : <span style={{ fontSize: ".72rem", fontWeight: 700, color: "#dc2626", background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "5px", padding: "2px 8px" }}>Inactive</span>}
        </td>
        <td style={{ fontSize: ".75rem", color: "var(--muted)" }}>{fmtDate(staff.created_at)}</td>
        <td>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <Link href={`/dashboard/owner/team/${staff.id}`}
              style={{ fontSize: ".72rem", padding: "3px 10px", borderRadius: "6px", background: "rgba(17,17,17,.05)", border: "1px solid rgba(17,17,17,.1)", color: "var(--dark)", textDecoration: "none", fontWeight: 600 }}
              onClick={(e) => e.stopPropagation()}>
              <i className="fas fa-ellipsis-h" />
            </Link>
            {courses.length > 0 && (
              <span style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                <i className={`fas fa-chevron-${open ? "up" : "down"}`} />
              </span>
            )}
          </div>
        </td>
      </tr>
      {open && courses.map((c) => (
        <tr key={c.id} style={{ background: "rgba(139,92,246,.03)" }}>
          <td style={{ paddingLeft: "52px" }} colSpan={1}>
            <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--dark)" }}>{c.title}</span>
          </td>
          <td>
            {MODE_BADGE[c.mode] && (
              <span style={{ fontSize: ".68rem", fontWeight: 700, color: MODE_BADGE[c.mode].color, background: MODE_BADGE[c.mode].bg, borderRadius: "4px", padding: "2px 7px" }}>
                {MODE_BADGE[c.mode].label}
              </span>
            )}
          </td>
          <td>
            {c.is_published
              ? <span style={{ fontSize: ".68rem", color: "#16a34a", fontWeight: 600 }}>Published</span>
              : <span style={{ fontSize: ".68rem", color: "var(--muted)" }}>Draft</span>}
          </td>
          <td style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--dark)" }}>
            {c.price != null ? `KES ${c.price.toLocaleString()}` : "—"}
          </td>
          <td />
        </tr>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  managers:      StaffMember[];
  receptionists: StaffMember[];
  teachers:      StaffMember[];
  contentTeam:   StaffMember[];
}

export default function StaffTabsClient({ managers, receptionists, teachers, contentTeam }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("manager");

  const dataMap: Record<TabKey, StaffMember[]> = {
    manager:      managers,
    receptionist: receptionists,
    teacher:      teachers,
    social_media: contentTeam,
  };

  const active = TAB_CONFIG.find((t) => t.key === activeTab)!;
  const rows   = dataMap[activeTab];

  const thStyle: React.CSSProperties = {
    padding: "8px 14px", textAlign: "left",
    fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: ".08em", color: "var(--muted)", whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {TAB_CONFIG.map((tab) => {
          const count    = dataMap[tab.key].length;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", borderRadius: "9px", cursor: "pointer",
              fontSize: ".8rem", fontWeight: 700,
              background: isActive ? tab.color : "rgba(17,17,17,.04)",
              border: isActive ? `1px solid ${tab.color}` : "1px solid rgba(17,17,17,.1)",
              color: isActive ? "#fff" : "var(--muted)", transition: "all .15s",
            }}>
              <i className={`fas ${tab.icon}`} style={{ fontSize: ".75rem", opacity: isActive ? 1 : .7 }} />
              {tab.label}
              <span style={{
                padding: "1px 7px", borderRadius: "8px", fontSize: ".65rem", fontWeight: 800,
                background: isActive ? "rgba(255,255,255,.25)" : "rgba(17,17,17,.08)",
                color: isActive ? "#fff" : "var(--muted)",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "12px 16px", borderBottom: `2px solid ${active.color}`,
          display: "flex", alignItems: "center", gap: "8px", background: "#fafafa",
        }}>
          <i className={`fas ${active.icon}`} style={{ color: active.color }} />
          <span style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--dark)" }}>{active.label}</span>
          <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
            {rows.length === 0 ? "None yet" : `${rows.length} member${rows.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            <i className={`fas ${active.icon}`} style={{ fontSize: "1.8rem", opacity: .2, display: "block", marginBottom: "12px" }} />
            No {active.label.toLowerCase()} added yet
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(17,17,17,.03)", borderBottom: "1px solid rgba(17,17,17,.08)" }}>
                  <th style={thStyle}>Name</th>
                  {activeTab === "teacher"
                    ? <th style={thStyle}>Courses</th>
                    : <th style={thStyle}>Username</th>}
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Joined</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "teacher"
                  ? rows.map((s) => <TeacherRow key={s.id} staff={s} />)
                  : rows.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                          <div style={{
                            width: "32px", height: "32px", borderRadius: "50%",
                            background: s.is_active ? ROLE_AVATAR[s.role] : "var(--dark3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: ".62rem", fontWeight: 700, color: "#fff", flexShrink: 0,
                          }}>
                            {initials(s.full_name, s.username)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>
                              {s.full_name || "—"}
                            </div>
                            {s.email && (
                              <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{s.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle", fontFamily: "monospace", fontSize: ".78rem", color: "var(--muted)" }}>
                        {s.username ? `@${s.username}` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        {s.is_active
                          ? <span style={{ fontSize: ".72rem", fontWeight: 700, color: "#16a34a", background: "rgba(22,163,74,.1)", border: "1px solid rgba(22,163,74,.25)", borderRadius: "5px", padding: "2px 8px" }}>Active</span>
                          : <span style={{ fontSize: ".72rem", fontWeight: 700, color: "#dc2626", background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "5px", padding: "2px 8px" }}>Inactive</span>}
                      </td>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle", fontSize: ".75rem", color: "var(--muted)" }}>
                        {fmtDate(s.created_at)}
                      </td>
                      <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                        <Link href={`/dashboard/owner/team/${s.id}`}
                          style={{ fontSize: ".72rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(17,17,17,.05)", border: "1px solid rgba(17,17,17,.1)", color: "var(--dark)", textDecoration: "none", fontWeight: 600 }}>
                          <i className="fas fa-ellipsis-h" />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
