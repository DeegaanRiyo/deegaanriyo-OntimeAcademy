"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(2, "Enter your username"),
});

type Fields = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    setError(null);
    const res = await fetch("/api/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username: data.username.trim().toLowerCase() }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Something went wrong. Please try again."); return; }
    setSubmitted(true);
  };

  // ── Success state ─────────────────────────────────────────
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
          <i className="fas fa-paper-plane" />
        </div>

        <div className="login-title">Request Sent</div>
        <div className="login-subtitle">
          Your password reset request has been sent to your manager for approval.
          Once approved, a reset link will be sent to the email you registered with.
        </div>

        <Link href="/login" className="login-forgot" style={{ display: "block", marginTop: "24px" }}>
          ← Back to login
        </Link>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────
  return (
    <div className="login-box">
      <div className="lc tl" /><div className="lc tr" />
      <div className="lc bl" /><div className="lc br" />

      <div className="login-logo">
        <div className="login-logo-text">Ontime<span>CWS</span></div>
        <div className="login-logo-badge">
          <i className="fas fa-key" /> Password Reset
        </div>
      </div>

      <div className="login-title">Forgot your password?</div>
      <div className="login-subtitle">
        Enter your username. Your manager will receive a reset request and approve it — then a reset link is sent to your registered email.
      </div>

      {error && (
        <div className="login-error show">
          <i className="fas fa-circle-exclamation" /><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="login-field">
          <label className="login-label">Username</label>
          <div className="login-input-wrap">
            <input
              type="text"
              placeholder="your_username"
              autoCapitalize="none"
              autoComplete="username"
              className="login-input"
              {...register("username")}
            />
            <i className="fas fa-user login-input-icon" />
          </div>
          {errors.username && (
            <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>
              {errors.username.message}
            </p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className={`login-btn${isSubmitting ? " loading" : ""}`} style={{ marginTop: "8px" }}>
          <span className="btn-text"><i className="fas fa-paper-plane" /> Send Reset Request</span>
          <span className="spinner" />
        </button>
      </form>

      <div className="login-hint" style={{ marginTop: "20px" }}>
        Remembered it?{" "}
        <Link href="/login" style={{ color: "var(--teal2)", fontWeight: 600 }}>Back to login</Link>
      </div>

      <div className="login-hint" style={{ marginTop: "10px" }}>
        Student or member?{" "}
        <Link href="/reset-password" style={{ color: "var(--muted)" }}>Reset by email instead</Link>
      </div>
    </div>
  );
}
