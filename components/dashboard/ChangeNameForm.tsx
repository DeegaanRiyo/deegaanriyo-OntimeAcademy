"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangeNameForm({ currentName }: { currentName: string }) {
  const [name,    setName]    = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = name.trim();
    if (!trimmed) { setError("Name cannot be empty."); return; }
    if (trimmed === currentName) { setError("That is already your current name."); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error("Not authenticated.");

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ full_name: trimmed })
        .eq("id", user.id);

      if (dbErr) throw new Error(dbErr.message);

      setSuccess(true);
      // Reload after short delay so the header/banner picks up the new name
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.15)",
    borderRadius: "8px", padding: "9px 12px", color: "var(--dark)",
    fontSize: ".85rem", outline: "none", boxSizing: "border-box",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {error && (
        <div style={{ background: "rgba(220,38,38,.07)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "8px", padding: "10px 14px", color: "#dc2626", fontSize: ".8rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "rgba(22,163,74,.07)", border: "1px solid rgba(22,163,74,.2)", borderRadius: "8px", padding: "10px 14px", color: "#16a34a", fontSize: ".8rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-check-circle" /> Name updated — refreshing…
        </div>
      )}
      <div>
        <label style={{ display: "block", fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: "6px" }}>
          Display Name
        </label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setSuccess(false); }}
          placeholder="Your full name"
          required
          style={inp}
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={loading || success}
          style={{
            height: "38px", padding: "0 20px", background: loading || success ? "rgba(17,17,17,.4)" : "var(--dark)",
            color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700,
            fontSize: ".82rem", cursor: loading || success ? "not-allowed" : "pointer",
            display: "inline-flex", alignItems: "center", gap: "7px",
          }}
        >
          {loading
            ? <><i className="fas fa-spinner fa-spin" />Saving…</>
            : <><i className="fas fa-check" />Save Name</>}
        </button>
      </div>
    </form>
  );
}
