import { createClient as createServiceClient } from "@supabase/supabase-js";
import InviteForm from "@/components/dashboard/InviteForm";
import EmptyState from "@/components/dashboard/EmptyState";

function roleBadge(role: string): string {
  const map: Record<string, string> = {
    owner:   "badge pu",
    admin:   "badge bl",
    teacher: "badge tl",
  };
  return map[role] ?? "badge";
}

export default async function AccountsPage() {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .in("role", ["owner", "admin", "teacher"])
    .order("created_at", { ascending: true });

  const accounts = data ?? [];

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Accounts</h2>
          <p>Manage owner, admin, and teacher accounts.</p>
        </div>
        <div className="sec-actions">
          <InviteForm />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-users-cog" /> Team Accounts</h3>
          <span style={{ fontSize: ".68rem", color: "var(--muted)" }}>{accounts.length} total</span>
        </div>
        {accounts.length === 0 ? (
          <EmptyState
            icon="fas fa-users-cog"
            title="No accounts found"
            description="Team accounts will appear here once created."
            padding="48px 20px"
          />
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc: any) => {
                  const initials = (acc.full_name || acc.email || "?")
                    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <tr key={acc.id}>
                      <td>
                        <div className="td-name">
                          <div className="td-avatar" style={{ background: "linear-gradient(135deg,var(--teal),var(--teal2))" }}>
                            {initials}
                          </div>
                          <div className="td-main">{acc.full_name || "—"}</div>
                        </div>
                      </td>
                      <td style={{ color: "var(--muted)" }}>{acc.email}</td>
                      <td><span className={roleBadge(acc.role)}>{acc.role}</span></td>
                      <td style={{ color: "var(--muted)" }}>
                        {new Date(acc.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
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
