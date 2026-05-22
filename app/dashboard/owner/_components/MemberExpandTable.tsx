"use client";

import React, { useState } from "react";

// ── DeleteMemberModal ─────────────────────────────────────────────────────────

function DeleteMemberModal({ member, onClose, onDeleted }: {
  member:    MemberRow;
  onClose:   () => void;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/members/${member.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete");
      onDeleted(member.id);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }} onClick={onClose}>
      <div style={{ maxWidth: "380px", width: "100%", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,.15)", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#dc2626", display: "flex", alignItems: "center", gap: "8px", fontSize: ".92rem" }}>
            <i className="fas fa-trash" />Delete Member
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(17,17,17,.4)", cursor: "pointer" }}><i className="fas fa-times" /></button>
        </div>
        <p style={{ fontSize: ".85rem", color: "var(--dark)", marginBottom: "8px" }}>
          Delete membership subscription for <strong>{member.full_name || member.email}</strong>? This cannot be undone.
        </p>
        <p style={{ fontSize: ".75rem", color: "rgba(17,17,17,.4)", marginBottom: "4px" }}>
          Note: only the membership subscription record will be deleted. The user account remains.
        </p>
        {error && (
          <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "7px", padding: "9px 12px", color: "#dc2626", fontSize: ".8rem", marginBottom: "12px" }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button onClick={confirm} disabled={loading}
            style={{ flex: 1, height: "38px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: ".82rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {loading ? <><i className="fas fa-spinner fa-spin" />Deleting…</> : <><i className="fas fa-trash" />Delete</>}
          </button>
          <button onClick={onClose}
            style={{ flex: 1, height: "38px", background: "rgba(17,17,17,.05)", border: "1px solid rgba(17,17,17,.12)", borderRadius: "8px", fontWeight: 700, fontSize: ".82rem", color: "var(--dark)", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export type MemberRow = {
  id:                 string;
  full_name:          string | null;
  email:              string | null;
  phone:              string | null;
  sub: {
    is_active:          boolean;
    subscription_start: string | null;
    subscription_end:   string | null;
    profession:         string | null;
    bio:                string | null;
    is_public:          boolean;
    slug:               string | null;
  } | null;
  status:             "active" | "expiring" | "expired" | "none";
  days:               number | null;
  amount_paid:        number;
  method:             string | null;
  reference:          string | null;
  recorded_by_name:   string | null;
  payment_created_at: string | null;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

const METHOD_LABELS: Record<string, string> = { cash: "Cash", mpesa: "M-Pesa", bank_transfer: "Bank" };

// ── Table cell styles ─────────────────────────────────────────────────────────
const TH: React.CSSProperties = {
  padding: "7px 12px", textAlign: "left", fontSize: ".58rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".09em", color: "#6b7280",
  whiteSpace: "nowrap", background: "rgba(17,17,17,.015)",
};
const TD: React.CSSProperties = {
  padding: "0 12px", height: "44px", verticalAlign: "middle",
  fontSize: ".75rem", color: "#111827",
};
const TD_M: React.CSSProperties = {
  padding: "0 12px", height: "44px", verticalAlign: "middle",
  fontSize: ".72rem", color: "#4B5563",
};

export default function MemberExpandTable({ members: initialMembers }: { members: MemberRow[] }) {
  const [localMembers,  setLocalMembers]  = useState<MemberRow[]>(initialMembers);
  const [openId,        setOpenId]        = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [deleteTarget,  setDeleteTarget]  = useState<MemberRow | null>(null);

  const q = search.trim().toLowerCase();
  const filtered = localMembers.filter((m) =>
    !q ||
    (m.full_name   ?? "").toLowerCase().includes(q) ||
    (m.email       ?? "").toLowerCase().includes(q) ||
    (m.phone       ?? "").includes(q) ||
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
            placeholder="Search by name, email, phone or profession…"
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

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(17,17,17,.07)" }}>
              <th style={TH}>Member</th>
              <th style={TH}>Email</th>
              <th style={TH}>Profession</th>
              <th style={TH}>Paid (Period)</th>
              <th style={TH}>Method</th>
              <th style={TH}>Sub Start</th>
              <th style={TH}>Sub End</th>
              <th style={TH}>Days Left</th>
              <th style={TH}>Status</th>
              <th style={TH}>Recorded By</th>
              <th style={TH}>Date Registered</th>
              <th style={{ ...TH, width: 28 }} />
              <th style={{ ...TH, width: 28 }} />
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
              const daysColor = m.days === null ? "var(--muted)"
                : m.days <= 0 ? "#dc2626"
                : m.days <= 7 ? "#b45309"
                : "var(--dark)";

              return (
                <React.Fragment key={m.id}>
                  <tr
                    onClick={() => toggle(m.id)}
                    style={{
                      borderBottom: open ? "none" : "1px solid rgba(17,17,17,.045)",
                      cursor: "pointer", transition: "background .08s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(17,17,17,.018)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* Member */}
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", whiteSpace: "nowrap" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".6rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".8rem" }}>{m.full_name || "—"}</div>
                          <div style={{ fontSize: "10px", color: "var(--muted)" }}>{m.phone || "—"}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ ...TD_M, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.email || <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                    </td>

                    {/* Profession */}
                    <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                      {m.sub?.profession || <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                    </td>

                    {/* Paid */}
                    <td style={{ ...TD, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {m.amount_paid > 0
                        ? <span style={{ color: "#16a34a" }}>KES {m.amount_paid.toLocaleString()}</span>
                        : <span style={{ color: "rgba(17,17,17,.25)", fontWeight: 400 }}>—</span>}
                    </td>

                    {/* Method */}
                    <td style={TD_M}>
                      {m.method
                        ? <span style={{ display: "inline-flex", fontSize: ".68rem", fontWeight: 600, background: "rgba(17,17,17,.05)", color: "#374151", padding: "2px 7px", borderRadius: "100px", whiteSpace: "nowrap" }}>
                            {METHOD_LABELS[m.method] ?? m.method}
                          </span>
                        : <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                    </td>

                    {/* Sub Start */}
                    <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(m.sub?.subscription_start)}</td>

                    {/* Sub End */}
                    <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(m.sub?.subscription_end)}</td>

                    {/* Days */}
                    <td style={{ ...TD, fontWeight: 600, color: daysColor, whiteSpace: "nowrap" }}>
                      {m.days === null ? "—"
                        : m.days <= 0 ? `${Math.abs(m.days)}d overdue`
                        : `${m.days}d`}
                    </td>

                    {/* Status */}
                    <td style={TD}>
                      {m.status === "active"   && <span className="badge gr"><span className="badge-dot" />Active</span>}
                      {m.status === "expiring" && <span className="badge gd"><span className="badge-dot" />Expiring</span>}
                      {m.status === "expired"  && <span className="badge rd"><span className="badge-dot" />Expired</span>}
                      {m.status === "none"     && <span className="badge"><span className="badge-dot" />No record</span>}
                    </td>

                    {/* Recorded By */}
                    <td style={{ ...TD_M, whiteSpace: "nowrap" }}>
                      {m.recorded_by_name || <span style={{ color: "rgba(17,17,17,.2)" }}>—</span>}
                    </td>

                    {/* Date Registered */}
                    <td style={{ ...TD_M, whiteSpace: "nowrap" }}>{fmtDate(m.payment_created_at)}</td>

                    {/* Delete */}
                    <td style={{ padding: "0 6px", height: "44px", verticalAlign: "middle", width: 28 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDeleteTarget(m)}
                        title="Delete member subscription"
                        style={{ width: "24px", height: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.15)", borderRadius: "5px", cursor: "pointer", color: "#dc2626", fontSize: ".58rem" }}
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </td>

                    {/* Expand chevron */}
                    <td style={{ padding: "0 10px", height: "44px", verticalAlign: "middle", width: 28 }}>
                      <i
                        className="fas fa-chevron-down"
                        style={{ fontSize: ".58rem", color: "rgba(17,17,17,.25)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
                      />
                    </td>
                  </tr>

                  {open && (
                    <tr style={{ borderBottom: "1px solid rgba(17,17,17,.045)", background: "rgba(17,17,17,.012)" }}>
                      <td colSpan={13} style={{ padding: "12px 18px 14px" }}>
                        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
                          {m.reference && (
                            <div>
                              <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Reference</div>
                              <div style={{ fontSize: ".78rem", color: "var(--dark)", fontFamily: "monospace" }}>{m.reference}</div>
                            </div>
                          )}
                          {m.sub?.bio && (
                            <div style={{ maxWidth: "400px" }}>
                              <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Bio</div>
                              <div style={{ fontSize: ".78rem", color: "var(--dark)", lineHeight: 1.55 }}>{m.sub.bio}</div>
                            </div>
                          )}
                          {m.sub?.is_public && m.sub?.slug && (
                            <div>
                              <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Public Profile</div>
                              <a href={`/members/${m.sub.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: ".78rem", color: "var(--teal2)", textDecoration: "underline" }}>
                                /members/{m.sub.slug} →
                              </a>
                            </div>
                          )}
                          {!m.sub?.is_public && (
                            <div>
                              <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", marginBottom: "2px" }}>Public Profile</div>
                              <div style={{ fontSize: ".78rem", color: "rgba(17,17,17,.4)" }}>Private</div>
                            </div>
                          )}
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

      {deleteTarget && (
        <DeleteMemberModal
          member={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => setLocalMembers((prev) => prev.filter((m) => m.id !== id))}
        />
      )}
    </div>
  );
}
