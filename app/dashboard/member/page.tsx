import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const renewalLink = `https://wa.me/254746628668?text=${encodeURIComponent("Hi, I'd like to renew my Ontime Academy & Co-working Space membership.")}`;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
}

export default async function MemberHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, email, role").eq("id", user.id).single();
  if (profile?.role !== "member") redirect("/dashboard");

  const { data: member } = await supabase
    .from("members")
    .select("id, slug, profession, is_active, subscription_start, subscription_end, is_public")
    .eq("id", user.id)
    .single();

  const now  = new Date();
  const end  = member?.subscription_end   ? new Date(member.subscription_end)   : null;
  const daysRemaining = end ? Math.ceil((end.getTime() - now.getTime()) / 86400000) : null;
  const isActive = member?.is_active ?? false;

  const quickLinks = [
    { href: "/spaces",                   icon: "fa-door-open",      title: "Book a Space",    subtitle: "Reserve a hot desk or private office" },
    { href: "/courses",                  icon: "fa-graduation-cap", title: "Academy Courses", subtitle: "Browse available learning programmes" },
    { href: "/dashboard/member/profile", icon: "fa-user-circle",    title: "My Profile",      subtitle: "Edit your public member profile" },
  ];

  return (
    <div>
      {/* Subscription card */}
      {!member ? (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="info-body">
            <div className="kpi-icon tl"><i className="fas fa-hourglass-half" /></div>
            <div className="info-text">
              <h4>Account setup in progress</h4>
              <p>Your membership account is being set up. Contact us if this takes too long.</p>
              <a href={renewalLink} target="_blank" rel="noopener noreferrer"
                className="btn-sm btn-ghost" style={{ marginTop: "14px", display: "inline-flex" }}>
                <i className="fab fa-whatsapp" /> Contact Us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : isActive && daysRemaining !== null && daysRemaining > 0 ? (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-head">
            <h3><i className="fas fa-id-card" /> Membership Status</h3>
            <span className="badge gr"><span className="badge-dot" />Active</span>
          </div>
          <div className="stat-row">
            <div className="stat-big">
              <div className="kpi-num tl">{daysRemaining}</div>
              <div className="stat-big-label">days remaining</div>
            </div>
            <div className="stat-meta">
              <div className="stat-meta-row">
                <i className="fas fa-calendar-check" style={{ color: "var(--teal2)", width: 16, textAlign: "center" }} />
                <span className="stat-meta-key">Member since:</span>
                <span className="stat-meta-val">{formatDate(member.subscription_start)}</span>
              </div>
              <div className="stat-meta-row">
                <i className="fas fa-calendar-times" style={{ color: "var(--muted)", width: 16, textAlign: "center" }} />
                <span className="stat-meta-key">Expires:</span>
                <span className="stat-meta-val">{formatDate(member.subscription_end)}</span>
              </div>
            </div>
          </div>
          {daysRemaining <= 7 && (
            <div className="notice gd" style={{ margin: "0 24px 18px", flexWrap: "wrap" }}>
              <div className="notice-body">
                <i className="fas fa-exclamation-triangle notice-icon" />
                <span className="notice-title">Your membership expires soon. Contact us to renew.</span>
              </div>
              <a href={renewalLink} target="_blank" rel="noopener noreferrer" className="btn-sm btn-gold">
                <i className="fab fa-whatsapp" /> Renew via WhatsApp
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-head">
            <h3><i className="fas fa-id-card" /> Membership Status</h3>
            <span className="badge rd"><span className="badge-dot" />Expired</span>
          </div>
          <div className="info-body">
            <div className="kpi-icon rd"><i className="fas fa-lock" /></div>
            <div className="info-text">
              <h4>Your membership has expired.</h4>
              <p>Renew your membership to regain access to co-working spaces and member benefits.</p>
              <a href={renewalLink} target="_blank" rel="noopener noreferrer"
                className="btn-sm btn-primary" style={{ marginTop: "14px", display: "inline-flex" }}>
                <i className="fab fa-whatsapp" /> Renew Membership via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-head">
          <h3><i className="fas fa-bolt" /> Quick Links</h3>
        </div>
        <div className="qa-grid">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="qa-item">
              <div className="kpi-icon tl"><i className={`fas ${link.icon}`} /></div>
              <div>
                <div className="qa-title">{link.title}</div>
                <div className="qa-sub">{link.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Profile visibility */}
      {member && (
        member.is_public ? (
          <div className="notice tl">
            <div className="notice-body">
              <i className="fas fa-globe notice-icon" />
              <span>Your profile is visible in the member directory.</span>
            </div>
            <Link href={`/members/${member.slug}`} className="card-link">
              View my public profile →
            </Link>
          </div>
        ) : (
          <div className="notice muted">
            <div className="notice-body">
              <i className="fas fa-eye-slash notice-icon" />
              <span>Your profile is currently private.</span>
            </div>
            <Link href="/dashboard/member/profile" className="card-link">
              Make it public in settings →
            </Link>
          </div>
        )
      )}
    </div>
  );
}
