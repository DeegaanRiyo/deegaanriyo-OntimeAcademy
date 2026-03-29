"use client";

import { useState } from "react";

export type MemberRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  sub: {
    is_active: boolean;
    subscription_start: string | null;
    subscription_end: string | null;
    profession: string | null;
    bio: string | null;
    is_public: boolean;
    slug: string | null;
  } | null;
  status: "active" | "expiring" | "expired" | "none";
  days: number | null;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function MemberExpandTable({ members }: { members: MemberRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = members.filter((m) =>
    !q ||
    (m.full_name ?? "").toLowerCase().includes(q) ||
    (m.email ?? "").toLowerCase().includes(q) ||
    (m.phone ?? "").includes(q) ||
    (m.sub?.profession ?? "").toLowerCase().includes(q)
  );

  function toggle(id: string) {
    setOpenId(prev => prev === id ? null : id);
  }

  return (
    <div>
      {/* Search */}
      <div style={{ padding: "10px 16px 0", maxWidth: "380px" }}>
        <div style={{ position: "relative" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: ".8rem", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: "34px" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: ".8rem" }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
          No results for &ldquo;{search}&rdquo;
        </div>
      ) : null}

    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Profession</th>
            <th>Since</th>
            <th>Expires</th>
            <th>Days Left</th>
            <th>Status</th>
            <th style={{ width: 28 }} />
          </tr>
        </thead>
        <tbody>
          {filtered.map(m => {
            const open = openId === m.id;
            const initials = (m.full_name || m.email || "?")
              .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
            const avatarBg = m.status === "active" || m.status === "expiring"
              ? "linear-gradient(135deg,var(--teal),var(--teal2))"
              : "var(--dark3)";

            return (
              <>
                <tr
                  key={m.id}
                  className="tbl-expand-row"
                  onClick={() => toggle(m.id)}
                >
                  <td>
                    <div className="td-name">
                      <div className="td-avatar" style={{ background: avatarBg }}>{initials}</div>
                      <div>
                        <div className="td-main">{m.full_name || "—"}</div>
                        <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>{m.sub?.profession || "—"}</td>
                  <td style={{ color: "var(--muted)", fontSize: ".78rem" }}>{fmtDate(m.sub?.subscription_start)}</td>
                  <td style={{ fontSize: ".78rem" }}>{fmtDate(m.sub?.subscription_end)}</td>
                  <td style={{
                    fontSize: ".78rem", fontWeight: 600,
                    color: m.days === null ? "var(--muted)" : m.days <= 0 ? "var(--red)" : m.days <= 7 ? "var(--gold2)" : "var(--dark)",
                  }}>
                    {m.days === null ? "—" : m.days <= 0 ? `${Math.abs(m.days)}d overdue` : `${m.days}d`}
                  </td>
                  <td>
                    {m.status === "active"   && <span className="badge gr"><span className="badge-dot" />Active</span>}
                    {m.status === "expiring" && <span className="badge gd"><span className="badge-dot" />Expiring</span>}
                    {m.status === "expired"  && <span className="badge rd"><span className="badge-dot" />Expired</span>}
                    {m.status === "none"     && <span className="badge"><span className="badge-dot" />No record</span>}
                  </td>
                  <td>
                    <i
                      className="fas fa-chevron-down expand-chevron"
                      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
                    />
                  </td>
                </tr>

                {open && (
                  <tr key={`${m.id}-detail`} className="tbl-expand-body">
                    <td colSpan={7}>
                      <div className="row-detail">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{m.email || "—"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{m.phone || "—"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Profession</span>
                            <span className="detail-value">{m.sub?.profession || "—"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Member Since</span>
                            <span className="detail-value">{fmtDate(m.sub?.subscription_start)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Expires</span>
                            <span className="detail-value">{fmtDate(m.sub?.subscription_end)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Public Profile</span>
                            <span className="detail-value">
                              {m.sub?.is_public && m.sub?.slug
                                ? <a href={`/members/${m.sub.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal2)" }}>
                                    View →
                                  </a>
                                : "Private"}
                            </span>
                          </div>
                        </div>
                        {m.sub?.bio && (
                          <div className="detail-item" style={{ marginTop: 6 }}>
                            <span className="detail-label">Bio</span>
                            <span className="detail-value" style={{ maxWidth: 480, lineHeight: 1.55 }}>{m.sub.bio}</span>
                          </div>
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
    </div>
  );
}
