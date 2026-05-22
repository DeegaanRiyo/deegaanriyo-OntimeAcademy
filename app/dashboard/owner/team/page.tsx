import { createClient as createServiceClient } from "@supabase/supabase-js";
import Link from "next/link";
import StaffTabsClient, { type StaffMember } from "./StaffTabsClient";

export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function OwnerTeamPage() {
  const admin = service();

  const { data: staffRaw } = await admin
    .from("profiles")
    .select("id, full_name, username, email, role, is_active, created_at")
    .in("role", ["manager", "receptionist"])
    .order("created_at", { ascending: true });

  const staff = (staffRaw ?? []) as any[];

  const toMember = (s: any): StaffMember => ({
    id:         s.id,
    full_name:  s.full_name,
    username:   s.username,
    email:      s.email,
    role:       s.role,
    is_active:  s.is_active ?? true,
    created_at: s.created_at,
  });

  const managers      = staff.filter((s) => s.role === "manager").map(toMember);
  const receptionists = staff.filter((s) => s.role === "receptionist").map(toMember);
  const total         = managers.length + receptionists.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Staff</h2>
          <p>Managers and receptionists — {total} total</p>
        </div>
        <div className="sec-actions">
          <Link href="/dashboard/owner/team/new" className="btn-primary" style={{ textDecoration: "none" }}>
            <i className="fas fa-plus" /> Add Member
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { label: "Managers",      count: managers.length,      color: "var(--teal2)" },
          { label: "Receptionists", count: receptionists.length, color: "#3b82f6"      },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: "120px",
            background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px",
            padding: "14px 16px", borderTop: `3px solid ${color}`,
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      <StaffTabsClient managers={managers} receptionists={receptionists} />
    </div>
  );
}
