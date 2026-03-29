import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/components/dashboard/EmptyState";
import AdminMembersClient from "./AdminMembersClient";

type MemberListRow = {
  id: string;
  slug: string;
  profession: string | null;
  is_active: boolean;
  subscription_end: string | null;
  profiles: { full_name: string; email: string; phone: string | null };
};
export default async function AdminMembersPage() {
  const anonClient = await createClient();
  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await serviceClient.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "owner"].includes(profile?.role)) redirect("/dashboard");

  const { data } = await serviceClient
    .from("members")
    .select("id, slug, profession, is_active, subscription_end, profiles(full_name, email, phone)")
    .order("created_at", { ascending: false });

  const members = (data as unknown as MemberListRow[]) ?? [];
  const total   = members.length;
  const active  = members.filter((m) => m.is_active).length;
  const expired = total - active;

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>CWS Members</h2>
          <p>Manage co-working space memberships and subscriptions.</p>
        </div>
        <div className="sec-actions">
          <Link href="/dashboard/admin/members/new" className="btn-sm btn-primary">
            <i className="fas fa-user-plus" /> Add Member
          </Link>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total",   val: total,   cls: "badge tl" },
          { label: "Active",  val: active,  cls: "badge gr" },
          { label: "Expired", val: expired, cls: "badge rd" },
        ].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--dark2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 16px" }}>
            <span style={{ fontSize: ".68rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em" }}>{s.label}</span>
            <span className={s.cls}>{s.val}</span>
          </div>
        ))}
      </div>

      {members.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="fas fa-users"
            title="No members yet"
            description="Add your first co-working space member to get started."
            action={
              <Link href="/dashboard/admin/members/new" className="btn-sm btn-primary" style={{ marginTop: "8px" }}>
                <i className="fas fa-user-plus" /> Add First Member
              </Link>
            }
          />
        </div>
      ) : (
        <AdminMembersClient members={members} />
      )}
    </div>
  );
}
