import { createClient as createServiceClient } from "@supabase/supabase-js";
import MemberExpandTable, { type MemberRow } from "@/app/dashboard/owner/_components/MemberExpandTable";
import MemberFlagsSection, { type MemberFlag } from "@/app/dashboard/owner/_components/MemberFlagsSection";
import EmptyState from "@/components/dashboard/EmptyState";

export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function memberSubStatus(sub: any | null, now: Date, sevenDaysLater: Date): "active" | "expiring" | "expired" | "none" {
  if (!sub) return "none";
  const end = sub.subscription_end ? new Date(sub.subscription_end) : null;
  if (!end) return "none";
  if (end < now) return "expired";
  if (end <= sevenDaysLater) return "expiring";
  return "active";
}

function daysUntil(iso: string) {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(iso).getTime() - n.getTime()) / 86_400_000);
}

export default async function OwnerMembersPage() {
  const admin = service();
  const now            = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const [
    { data: membersRaw },
    { data: flagsRaw   },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, email, phone, members(is_active, subscription_start, subscription_end, profession, bio, is_public, slug)")
      .eq("role", "member")
      .order("created_at", { ascending: false }),

    // Pending member correction notes from receptionist
    admin
      .from("correction_notes")
      .select(`
        id, note, status, submitted_at,
        submitted_by_profile:profiles!correction_notes_submitted_by_fkey(full_name)
      `)
      .eq("record_type", "member")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false }),
  ]);

  const membersRawTyped = (membersRaw ?? []) as any[];

  let activeMemberCount = 0, expiringSoonCount = 0, expiredCount = 0;
  for (const m of membersRawTyped) {
    const sub    = Array.isArray(m.members) ? m.members[0] : m.members;
    const status = memberSubStatus(sub, now, sevenDaysLater);
    if (status === "active")   activeMemberCount++;
    if (status === "expiring") { activeMemberCount++; expiringSoonCount++; }
    if (status === "expired")  expiredCount++;
  }

  const memberFlags: MemberFlag[] = (flagsRaw ?? []).map((f: any) => ({
    id:          f.id,
    message:     f.note,
    flagged_by:  (f.submitted_by_profile as any)?.full_name ?? null,
    created_at:  f.submitted_at,
  }));

  const mappedMembers: MemberRow[] = membersRawTyped.map((m: any) => {
    const sub = Array.isArray(m.members) ? m.members[0] : m.members;
    return {
      id:        m.id,
      full_name: m.full_name,
      email:     m.email,
      phone:     m.phone,
      sub: sub ? {
        is_active:          sub.is_active,
        subscription_start: sub.subscription_start,
        subscription_end:   sub.subscription_end,
        profession:         sub.profession,
        bio:                sub.bio,
        is_public:          sub.is_public,
        slug:               sub.slug,
      } : null,
      status: memberSubStatus(sub, now, sevenDaysLater),
      days:   sub?.subscription_end ? daysUntil(sub.subscription_end) : null,
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Co-working Members</h2>
          <p>All registered co-working memberships and subscription status</p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { label: "Total Members",  count: membersRawTyped.length, color: "var(--teal2)", icon: "fa-id-card"             },
          { label: "Active",         count: activeMemberCount,      color: "#16a34a",      icon: "fa-circle-check"        },
          { label: "Expiring Soon",  count: expiringSoonCount,      color: "#b45309",      icon: "fa-clock"               },
          { label: "Lapsed",         count: expiredCount,           color: "#dc2626",      icon: "fa-circle-exclamation"  },
        ].map(({ label, count, color, icon }) => (
          <div key={label} style={{
            flex: 1, minWidth: "120px",
            background: "#fff", border: "1px solid rgba(17,17,17,.08)", borderRadius: "10px",
            padding: "14px 16px", borderTop: `3px solid ${color}`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--dark)", lineHeight: 1 }}>{count}</div>
              <i className={`fas ${icon}`} style={{ fontSize: ".85rem", color, opacity: .6 }} />
            </div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {expiringSoonCount > 0 && (
        <div style={{ background: "rgba(180,131,9,.07)", border: "1px solid rgba(180,131,9,.25)", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", fontSize: ".8rem", color: "#b45309" }}>
          <i className="fas fa-exclamation-triangle" />
          <strong>{expiringSoonCount}</strong> membership{expiringSoonCount > 1 ? "s" : ""} expiring within 7 days
        </div>
      )}
      {expiredCount > 0 && (
        <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", fontSize: ".8rem", color: "#dc2626" }}>
          <i className="fas fa-circle-exclamation" />
          <strong>{expiredCount}</strong> lapsed membership{expiredCount > 1 ? "s" : ""}
        </div>
      )}

      {memberFlags.length > 0 && <MemberFlagsSection flags={memberFlags} />}

      {mappedMembers.length === 0 ? (
        <div className="card">
          <EmptyState icon="fas fa-id-card" title="No members yet" description="Co-working members will appear here once they sign up." padding="48px 20px" />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px 8px", fontSize: ".72rem", color: "var(--muted)", borderBottom: "1px solid var(--border)", background: "#fafafa" }}>
            {mappedMembers.length} member{mappedMembers.length !== 1 ? "s" : ""}
          </div>
          <MemberExpandTable members={mappedMembers} />
        </div>
      )}
    </div>
  );
}
