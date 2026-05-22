import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import EmptyState from "@/components/dashboard/EmptyState";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

const TYPE_LABELS: Record<string, string> = {
  new:          "New Student",
  current_old:  "Current / Old",
  zoom_virtual: "Zoom / Virtual",
};
const TYPE_COLORS: Record<string, string> = {
  new:          "#E8490F",
  current_old:  "#16a34a",
  zoom_virtual: "#7c3aed",
};
const METHOD_LABELS: Record<string, string> = {
  cash:          "Cash",
  mpesa:         "M-Pesa",
  bank_transfer: "Bank Transfer",
  both:          "Cash + M-Pesa",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

export default async function ManagerOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = serviceClient();

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  // ── Revenue this month ──────────────────────────────────
  const [
    { data: studentRegs },
    { data: membershipPays },
    { data: bookingPays },
  ] = await Promise.all([
    admin.from("student_registrations").select("amount, student_type").gte("created_at", monthStart),
    admin.from("membership_payments").select("amount").gte("created_at", monthStart),
    admin.from("booking_payments").select("amount").gte("created_at", monthStart),
  ]);

  const physicalClassRevenue = (studentRegs ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0);
  const membershipRevenue    = (membershipPays ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const spaceRentalRevenue   = (bookingPays ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

  // ── Member health ───────────────────────────────────────
  const { count: activeMemberCount } = await admin
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: expiringSoonCount } = await admin
    .from("members")
    .select("id", { count: "exact", head: true })
    .gte("subscription_end", now.toISOString())
    .lte("subscription_end", sevenDaysLater.toISOString());

  const { count: expiredCount } = await admin
    .from("members")
    .select("id", { count: "exact", head: true })
    .lt("subscription_end", now.toISOString())
    .eq("is_active", true);

  // ── Team counts ─────────────────────────────────────────
  const { data: team } = await admin
    .from("profiles")
    .select("id, role, is_active")
    .in("role", ["teacher", "social_media", "member"]);

  const members      = team ?? [];
  const activeCount  = members.filter((m) => m.is_active).length;
  const teacherCount = members.filter((m) => m.role === "teacher").length;

  // ── Pending approvals ───────────────────────────────────
  const { count: pendingApprovals } = await supabase
    .from("pending_registrations")
    .select("id", { count: "exact", head: true })
    .eq("manager_id", user!.id)
    .eq("status", "pending");

  const { count: pendingPasswords } = await supabase
    .from("password_reset_requests")
    .select("id", { count: "exact", head: true })
    .eq("manager_id", user!.id)
    .eq("status", "pending");

  // ── Recent student registrations ────────────────────────
  const { data: recentActivity } = await admin
    .from("student_registrations")
    .select("id, student_type, customer_name, customer_phone, amount, method, created_at, recorder:profiles!student_registrations_recorded_by_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(10);

  // ── Recent pending signups ──────────────────────────────
  const { data: recentPending } = await supabase
    .from("pending_registrations")
    .select("id, full_name, requested_role, created_at")
    .eq("manager_id", user!.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const hasActionItems = (pendingApprovals ?? 0) > 0 || (pendingPasswords ?? 0) > 0
    || (expiringSoonCount ?? 0) > 0 || (expiredCount ?? 0) > 0;

  return (
    <div>
      {/* ── Action alerts ──────────────────────────────────── */}
      {hasActionItems && (
        <div className="alerts">
          {(pendingApprovals ?? 0) > 0 && (
            <Link href="/dashboard/manager/approvals" className="notice gd">
              <div className="notice-body">
                <i className="fas fa-clock notice-icon" />
                <div>
                  <div className="notice-title">{pendingApprovals} Pending Approval{(pendingApprovals ?? 0) > 1 ? "s" : ""}</div>
                  <div className="notice-sub">Signup requests need review</div>
                </div>
              </div>
              <i className="fas fa-arrow-right notice-arrow" />
            </Link>
          )}
          {(expiringSoonCount ?? 0) > 0 && (
            <div className="notice am">
              <div className="notice-body">
                <i className="fas fa-exclamation-triangle notice-icon" />
                <div>
                  <div className="notice-title">{expiringSoonCount} Membership{(expiringSoonCount ?? 0) > 1 ? "s" : ""} Expiring</div>
                  <div className="notice-sub">Within the next 7 days</div>
                </div>
              </div>
            </div>
          )}
          {(expiredCount ?? 0) > 0 && (
            <div className="notice rd">
              <div className="notice-body">
                <i className="fas fa-user-times notice-icon" />
                <div>
                  <div className="notice-title">{expiredCount} Expired / Lapsed</div>
                  <div className="notice-sub">Subscription overdue</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Revenue by Category ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Membership",     amount: membershipRevenue,    color: "var(--teal2)", icon: "fa-id-card",             bg: "rgba(15,179,187,.08)",  border: "rgba(15,179,187,.22)"  },
          { label: "Physical Class", amount: physicalClassRevenue, color: "var(--blue)",  icon: "fa-chalkboard-teacher",  bg: "rgba(96,165,250,.08)",  border: "rgba(96,165,250,.22)"  },
          { label: "Space Rental",   amount: spaceRentalRevenue,   color: "var(--gold2)", icon: "fa-door-open",           bg: "rgba(234,179,8,.08)",   border: "rgba(234,179,8,.22)"   },
        ].map((c) => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: "12px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: ".62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>{c.label}</span>
              <i className={`fas ${c.icon}`} style={{ color: c.color, fontSize: ".8rem" }} />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--dark)", lineHeight: 1 }}>
              {c.amount > 0 ? `KES ${c.amount.toLocaleString()}` : <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: 500 }}>—</span>}
            </div>
            <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: "5px" }}>this month</div>
          </div>
        ))}
      </div>

      {/* ── Member health KPIs ─────────────────────────────── */}
      <div className="kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon tl"><i className="fas fa-users" /></div>
          </div>
          <div className="kpi-num">{activeMemberCount ?? 0}</div>
          <div className="kpi-label">Active Members</div>
          <div className="kpi-sub">Co-working subscriptions</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon gd"><i className="fas fa-clock" /></div>
            {(expiringSoonCount ?? 0) > 0 && (
              <div className="kpi-change dn"><i className="fas fa-exclamation" /> attention</div>
            )}
          </div>
          <div className="kpi-num">{expiringSoonCount ?? 0}</div>
          <div className="kpi-label">Expiring Soon</div>
          <div className="kpi-sub">Within 7 days</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon rd"><i className="fas fa-user-times" /></div>
            {(expiredCount ?? 0) > 0 && (
              <div className="kpi-change dn"><i className="fas fa-exclamation" /> attention</div>
            )}
          </div>
          <div className="kpi-num">{expiredCount ?? 0}</div>
          <div className="kpi-label">Expired / Lapsed</div>
          <div className="kpi-sub">Subscription overdue</div>
        </div>
      </div>

      {/* ── Recent student activity ─────────────────────────── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-head">
          <h3><i className="fas fa-receipt" /> Recent Student Registrations</h3>
          <span style={{ fontSize: ".68rem", color: "var(--muted)" }}>Latest 10 this month</span>
        </div>
        {(recentActivity ?? []).length === 0 ? (
          <EmptyState
            icon="fas fa-receipt"
            title="No registrations yet"
            description="Student registrations will appear here."
            padding="40px 20px"
          />
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Recorded By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(recentActivity ?? []).map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>{r.customer_name}</div>
                      {r.customer_phone && <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>{r.customer_phone}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize: ".72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "5px",
                        color: TYPE_COLORS[r.student_type] ?? "var(--muted)",
                        background: `${TYPE_COLORS[r.student_type] ?? "var(--muted)"}18`,
                        border: `1px solid ${TYPE_COLORS[r.student_type] ?? "var(--muted)"}40` }}>
                        {TYPE_LABELS[r.student_type] ?? r.student_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--dark)", fontSize: ".85rem" }}>
                      KES {(r.amount ?? 0).toLocaleString()}
                    </td>
                    <td style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                      {METHOD_LABELS[r.method] ?? r.method}
                    </td>
                    <td style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                      {r.recorder?.full_name ?? "—"}
                    </td>
                    <td style={{ fontSize: ".78rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(r.created_at)}<br />
                      <span style={{ fontSize: ".68rem" }}>{fmtTime(r.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Team KPIs ─────────────────────────────────────── */}
      <div className="kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon tl"><i className="fas fa-users" /></div>
          </div>
          <div className="kpi-num">{members.length}</div>
          <div className="kpi-label">Total Team</div>
          <div className="kpi-sub">{activeCount} active</div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon bl"><i className="fas fa-chalkboard-teacher" /></div>
          </div>
          <div className="kpi-num">{teacherCount}</div>
          <div className="kpi-label">Teachers</div>
          <div className="kpi-sub">Active course creators</div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon gd"><i className="fas fa-clock" /></div>
            {(pendingApprovals ?? 0) > 0 && (
              <div className="kpi-change dn"><i className="fas fa-exclamation" /> action needed</div>
            )}
          </div>
          <div className="kpi-num">{pendingApprovals ?? 0}</div>
          <div className="kpi-label">Pending Approvals</div>
          <div className="kpi-sub">Signup requests</div>
        </div>

        <div className="kpi">
          <div className="kpi-top">
            <div className="kpi-icon gr"><i className="fas fa-key" /></div>
            {(pendingPasswords ?? 0) > 0 && (
              <div className="kpi-change dn"><i className="fas fa-exclamation" /> action needed</div>
            )}
          </div>
          <div className="kpi-num">{pendingPasswords ?? 0}</div>
          <div className="kpi-label">Password Requests</div>
          <div className="kpi-sub">Forgot-password pending</div>
        </div>
      </div>

      {/* ── Quick actions ──────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-head">
          <h3><i className="fas fa-bolt" /> Quick Actions</h3>
        </div>
        <div className="card-actions">
          <Link href="/dashboard/manager/invite" className="btn-primary">
            <i className="fas fa-link" /> Generate Invite Link
          </Link>
          <Link href="/dashboard/manager/approvals" className="btn-outline">
            <i className="fas fa-clock" /> Approvals
            {(pendingApprovals ?? 0) > 0 && (
              <span className="badge gd">{pendingApprovals}</span>
            )}
          </Link>
          <Link href="/dashboard/manager/team" className="btn-outline">
            <i className="fas fa-users" /> View Team
          </Link>
        </div>
      </div>

      {/* ── Recent pending signups ──────────────────────────── */}
      {(recentPending ?? []).length > 0 && (
        <div className="card">
          <div className="card-head">
            <h3><i className="fas fa-user-clock" /> Pending Signups</h3>
            <Link href="/dashboard/manager/approvals" className="card-link">View all →</Link>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(recentPending ?? []).map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem" }}>{r.full_name}</td>
                    <td><span className="badge tl">{r.requested_role}</span></td>
                    <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                      {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <Link href="/dashboard/manager/approvals" className="act-btn">
                        <i className="fas fa-arrow-right" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
