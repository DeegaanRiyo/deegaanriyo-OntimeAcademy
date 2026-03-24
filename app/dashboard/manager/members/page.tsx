"use client";

import { useEffect, useState } from "react";
import CorrectionNoteModal from "@/components/dashboard/CorrectionNoteModal";

type Member = {
  id:           string;
  name:         string;
  phone:        string;
  email:        string | null;
  profile_id:   string | null;
  amount:       number;
  total_paid:   number;
  period_paid:  number;
  outstanding:  number;
  method:       string;
  reference:    string | null;
  notes:        string | null;
  payment_date: string;
  sub_start:    string | null;
  due_date:     string | null;
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function daysUntil(iso: string) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function memberSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days < 30)  return `${days}d`;
  const mo = Math.floor(days / 30), rem = days % 30;
  return rem > 0 ? `${mo}mo ${rem}d` : `${mo}mo`;
}

function DueBadge({ due }: { due: string | null }) {
  if (!due) return <span style={{ color: "var(--muted)", fontSize: ".75rem" }}>—</span>;
  const d = daysUntil(due);
  const [color, label] =
    d < 0  ? ["#dc2626", "Expired"] :
    d === 0 ? ["#b45309", "Today"]  :
    d <= 5  ? ["#b45309", `${d}d`]  :
              ["#16a34a", `${d}d`];
  return (
    <div>
      <div style={{ color, fontWeight: 700, fontSize: ".78rem" }}>{label}</div>
      <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{fmtDate(due)}</div>
    </div>
  );
}

type FlagTarget = { id: string; label: string };

export default function ManagerMembersPage() {
  const [members,    setMembers]    = useState<Member[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [flagTarget, setFlagTarget] = useState<FlagTarget | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/receptionist/walk-in-members")
      .then((r) => r.json())
      .then((j) => setMembers((j.members ?? []).filter((m: any) => m.type === "membership")))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = members.filter((m) => {
    const q = search.trim().toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.phone.includes(q);
  });

  const expiringSoon   = members.filter((m) => m.due_date && daysUntil(m.due_date) >= 0 && daysUntil(m.due_date) <= 5).length;
  const hasOutstanding = members.filter((m) => m.outstanding > 0).length;

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Members</h2>
          <p>Co-working memberships — view only. Use flag to report corrections.</p>
        </div>
      </div>

      {/* Alerts */}
      {expiringSoon > 0 && (
        <div style={{ background: "rgba(180,131,9,.07)", border: "1px solid rgba(180,131,9,.25)", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: ".8rem", color: "#b45309" }}>
          <i className="fas fa-exclamation-triangle" />
          <strong>{expiringSoon}</strong> membership{expiringSoon > 1 ? "s" : ""} expiring within 5 days.
        </div>
      )}
      {hasOutstanding > 0 && (
        <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: ".8rem", color: "#dc2626" }}>
          <i className="fas fa-circle-exclamation" />
          <strong>{hasOutstanding}</strong> member{hasOutstanding > 1 ? "s" : ""} with outstanding balance.
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px", maxWidth: "380px" }}>
        <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: ".8rem", pointerEvents: "none" }} />
        <input type="text" placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: "34px" }} />
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
      ) : filtered.length === 0 ? (
        <div className="card">
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            {search ? `No results for "${search}"` : "No members registered yet."}
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ padding: "10px 14px 6px", fontSize: ".72rem", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            {search && <> matching "<strong style={{ color: "var(--dark)" }}>{search}</strong>"</>}
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Paid This Period</th>
                  <th>Outstanding</th>
                  <th>Duration</th>
                  <th>Expires</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} style={{ background: m.outstanding > 0 ? "rgba(220,38,38,.02)" : undefined }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(193,68,14,.08)", border: "1px solid rgba(193,68,14,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 700, color: "var(--teal2)", flexShrink: 0 }}>
                          {initials(m.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--dark)" }}>{m.name}</div>
                          <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{m.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--dark)" }}>KES {m.period_paid.toLocaleString()}</td>
                    <td>
                      {m.outstanding > 0
                        ? <span style={{ color: "#dc2626", fontWeight: 700, fontSize: ".82rem" }}>KES {m.outstanding.toLocaleString()}</span>
                        : <span style={{ color: "#16a34a", fontSize: ".78rem" }}>Cleared</span>
                      }
                    </td>
                    <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>{memberSince(m.payment_date)}</td>
                    <td><DueBadge due={m.due_date} /></td>
                    <td>
                      <button
                        onClick={() => setFlagTarget({ id: m.id, label: `${m.name} – Membership` })}
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
      )}

      {flagTarget && (
        <CorrectionNoteModal
          recordType="member"
          recordId={flagTarget.id}
          recordLabel={flagTarget.label}
          onClose={() => setFlagTarget(null)}
        />
      )}
    </div>
  );
}
