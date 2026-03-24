import Link from "next/link";
import SignOutButton from "@/components/dashboard/SignOutButton";

// ── Types ────────────────────────────────────────────────────
export type NavItem = {
  href: string;
  icon: string;          // FontAwesome class, e.g. "fa-th-large"
  label: string;
  badge?: string;        // count or text label, e.g. "3" or "Live"
  badgeColor?: string;   // CSS color for badge bg, defaults to var(--accent)
  dot?: boolean;         // show a green pulse dot (used for live indicators)
  target?: "_blank";
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

type SidebarProps = {
  role: string;           // displayed in user row, e.g. "Owner"
  userName: string;
  userInitials: string;
  portalLabel: string;    // subtitle under logo, e.g. "OWNER PORTAL"
  logoSuffix?: string;    // "Academy" | "CWS", defaults to "Academy"
  navSections: NavSection[];
};

// ── Component ────────────────────────────────────────────────
export default function Sidebar({
  role,
  userName,
  userInitials,
  portalLabel,
  logoSuffix = "Academy",
  navSections,
}: SidebarProps) {
  return (
    <aside
      id="sidebar"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#0f1a14",
        color: "rgba(255,255,255,0.75)",
      }}
    >
      {/* ── Logo ── */}
      <div className="sb-logo">
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="sb-logo-text">
            Ontime<span>{logoSuffix}</span>
          </div>
          <div className="sb-logo-sub">{portalLabel}</div>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="sb-nav">
        {navSections.map((section) => (
          <div className="sb-section" key={section.label}>
            <span className="sb-section-label">{section.label}</span>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="sb-item"
                target={item.target}
              >
                <i className={`fas ${item.icon}`} />
                {item.label}

                {/* Green pulse dot (e.g. Display Board live indicator) */}
                {item.dot && (
                  <span
                    style={{
                      marginLeft: "auto",
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "var(--green)",
                      boxShadow: "0 0 5px var(--green)",
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* Text / count badge */}
                {item.badge && !item.dot && (
                  <span
                    className="sb-badge"
                    style={{ background: item.badgeColor ?? "var(--accent)" }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User row ── */}
      <div className="sb-bottom">
        <div className="sb-profile">
          <div className="sb-avatar">{userInitials}</div>
          <div className="sb-profile-info">
            <div className="sb-name">{userName}</div>
            <div className="sb-role">{role}</div>
          </div>
        </div>
        <div style={{ marginTop: "10px" }}>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
