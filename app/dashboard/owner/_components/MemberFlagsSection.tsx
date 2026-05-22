"use client";

import { useState } from "react";

export type MemberFlag = {
  id:         string;
  message:    string;
  flagged_by: string | null;
  created_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function FlagRow({ flag, onResolved }: { flag: MemberFlag; onResolved: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function resolve() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/corrections", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flag.id, status: "resolved" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to resolve");
      onResolved(flag.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: "rgba(220,38,38,.03)", border: "1px solid rgba(220,38,38,.15)",
      borderRadius: "10px", padding: "14px 16px",
      display: "flex", alignItems: "flex-start", gap: "14px",
    }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(220,38,38,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
        <i className="fas fa-flag" style={{ color: "#dc2626", fontSize: ".75rem" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: ".85rem", marginBottom: "4px" }}>{flag.message}</div>
        <div style={{ fontSize: ".7rem", color: "var(--muted)" }}>
          {flag.flagged_by ? `Flagged by ${flag.flagged_by}` : "Flagged"} · {fmtDate(flag.created_at)}
        </div>
        {error && <div style={{ color: "#dc2626", fontSize: ".72rem", marginTop: "6px" }}>{error}</div>}
      </div>
      <button
        onClick={resolve}
        disabled={loading}
        style={{
          flexShrink: 0, padding: "6px 14px", borderRadius: "7px",
          background: "#16a34a", color: "#fff", border: "none",
          fontWeight: 700, fontSize: ".75rem", cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? .6 : 1,
          display: "flex", alignItems: "center", gap: "5px",
        }}
      >
        {loading ? <><i className="fas fa-spinner fa-spin" />Resolving…</> : <><i className="fas fa-check" />Resolve</>}
      </button>
    </div>
  );
}

export default function MemberFlagsSection({ flags: initialFlags }: { flags: MemberFlag[] }) {
  const [flags, setFlags] = useState<MemberFlag[]>(initialFlags);

  function onResolved(id: string) {
    setFlags((prev) => prev.filter((f) => f.id !== id));
  }

  if (flags.length === 0) return null;

  return (
    <div>
      <div style={{ fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#dc2626", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
        <i className="fas fa-flag" />
        Open Flags ({flags.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {flags.map((f) => (
          <FlagRow key={f.id} flag={f} onResolved={onResolved} />
        ))}
      </div>
    </div>
  );
}
