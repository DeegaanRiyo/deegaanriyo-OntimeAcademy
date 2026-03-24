import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProfileActions from "./ProfileActions";

function roleBadge(role: string) {
  const map: Record<string, string> = { teacher: "badge tl", social_media: "badge bl", member: "badge gr" };
  return map[role] ?? "badge";
}

export default async function ManagerTeamMemberPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: member } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, is_active, created_at")
    .eq("id", params.id)
    .in("role", ["teacher", "social_media", "member"])
    .single();

  if (!member) notFound();

  const initials = (member.full_name || member.username || "?")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Team Member</h2>
          <p>Manage account access and credentials.</p>
        </div>
        <div className="sec-actions">
          <Link href="/dashboard/manager/team" className="btn-outline" style={{ textDecoration: "none" }}>
            <i className="fas fa-arrow-left" /> Back to Team
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>

        {/* Profile card */}
        <div className="card">
          <div className="card-head"><h3><i className="fas fa-id-badge" /> Profile</h3></div>
          <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: member.is_active ? "linear-gradient(135deg,var(--teal),var(--teal2))" : "var(--surface2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem", fontWeight: 700, color: "var(--white)", marginTop: "4px",
            }}>
              {initials}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{member.full_name || "—"}</div>
              <div style={{ color: "var(--muted)", fontSize: ".8rem", fontFamily: "monospace", marginTop: "4px" }}>@{member.username || "—"}</div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span className={roleBadge(member.role)}>{member.role}</span>
              <span className={member.is_active ? "badge gr" : "badge rd"}>
                <span className="badge-dot" />{member.is_active ? "active" : "inactive"}
              </span>
            </div>
            <div style={{ width: "100%", borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { icon: "fa-calendar-alt", label: "Joined",   value: new Date(member.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) },
                { icon: "fa-user",         label: "Username", value: `@${member.username || "—"}` },
                { icon: "fa-shield-halved",label: "Role",     value: member.role },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: ".8rem" }}>
                  <span style={{ color: "var(--muted)" }}><i className={`fas ${icon}`} style={{ marginRight: "6px", width: "14px" }} />{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProfileActions userId={member.id} isActive={member.is_active} name={member.full_name || member.username || "this member"} />
      </div>
    </div>
  );
}
