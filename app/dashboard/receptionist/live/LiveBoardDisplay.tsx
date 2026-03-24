"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type SpaceStatus = {
  id: string;
  name: string;
  slug: string;
  is_available: boolean;
  current: {
    client: string;
    setup: string | null;
    startTime: string;
    endTime: string;
    status: string;
  } | null;
  upcoming: {
    client: string;
    setup: string | null;
    startTime: string;
    endTime: string;
  } | null;
  todayBookings: any[];
};

const SPACE_ICONS: Record<string, string> = {
  "boardroom":       "fa-briefcase",
  "conference-room": "fa-users",
  "podcast-studio":  "fa-microphone",
  "content-studio":  "fa-video",
};

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function LiveBoardDisplay() {
  const [spaces,   setSpaces]   = useState<SpaceStatus[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [clock,    setClock]    = useState("");
  const [date,     setDate]     = useState("");
  const [lastSync, setLastSync] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/spaces/live", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setSpaces(json.spaces ?? []);
        setLastSync(new Date().toLocaleTimeString("en-KE", {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          timeZone: "Africa/Nairobi",
        }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Live clock
  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-KE", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "Africa/Nairobi", hour12: true,
      }));
      setDate(now.toLocaleDateString("en-KE", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        timeZone: "Africa/Nairobi",
      }));
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch live data every 30s
  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 30_000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  const occupiedCount  = spaces.filter((s) => !!s.current).length;
  const availableCount = spaces.filter((s) => !s.current && s.is_available).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--dark)",
      fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
      padding: "0",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top bar */}
      <div style={{
        background: "var(--dark2)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            fontFamily: "var(--font-fraunces), Fraunces, serif",
            fontSize: "1.4rem", fontWeight: 700, color: "var(--white)",
          }}>
            Ontime<span style={{ color: "var(--teal2)" }}>CWS</span>
          </div>
          <div style={{ width: "1px", height: "28px", background: "var(--border)" }} />
          <div>
            <div style={{ fontSize: ".75rem", color: "var(--muted)", fontWeight: 600, letterSpacing: ".1em" }}>
              SPACE STATUS BOARD
            </div>
            <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: "1px" }}>
              Live · syncs every 30s · last: {lastSync}
            </div>
          </div>
        </div>

        {/* Clock */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--white)", letterSpacing: "-.02em", lineHeight: 1 }}>
            {clock}
          </div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "4px" }}>{date}</div>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{
        background: "var(--dark3)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 32px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
          <span style={{ fontSize: ".8rem", color: "var(--green)", fontWeight: 600 }}>
            {availableCount} Available
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 6px var(--red)" }} />
          <span style={{ fontSize: ".8rem", color: "var(--red)", fontWeight: 600 }}>
            {occupiedCount} Occupied
          </span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Link
            href="/dashboard/receptionist"
            style={{ fontSize: ".72rem", color: "var(--muted)", textDecoration: "none" }}
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Space cards grid */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "0",
        padding: "0",
      }}>
        {loading ? (
          <div style={{
            gridColumn: "1 / -1",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--muted)", fontSize: "1rem", gap: "12px",
          }}>
            <i className="fas fa-spinner fa-spin" />
            Loading space status...
          </div>
        ) : spaces.map((space, i) => {
          const isOccupied = !!space.current;
          const isClosed   = !space.is_available;

          const borderRight = i % 2 === 0 ? "1px solid var(--border)" : "none";
          const borderBottom = i < 2 ? "1px solid var(--border)" : "none";

          const bg = isClosed
            ? "var(--dark2)"
            : isOccupied
              ? "linear-gradient(135deg, #1a0808 0%, var(--dark2) 60%)"
              : "linear-gradient(135deg, #071a09 0%, var(--dark2) 60%)";

          const accentColor = isClosed ? "#6b7280" : isOccupied ? "#ef4444" : "#22c55e";

          return (
            <div key={space.id} style={{
              background: bg,
              borderRight,
              borderBottom,
              padding: "40px 48px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              minHeight: "calc(50vh - 80px)",
            }}>
              {/* Glow effect */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                background: isClosed
                  ? "#4b5563"
                  : isOccupied
                    ? "linear-gradient(90deg, #dc2626, #ef4444)"
                    : "linear-gradient(90deg, #16a34a, #22c55e)",
              }} />

              {/* Space header */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "16px",
                  background: "var(--dark3)", border: `2px solid ${accentColor}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", color: accentColor,
                  boxShadow: `0 0 20px ${accentColor}22`,
                }}>
                  <i className={`fas ${SPACE_ICONS[space.slug] ?? "fa-door-open"}`} />
                </div>
                <div>
                  <div style={{
                    fontSize: "1.6rem", fontWeight: 800,
                    color: "var(--white)",
                    fontFamily: "var(--font-fraunces), Fraunces, serif",
                    lineHeight: 1,
                  }}>
                    {space.name}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px", marginTop: "6px",
                  }}>
                    <span style={{
                      width: "10px", height: "10px", borderRadius: "50%",
                      background: accentColor,
                      boxShadow: isClosed ? undefined : `0 0 8px ${accentColor}`,
                      animation: (!isClosed && isOccupied) ? "pulse 1.5s infinite" : undefined,
                    }} />
                    <span style={{
                      fontSize: ".85rem", fontWeight: 700, color: accentColor,
                      letterSpacing: ".12em",
                    }}>
                      {isClosed ? "CLOSED" : isOccupied ? "OCCUPIED" : "AVAILABLE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status content */}
              {isOccupied && space.current && (
                <div style={{
                  background: "rgba(239,68,68,.07)",
                  border: "1px solid rgba(239,68,68,.2)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--white)", marginBottom: "8px" }}>
                    <i className="fas fa-user-circle" style={{ marginRight: "10px", color: "var(--red)" }} />
                    {space.current.client}
                  </div>
                  {space.current.setup && (
                    <div style={{ fontSize: ".85rem", color: "var(--red)", marginBottom: "6px" }}>
                      <i className="fas fa-cog" style={{ marginRight: "8px", opacity: .7 }} />
                      {space.current.setup}
                    </div>
                  )}
                  <div style={{ fontSize: ".85rem", color: "var(--red)" }}>
                    <i className="fas fa-clock" style={{ marginRight: "8px", opacity: .7 }} />
                    {fmt12(space.current.startTime)}
                    <span style={{ margin: "0 8px", opacity: .5 }}>→</span>
                    <strong>{fmt12(space.current.endTime)}</strong>
                  </div>
                </div>
              )}

              {!isOccupied && !isClosed && (
                <div style={{
                  background: "rgba(34,197,94,.06)",
                  border: "1px solid rgba(34,197,94,.15)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--green)" }}>
                    <i className="fas fa-circle-check" style={{ marginRight: "10px" }} />
                    Space is free
                  </div>
                  <div style={{ fontSize: ".82rem", color: "rgba(134,239,172,.6)", marginTop: "6px" }}>
                    Ready for walk-in or next booking
                  </div>
                </div>
              )}

              {isClosed && (
                <div style={{
                  background: "rgba(107,114,128,.08)",
                  border: "1px solid rgba(107,114,128,.2)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                }}>
                  <div style={{ fontSize: "1rem", color: "var(--muted2)" }}>
                    <i className="fas fa-ban" style={{ marginRight: "10px" }} />
                    Not available
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {space.upcoming && (
                <div style={{ fontSize: ".75rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fas fa-forward" style={{ color: "var(--teal2)" }} />
                  <span>Next: <strong style={{ color: "var(--white)" }}>{space.upcoming.client}</strong> at {fmt12(space.upcoming.startTime)}</span>
                </div>
              )}

              {/* Today total */}
              <div style={{
                position: "absolute", bottom: "20px", right: "24px",
                fontSize: ".7rem", color: "var(--muted)",
              }}>
                {space.todayBookings.length} booking{space.todayBookings.length !== 1 ? "s" : ""} today
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
