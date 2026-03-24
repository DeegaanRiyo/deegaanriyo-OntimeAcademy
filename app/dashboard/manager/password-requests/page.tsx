"use client";

import { useEffect, useState, useCallback } from "react";
import EmptyState from "@/components/dashboard/EmptyState";

type PwRequest = {
  id:         string;
  username:   string;
  full_name:  string;
  role:       string;
  status:     string;
  created_at: string;
};

function roleBadge(role: string) {
  const map: Record<string, string> = { teacher: "badge tl", social_media: "badge bl", member: "badge gr" };
  return map[role] ?? "badge";
}

export default function PasswordRequestsPage() {
  const [items,   setItems]   = useState<PwRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"pending" | "approved" | "rejected">("pending");
  const [acting,  setActing]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/manager/password-requests?status=${filter}`);
    const json = await res.json();
    setItems(json.data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handle = async (id: string, action: "approve" | "reject") => {
    setActing(id); setError(null); setSuccess(null);
    const res  = await fetch(`/api/manager/password-requests/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action }),
    });
    const json = await res.json();
    setActing(null);
    if (!res.ok) { setError(json.error ?? "Action failed"); return; }
    if (action === "approve") setSuccess("Reset link sent to staff member's registered email.");
    fetchItems();
  };

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Password Requests</h2>
          <p>Staff forgot-password requests. Approve to send a reset link to their email.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="pill-tabs" style={{ marginBottom: "20px" }}>
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button key={s} className={`pill-tab${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error   && <div className="login-error show"   style={{ marginBottom: "16px" }}><i className="fas fa-circle-exclamation" /><span>{error}</span></div>}
      {success && <div style={{ color: "var(--green)", fontSize: ".8rem", marginBottom: "16px" }}><i className="fas fa-check-circle" /> {success}</div>}

      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-key" /> {filter.charAt(0).toUpperCase() + filter.slice(1)} Requests</h3>
          <span style={{ fontSize: ".68rem", color: "var(--muted)" }}>{items.length} total</span>
        </div>

        {loading ? (
          <EmptyState icon="fas fa-spinner fa-spin" title="Loading…" padding="40px 20px" />
        ) : items.length === 0 ? (
          <EmptyState
            icon="fas fa-key"
            title={`No ${filter} password requests`}
            description="Password reset requests from your team will appear here."
            padding="48px 20px"
          />
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Requested</th>
                  {filter === "pending" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.full_name}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>@{r.username}</td>
                    <td><span className={roleBadge(r.role)}>{r.role}</span></td>
                    <td style={{ color: "var(--muted)" }}>
                      {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </td>
                    {filter === "pending" && (
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="act-btn"
                            onClick={() => handle(r.id, "approve")}
                            disabled={acting === r.id}
                            title="Approve — send reset link"
                            style={{ color: "var(--green)" }}
                          >
                            {acting === r.id ? <span className="spinner" /> : <i className="fas fa-check" />}
                          </button>
                          <button
                            className="act-btn del"
                            onClick={() => handle(r.id, "reject")}
                            disabled={acting === r.id}
                            title="Reject"
                          >
                            <i className="fas fa-times" />
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
