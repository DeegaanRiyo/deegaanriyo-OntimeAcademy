import { ReactNode } from "react";
import Link from "next/link";
import SidebarToggle from "@/components/dashboard/SidebarToggle";

type Props = {
  sidebar: ReactNode;
  topbarTitle: string;
  topbarBreadcrumb: string;
  /** Custom right side of topbar. Defaults to bell + back-to-site link. */
  topbarRight?: ReactNode;
  children: ReactNode;
};

export default function DashboardLayout({
  sidebar,
  topbarTitle,
  topbarBreadcrumb,
  topbarRight,
  children,
}: Props) {
  const defaultTopbarRight = (
    <>
      <div className="tb-btn">
        <i className="fas fa-bell" />
      </div>
      <Link href="/" className="tb-btn" title="Back to site" target="_blank">
        <i className="fas fa-arrow-up-right-from-square" />
      </Link>
    </>
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
      }}
    >
      {sidebar}

      <div className="dash-main">
        {/* ── Topbar ── */}
        <div className="topbar">
          <div className="tb-left">
            <SidebarToggle />
            <div>
              <div className="tb-page-title">{topbarTitle}</div>
              <div className="tb-breadcrumb">
                Ontime{" "}
                <span className="tb-breadcrumb-sep">›</span>{" "}
                <span>{topbarBreadcrumb}</span>
              </div>
            </div>
          </div>
          <div className="tb-right">
            {topbarRight ?? defaultTopbarRight}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="dash-content">
          {children}
        </div>
      </div>
    </div>
  );
}
