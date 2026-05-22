import { createClient as createServiceClient } from "@supabase/supabase-js";
import Link from "next/link";
import EmptyState from "@/components/dashboard/EmptyState";

function roleBadge(role: string) {
  const map: Record<string, string> = {
    teacher:      "badge tl",
    social_media: "badge bl",
    member:       "badge gr",
  };
  return map[role] ?? "badge";
}

export default async function ManagerTeamPage() {
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await serviceClient
    .from("profiles")
    .select("id, full_name, username, role, is_active, created_at")
    .in("role", ["teacher", "social_media", "member"])
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  const team          = data ?? [];
  const activeCount   = team.filter((m) => m.is_active).length;
  const inactiveCount = team.filter((m) => !m.is_active).length;

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>My Team</h2>
          <p>Teachers, Social Media staff, and Members you manage.</p>
        </div>
        <div className="sec-actions">
          <Link href="/dashboard/manager/invite" className="btn-primary" style={{ textDecoration: "none" }}>
            <i className="fas fa-link" /> Invite Someone
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total",    value: team.length,                                     glow: "rgba(15,179,187,.08)" },
          { label: "Active",   value: activeCount,                                     glow: "rgba(34,197,94,.06)"  },
          { label: "Inactive", value: inactiveCount,                                   glow: "rgba(239,68,68,.06)"  },
          { label: "Teachers", value: team.filter((m) => m.role === "teacher").length, glow: "rgba(96,165,250,.06)" },
        ].map(({ label, value, glow }) => (
          <div key={label} className="kpi" style={{ flex: 1, minWidth: "120px", "--kpi-glow": glow } as React.CSSProperties}>
            <div className="kpi-num" style={{ fontSize: "1.6rem" }}>{value}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-users" /> Team Members</h3>
          <span style={{ fontSize: ".68rem", color: "var(--muted)" }}>{team.length} total</span>
        </div>

        {team.length === 0 ? (
          <EmptyState
            icon="fas fa-users"
            title="No team members yet"
            description="Generate an invite link to get started."
            padding="48px 20px"
          />
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {team.map((member: any) => {
                  const initials = (member.full_name || member.username || "?")
                    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="td-name">
                          <div className="td-avatar" style={{ background: member.is_active ? "linear-gradient(135deg,var(--teal),var(--teal2))" : "var(--surface2)" }}>
                            {initials}
                          </div>
                          <div className="td-main">{member.full_name || "—"}</div>
                        </div>
                      </td>
                      <td style={{ color: "var(--muted)", fontFamily: "monospace" }}>
                        {member.username || "—"}
                      </td>
                      <td><span className={roleBadge(member.role)}>{member.role}</span></td>
                      <td>
                        <span className={member.is_active ? "badge gr" : "badge rd"}>
                          <span className="badge-dot" />
                          {member.is_active ? "active" : "inactive"}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)" }}>
                        {new Date(member.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <Link href={`/dashboard/manager/team/${member.id}`} className="act-btn">
                          <i className="fas fa-ellipsis-h" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
