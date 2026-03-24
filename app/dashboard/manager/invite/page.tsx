"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  invited_role: z.enum(["teacher", "social_media", "member"] as const, { error: "Select a role" }),
  invite_note:  z.string().max(80).optional(),
});

type Fields = z.infer<typeof schema>;

type GeneratedLink = {
  link:       string;
  role:       string;
  expires_at: string;
};

const LOGIN_URL = "https://ontime.academy/login";

export default function InvitePage() {
  const [generated,    setGenerated]    = useState<GeneratedLink | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [copiedLogin,  setCopiedLogin]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    setError(null);
    const res  = await fetch("/api/manager/invite", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to generate link"); return; }
    setGenerated({ link: json.link, role: data.invited_role, expires_at: json.expires_at });
    reset();
  };

  const copyLink = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyLoginUrl = () => {
    navigator.clipboard.writeText(LOGIN_URL);
    setCopiedLogin(true);
    setTimeout(() => setCopiedLogin(false), 2500);
  };

  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Generate Invite Link</h2>
          <p>Create a one-time link for a specific role. Share it with the person — they fill their own info.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>

        {/* Form */}
        <div className="card">
          <div className="card-head"><h3><i className="fas fa-link" /> New Invite</h3></div>

          {error && (
            <div className="login-error show" style={{ margin: "0 20px 16px" }}>
              <i className="fas fa-circle-exclamation" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="login-label">Role</label>
              <select className="form-input" {...register("invited_role")} defaultValue="">
                <option value="" disabled>Select role…</option>
                <option value="teacher">Teacher</option>
                <option value="social_media">Social Media</option>
                <option value="member">Member</option>
              </select>
              {errors.invited_role && <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>{errors.invited_role.message}</p>}
            </div>

            <div>
              <label className="login-label">Note <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
              <input type="text" className="form-input" placeholder="e.g. For Ali Hassan — Python teacher" {...register("invite_note")} />
              <p style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "4px" }}>Helps you remember who this invite was for.</p>
            </div>

            <button type="submit" disabled={isSubmitting} className={`login-btn${isSubmitting ? " loading" : ""}`}>
              <span className="btn-text"><i className="fas fa-link" /> Generate Link</span>
              <span className="spinner" />
            </button>
          </form>
        </div>

        {/* Generated link card */}
        {generated ? (
          <div className="card">
            <div className="card-head">
              <h3><i className="fas fa-check-circle" style={{ color: "var(--green)" }} /> Link Ready</h3>
              <span className="badge tl">{generated.role}</span>
            </div>
            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div style={{ fontSize: ".65rem", color: "var(--muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".06em" }}>Invite Link</div>
                <div style={{
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: "8px", padding: "10px 14px",
                  fontSize: ".75rem", wordBreak: "break-all",
                  color: "var(--teal2)", fontFamily: "monospace",
                }}>
                  {generated.link}
                </div>
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                <i className="fas fa-clock" style={{ marginRight: "6px" }} />
                Expires: {new Date(generated.expires_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                <i className="fas fa-info-circle" style={{ marginRight: "6px" }} />
                Single use · 7-day expiry · Role locked to <strong style={{ color: "var(--white)" }}>{generated.role}</strong>
              </div>
              <button onClick={copyLink} className="btn-primary" style={{ justifyContent: "center" }}>
                <i className={`fas ${copied ? "fa-check" : "fa-copy"}`} />
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button onClick={() => setGenerated(null)} className="btn-outline">
                <i className="fas fa-plus" /> Generate Another
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-head"><h3><i className="fas fa-info-circle" /> How It Works</h3></div>
            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { n: "1", text: "Select the role and generate a unique link" },
                { n: "2", text: "Copy and share it with the specific person via WhatsApp or email" },
                { n: "3", text: "They open the link and fill in their info + set their own username and password" },
                { n: "4", text: "Their request appears in your Approvals queue" },
                { n: "5", text: "You approve → their account goes live. They log in immediately." },
              ].map(({ n, text }) => (
                <div key={n} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{
                    minWidth: "24px", height: "24px", borderRadius: "50%",
                    background: "var(--teal)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: ".7rem", fontWeight: 700,
                  }}>
                    {n}
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: ".82rem", paddingTop: "3px" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Staff login link share */}
      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-head">
          <h3><i className="fas fa-sign-in-alt" /> Staff Login Link</h3>
          <span className="badge gr">Share with staff</span>
        </div>
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: "14px" }}>
            Once a staff account is approved, share this login URL so they can sign in. Staff log in with their <strong style={{ color: "var(--dark)" }}>username</strong> and password.
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{
              flex: 1, minWidth: "200px",
              background: "var(--dark2)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "10px 14px",
              fontSize: ".82rem", color: "var(--teal2)", fontFamily: "monospace",
              wordBreak: "break-all",
            }}>
              {LOGIN_URL}
            </div>
            <button onClick={copyLoginUrl} className="btn-outline" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
              <i className={`fas ${copiedLogin ? "fa-check" : "fa-copy"}`} />
              {copiedLogin ? "Copied!" : "Copy Link"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Log in to your Ontime Academy staff account here: ${LOGIN_URL}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-outline"
              style={{ flexShrink: 0, whiteSpace: "nowrap", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <i className="fab fa-whatsapp" style={{ color: "#25d366" }} />
              Share via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
