"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email:     z.string().email("Enter a valid email"),
  phone:     z.string().optional(),
  username:  z
    .string()
    .min(2, "At least 2 characters")
    .max(30, "Too long")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only"),
  password:  z.string().min(6, "At least 6 characters"),
});

type Fields = z.infer<typeof schema>;
type TokenState = "loading" | "valid" | "invalid";

const ROLE_LABELS: Record<string, string> = {
  teacher:      "Teacher",
  social_media: "Social Media",
  member:       "Member",
};

function RegisterPage() {
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [tokenState,   setTokenState]   = useState<TokenState>("loading");
  const [invalidReason,setInvalidReason]= useState("");
  const [invitedRole,  setInvitedRole]  = useState("");
  const [inviteNote,   setInviteNote]   = useState("");
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [showPass,     setShowPass]     = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Fields>({ resolver: zodResolver(schema) });

  // Validate token on mount
  useEffect(() => {
    if (!token) { setTokenState("invalid"); setInvalidReason("No invite token found in this link."); return; }

    fetch(`/api/register/validate?token=${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.valid) {
          setInvitedRole(json.invited_role);
          setInviteNote(json.invite_note ?? "");
          setTokenState("valid");
        } else {
          setInvalidReason(json.reason ?? "Invalid invite link.");
          setTokenState("invalid");
        }
      })
      .catch(() => {
        setInvalidReason("Could not validate your invite link. Please try again.");
        setTokenState("invalid");
      });
  }, [token]);

  const onSubmit = async (data: Fields) => {
    setError(null);
    const res  = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...data, token }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to submit. Please try again."); return; }
    setSubmitted(true);
  };

  // ── Loading ───────────────────────────────────────────────
  if (tokenState === "loading") {
    return (
      <div className="login-box" style={{ textAlign: "center" }}>
        <div className="lc tl" /><div className="lc tr" />
        <div className="lc bl" /><div className="lc br" />
        <i className="fas fa-spinner fa-spin" style={{ fontSize: "1.8rem", color: "var(--teal2)", marginBottom: "16px" }} />
        <div className="login-subtitle">Validating your invite link…</div>
      </div>
    );
  }

  // ── Invalid token ─────────────────────────────────────────
  if (tokenState === "invalid") {
    return (
      <div className="login-box" style={{ textAlign: "center" }}>
        <div className="lc tl" /><div className="lc tr" />
        <div className="lc bl" /><div className="lc br" />
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: "1.3rem", color: "var(--red)",
        }}>
          <i className="fas fa-link-slash" />
        </div>
        <div className="login-title">Invite Link Invalid</div>
        <div className="login-subtitle" style={{ marginBottom: "24px" }}>{invalidReason}</div>
        <Link href="/login" className="login-forgot">← Back to login</Link>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="login-box" style={{ textAlign: "center" }}>
        <div className="lc tl" /><div className="lc tr" />
        <div className="lc bl" /><div className="lc br" />
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(15,179,187,.1)", border: "1px solid rgba(15,179,187,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: "1.3rem", color: "var(--teal2)",
        }}>
          <i className="fas fa-check" />
        </div>
        <div className="login-title">Request Submitted!</div>
        <div className="login-subtitle">
          Your signup request has been sent to your manager for approval.
          Once approved, you can log in with your username and password.
        </div>
        <Link href="/login" className="login-forgot" style={{ display: "block", marginTop: "24px" }}>
          ← Go to login
        </Link>
      </div>
    );
  }

  // ── Signup form ───────────────────────────────────────────
  return (
    <div className="login-box">
      <div className="lc tl" /><div className="lc tr" />
      <div className="lc bl" /><div className="lc br" />

      <div className="login-logo">
        <div className="login-logo-text">Ontime<span>Academy</span></div>
        <div className="login-logo-sub">Staff Registration</div>
        <div className="login-logo-badge" style={{ background: "rgba(15,179,187,.15)", borderColor: "rgba(15,179,187,.3)" }}>
          <i className="fas fa-id-badge" /> {ROLE_LABELS[invitedRole] ?? invitedRole}
        </div>
      </div>

      <div className="login-title">Create your account</div>
      <div className="login-subtitle">
        {inviteNote
          ? `You were invited as: ${inviteNote}`
          : `You have been invited to join as ${ROLE_LABELS[invitedRole] ?? invitedRole}.`}
      </div>

      {error && (
        <div className="login-error show">
          <i className="fas fa-circle-exclamation" /><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* Full Name */}
        <div className="login-field">
          <label className="login-label">Full Name</label>
          <div className="login-input-wrap">
            <input type="text" placeholder="Your full name" className="login-input" {...register("full_name")} />
            <i className="fas fa-user login-input-icon" />
          </div>
          {errors.full_name && <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>{errors.full_name.message}</p>}
        </div>

        {/* Email */}
        <div className="login-field">
          <label className="login-label">Email Address</label>
          <div className="login-input-wrap">
            <input type="email" placeholder="your@email.com" autoComplete="email" className="login-input" {...register("email")} />
            <i className="fas fa-envelope login-input-icon" />
          </div>
          {errors.email && <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="login-field">
          <label className="login-label">Phone <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
          <div className="login-input-wrap">
            <input type="tel" placeholder="e.g. 0712345678" className="login-input" {...register("phone")} />
            <i className="fas fa-phone login-input-icon" />
          </div>
        </div>

        {/* Username */}
        <div className="login-field">
          <label className="login-label">Username</label>
          <div className="login-input-wrap">
            <input type="text" placeholder="e.g. ali_hassan" autoCapitalize="none" className="login-input" {...register("username")} />
            <i className="fas fa-at login-input-icon" />
          </div>
          <p style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "4px" }}>
            This is what you will type to log in. Lowercase, numbers, underscores only.
          </p>
          {errors.username && <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>{errors.username.message}</p>}
        </div>

        {/* Password */}
        <div className="login-field">
          <label className="login-label">Password</label>
          <div className="login-input-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              className="login-input"
              {...register("password")}
            />
            <button type="button" className="login-eye" onClick={() => setShowPass((v) => !v)}>
              <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"}`} />
            </button>
          </div>
          <p style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "4px" }}>
            Remember this — you will use it every time you log in.
          </p>
          {errors.password && <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className={`login-btn${isSubmitting ? " loading" : ""}`}>
          <span className="btn-text"><i className="fas fa-paper-plane" /> Submit Request</span>
          <span className="spinner" />
        </button>
      </form>

      <div className="login-hint" style={{ marginTop: "16px" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--teal2)", fontWeight: 600 }}>Sign in</Link>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}
