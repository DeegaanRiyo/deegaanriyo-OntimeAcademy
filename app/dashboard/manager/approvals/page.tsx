"use client";

import { useEffect, useState, useCallback } from "react";
import EmptyState from "@/components/dashboard/EmptyState";

type Registration = {
  id:             string;
  full_name:      string;
  email:          string;
  phone:          string | null;
  username:       string;
  requested_role: string;
  created_at:     string;
  status:         string;
};

function roleBadge(role: string) {
  const map: Record<string, string> = { teacher: "badge tl", social_media: "badge bl", member: "badge gr" };
  return map[role] ?? "badge";
}

export default function ApprovalsPage() {
  const [items,    setItems]    = useState<Registration[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"pending" | "approved" | "rejected">("pending");
  const [acting,   setActing]   = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/manager/approvals?status=${filter}`);
    const json = await res.json();
    setItems(json.data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handle = async (id: string, action: "approve" | "reject") => {
    setActing(id); setError(null);
    const res  = await fetch(`/api/manager/approvals/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action }),
    });
    const json = await res.json();
    setActing(null);
    if (!res.ok) { setError(json.error ?? "Action failed"); return; }
    fetchItems();
  };

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Approvals</h2>
          <p>Review and approve signup requests from your invite links.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="pill-tabs" style={{ marginBottom: "20px" }}>
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            className={`pill-tab${filter === s ? " active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="login-error show" style={{ marginBottom: "16px" }}>
          <i className="fas fa-circle-exclamation" /><span>{error}</span>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-user-clock" /> {filter.charAt(0).toUpperCase() + filter.slice(1)} Requests</h3>
          <span style={{ fontSize: ".68rem", color: "var(--muted)" }}>{items.length} total</span>
        </div>

        {loading ? (
          <EmptyState icon="fas fa-spinner fa-spin" title="Loading…" padding="40px 20px" />
        ) : items.length === 0 ? (
          <EmptyState
            icon="fas fa-inbox"
            title={`No ${filter} requests`}
            description="Pending registrations will appear here for your review."
            padding="48px 20px"
          />
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Submitted</th>
                  {filter === "pending" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.full_name}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>@{r.username}</td>
                    <td style={{ color: "var(--muted)" }}>{r.email}</td>
                    <td style={{ color: "var(--muted)" }}>{r.phone || "—"}</td>
                    <td><span className={roleBadge(r.requested_role)}>{r.requested_role}</span></td>
                    <td style={{ color: "var(--muted)" }}>
                      {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </td>
                    {filter === "pending" && (
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handle(r.id, "approve")}
                            disabled={acting === r.id}
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "7px", cursor: acting === r.id ? "not-allowed" : "pointer", fontSize: ".74rem", fontWeight: 600, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.35)", color: "var(--green)", opacity: acting === r.id ? .55 : 1 }}
                          >
                            {acting === r.id ? <span className="spinner" /> : <i className="fas fa-check" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handle(r.id, "reject")}
                            disabled={acting === r.id}
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "7px", cursor: acting === r.id ? "not-allowed" : "pointer", fontSize: ".74rem", fontWeight: 600, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.35)", color: "var(--red)", opacity: acting === r.id ? .55 : 1 }}
                          >
                            <i className="fas fa-times" />
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
