"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type PendingItem = {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  start_time: string;
  hours: number;
  booking_date: string;
  estimated_cost: number | null;
};

type SpaceStatus = {
  id: string;
  name: string;
  slug: string;
  is_available: boolean;
  hourly_rate: number;
  pendingCount: number;
  pendingList: PendingItem[];
  current: {
    id: string;
    client: string;
    phone: string;
    setup: string | null;
    startTime: string;
    endTime: string;
    status: string;
  } | null;
  upcoming: {
    id: string;
    client: string;
    setup: string | null;
    startTime: string;
    endTime: string;
  } | null;
  todayBookings: any[];
  nowTime: string;
  today: string;
};

const SPACE_ICONS: Record<string, string> = {
  "boardroom":       "fa-briefcase",
  "conference-room": "fa-users",
  "podcast-studio":  "fa-microphone",
  "content-studio":  "fa-video",
};

function fmt12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

interface Props {
  basePath: string;
  compact?: boolean;
  onBook?: (spaceId: string) => void;
}

export default function SpaceLiveBoard({ basePath, compact = false, onBook }: Props) {
  const [spaces,    setSpaces]    = useState<SpaceStatus[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/spaces/live", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setSpaces(json.spaces ?? []);
        setLastFetch(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--muted)", padding: "40px 0" }}>
        <i className="fas fa-spinner fa-spin" />
        <span>Loading live status...</span>
      </div>
    );
  }

  const totalPending = spaces.reduce((s, sp) => s + sp.pendingCount, 0);

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="live-dot" />
          <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>
            Live · refreshes every 30s
            {lastFetch && (
              <> · last: {lastFetch.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</>
            )}
          </span>
          {totalPending > 0 && (
            <Link
              href={`${basePath}/bookings`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                background: "rgba(234,179,8,.15)", border: "1px solid rgba(234,179,8,.4)",
                color: "var(--gold2)", borderRadius: "20px",
                padding: "2px 10px", fontSize: ".7rem", fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <i className="fas fa-clock" />
              {totalPending} pending request{totalPending !== 1 ? "s" : ""} — Review
            </Link>
          )}
        </div>
        <button
          onClick={fetchStatus}
          style={{ background: "transparent", border: "none", color: "var(--teal2)", cursor: "pointer", fontSize: ".78rem" }}
        >
          <i className="fas fa-sync-alt" style={{ marginRight: "4px" }} />Refresh
        </button>
      </div>

      {/* Space cards */}
      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {spaces.map((space) => {
          const isOccupied = !!space.current;
          const isClosed   = !space.is_available;
          const hasPending = space.pendingCount > 0;

          const statusDot  = isClosed ? "#6b7280" : isOccupied ? "#ef4444" : "#22c55e";
          const statusText = isClosed ? "CLOSED" : isOccupied ? "OCCUPIED" : "FREE";
          const cardBorder = hasPending
            ? "rgba(234,179,8,.4)"
            : isClosed ? "var(--border)"
            : isOccupied ? "rgba(239,68,68,.3)" : "rgba(34,197,94,.25)";

          return (
            <div
              key={space.id}
              style={{
                background: "var(--dark2)",
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {/* Top colour bar */}
              <div style={{
                height: "3px",
                background: hasPending
                  ? "linear-gradient(90deg,#eab308,#ca8a04)"
                  : isClosed ? "#374151"
                  : isOccupied ? "linear-gradient(90deg,#ef4444,#f97316)"
                  : "linear-gradient(90deg,#22c55e,#16a34a)",
              }} />

              <div style={{ padding: "14px 16px" }}>
                {/* Row 1: icon + name + status */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "var(--dark3)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--teal2)", fontSize: ".85rem", flexShrink: 0,
                  }}>
                    <i className={`fas ${SPACE_ICONS[space.slug] ?? "fa-door-open"}`} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--white)", marginBottom: "1px" }}>
                      {space.name}
                    </div>
                    {space.hourly_rate > 0 && (
                      <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>
                        KES {space.hourly_rate.toLocaleString()}/hr
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "4px", flexShrink: 0,
                    padding: "3px 8px", borderRadius: "20px",
                    background: isClosed ? "rgba(107,114,128,.1)"
                      : isOccupied ? "rgba(239,68,68,.1)" : "rgba(34,197,94,.1)",
                    border: `1px solid ${statusDot}30`,
                  }}>
                    <span style={{
                      width: "5px", height: "5px", borderRadius: "50%",
                      background: statusDot,
                      boxShadow: !isClosed ? `0 0 5px ${statusDot}` : undefined,
                    }} />
                    <span style={{ fontSize: ".6rem", fontWeight: 700, color: statusDot, letterSpacing: ".06em" }}>
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* Row 2: current session / free info */}
                <div style={{
                  background: "var(--dark3)", borderRadius: "8px",
                  padding: "10px 12px", marginBottom: "10px",
                  minHeight: "52px",
                }}>
                  {isOccupied && space.current ? (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".82rem", color: "var(--white)", marginBottom: "2px" }}>
                        {space.current.client}
                      </div>
                      <div style={{ fontSize: ".72rem", color: "#fca5a5" }}>
                        <i className="fas fa-clock" style={{ marginRight: "4px", opacity: .7 }} />
                        {fmt12(space.current.startTime)} → {fmt12(space.current.endTime)}
                        {space.current.setup ? ` · ${space.current.setup}` : ""}
                      </div>
                    </div>
                  ) : isClosed ? (
                    <div style={{ color: "#6b7280", fontSize: ".8rem" }}>Space is closed</div>
                  ) : (
                    <div>
                      <div style={{ color: "#86efac", fontSize: ".82rem", fontWeight: 600, marginBottom: "2px" }}>
                        Free now
                      </div>
                      {space.upcoming ? (
                        <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                          <i className="fas fa-arrow-right" style={{ marginRight: "4px", opacity: .6 }} />
                          Next: {space.upcoming.client} at {fmt12(space.upcoming.startTime)}
                        </div>
                      ) : (
                        <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                          {space.todayBookings.length > 0
                            ? `${space.todayBookings.length} booking${space.todayBookings.length !== 1 ? "s" : ""} today`
                            : "No more bookings today"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 3: pending requests alert */}
                {hasPending && (
                  <div style={{
                    background: "rgba(234,179,8,.08)",
                    border: "1px solid rgba(234,179,8,.3)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    marginBottom: "10px",
                  }}>
                    <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--gold2)", marginBottom: "4px" }}>
                      <i className="fas fa-clock" style={{ marginRight: "5px" }} />
                      {space.pendingCount} pending request{space.pendingCount !== 1 ? "s" : ""}
                    </div>
                    {space.pendingList.slice(0, 2).map((p) => (
                      <div key={p.id} style={{ fontSize: ".68rem", color: "rgba(234,179,8,.8)", marginBottom: "1px" }}>
                        {p.visitor_name} · {fmtDate(p.booking_date)} {fmt12(p.start_time)}
                        {p.estimated_cost ? ` · KES ${p.estimated_cost.toLocaleString()}` : ""}
                      </div>
                    ))}
                  </div>
                )}

                {/* Row 4: action buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {onBook && !isClosed && (
                    <button
                      onClick={() => onBook(space.id)}
                      className="btn-primary"
                      style={{
                        flex: 1, padding: "7px 10px", fontSize: ".75rem",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      <i className="fas fa-plus" style={{ marginRight: "5px" }} />
                      Book
                    </button>
                  )}
                  <Link
                    href={`${basePath}/bookings`}
                    style={{
                      flex: 1, padding: "7px 10px", fontSize: ".75rem",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                      background: "var(--dark3)", border: "1px solid var(--border)",
                      borderRadius: "8px", color: "var(--muted)", textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <i className="fas fa-calendar-alt" />
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
