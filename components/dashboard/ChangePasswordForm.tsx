"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordForm() {
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must include at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError("Password must include at least one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: "8px", padding: "10px 12px",
    color: "var(--white)", fontSize: ".85rem",
    outline: "none", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: ".72rem", fontWeight: 600,
    color: "var(--muted)", textTransform: "uppercase",
    letterSpacing: ".05em", marginBottom: "6px",
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3>
          <i className="fas fa-lock" style={{ marginRight: "8px", color: "var(--teal2)" }} />
          Change Password
        </h3>
        <p style={{ margin: 0, fontSize: ".78rem", color: "var(--muted)" }}>
          Update your owner account password.
        </p>
      </div>

      <div style={{ padding: "24px" }}>
        {success && (
          <div style={{
            padding: "12px 16px", borderRadius: "8px", marginBottom: "20px",
            background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)",
            color: "#4ade80", fontSize: ".83rem", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <i className="fas fa-check-circle" />
            Password updated successfully.
          </div>
        )}

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: "8px", marginBottom: "20px",
            background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)",
            color: "#f87171", fontSize: ".83rem", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "380px" }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
              autoComplete="new-password"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .6 : 1 }}
            >
              {loading
                ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Updating…</>
                : <><i className="fas fa-key" style={{ marginRight: "8px" }} />Update Password</>
              }
            </button>
          </div>

          <p style={{ margin: 0, fontSize: ".7rem", color: "var(--muted)", lineHeight: 1.6 }}>
            <i className="fas fa-info-circle" style={{ marginRight: "5px" }} />
            You will remain logged in after changing your password.
          </p>
        </form>
      </div>
    </div>
  );
}
