"use client";

import { useState } from "react";
import Link from "next/link";

type MemberListRow = {
  id: string;
  slug: string;
  profession: string | null;
  is_active: boolean;
  subscription_end: string | null;
  profiles: { full_name: string; email: string; phone: string | null };
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function subBadge(dateStr: string | null): { cls: string; label: string } {
  if (!dateStr) return { cls: "badge rd", label: "No date" };
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000;
  if (diff < 0)  return { cls: "badge rd", label: "Expired" };
  if (diff <= 7) return { cls: "badge gd", label: `${Math.ceil(diff)}d left` };
  return { cls: "badge gr", label: formatDate(dateStr) };
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminMembersClient({ members }: { members: MemberListRow[] }) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = members.filter((m) =>
    !q ||
    m.profiles.full_name.toLowerCase().includes(q) ||
    m.profiles.email.toLowerCase().includes(q) ||
    (m.profiles.phone ?? "").includes(q) ||
    (m.profession ?? "").toLowerCase().includes(q)
  );

  return (
    <>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px", maxWidth: "380px" }}>
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

      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: ".85rem" }}>
            {search ? `No results for "${search}"` : "No members found."}
          </div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Profession</th>
                  <th>Sub. Ends</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => {
                  const sub = subBadge(member.subscription_end);
                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="td-name">
                          <div className="td-avatar" style={{ background: "linear-gradient(135deg,var(--teal),var(--teal2))" }}>
                            {getInitials(member.profiles.full_name)}
                          </div>
                          <div>
                            <div className="td-main">{member.profiles.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--muted)" }}>{member.profiles.email}</td>
                      <td style={{ color: "var(--muted)" }}>{member.profiles.phone ?? "—"}</td>
                      <td style={{ color: "var(--muted)" }}>{member.profession ?? "—"}</td>
                      <td><span className={sub.cls}><span className="badge-dot" />{sub.label}</span></td>
                      <td>
                        {member.is_active
                          ? <span className="badge gr"><span className="badge-dot" />Active</span>
                          : <span className="badge rd"><span className="badge-dot" />Expired</span>}
                      </td>
                      <td>
                        <div className="td-action">
                          <Link href={`/dashboard/admin/members/${member.id}`} className="act-btn" title="Edit">
                            <i className="fas fa-pencil-alt" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
