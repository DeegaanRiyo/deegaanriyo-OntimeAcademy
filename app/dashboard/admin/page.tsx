import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [
    { count: activeMembers },
    { count: expiredMembers },
    { count: pendingBookings },
    { count: availableSpaces },
  ] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("is_active", false),
    supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", monthStart).eq("status", "pending"),
    supabase.from("spaces").select("*", { count: "exact", head: true }).eq("is_available", true),
  ]);

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon gr"><i className="fas fa-users" /></div>
            <div className="kpi-change up"><i className="fas fa-arrow-up" /> Active</div>
          </div>
          <div className="kpi-num">{activeMembers ?? 0}</div>
          <div className="kpi-label">Active Members</div>
          <div className="kpi-sub">Current co-working members</div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon gd"><i className="fas fa-calendar-check" /></div>
            {(pendingBookings ?? 0) > 0 && (
              <div className="kpi-change dn"><i className="fas fa-clock" /> Pending</div>
            )}
          </div>
          <div className="kpi-num">{pendingBookings ?? 0}</div>
          <div className="kpi-label">Pending Bookings</div>
          <div className="kpi-sub">Awaiting confirmation this month</div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon tl"><i className="fas fa-door-open" /></div>
            <div className="kpi-change up"><i className="fas fa-check" /> Ready</div>
          </div>
          <div className="kpi-num">{availableSpaces ?? 0}</div>
          <div className="kpi-label">Spaces Available</div>
          <div className="kpi-sub">Ready to book now</div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon rd"><i className="fas fa-user-clock" /></div>
          </div>
          <div className="kpi-num">{expiredMembers ?? 0}</div>
          <div className="kpi-label">Expired Memberships</div>
          <div className="kpi-sub">Need renewal</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginTop: "8px" }}>
        <div className="card-head">
          <h3><i className="fas fa-bolt" /> Quick Actions</h3>
        </div>
        <div className="qa-grid">
          {[
            { href: "/dashboard/admin/members/new",  icon: "fa-user-plus",      title: "Add Member",    sub: "Register a new co-working member" },
            { href: "/dashboard/admin/bookings",     icon: "fa-calendar-check", title: "View Bookings", sub: "Manage and confirm bookings" },
            { href: "/dashboard/admin/spaces",       icon: "fa-door-open",      title: "Manage Spaces", sub: "Toggle availability & pricing" },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="qa-item">
              <div className="kpi-icon tl">
                <i className={`fas ${action.icon}`} />
              </div>
              <div>
                <div className="qa-title">{action.title}</div>
                <div className="qa-sub">{action.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
