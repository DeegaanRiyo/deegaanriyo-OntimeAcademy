"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const requestSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const updateSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type RequestFields = z.infer<typeof requestSchema>;
type UpdateFields  = z.infer<typeof updateSchema>;

export default function ResetPasswordPage() {
  const [mode,  setMode]  = useState<"request" | "update">("request");
  const [done,  setDone]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => subscription.unsubscribe();
  }, []);

  const requestForm = useForm<RequestFields>({ resolver: zodResolver(requestSchema) });
  const updateForm  = useForm<UpdateFields>({ resolver: zodResolver(updateSchema) });

  const onRequest = async (data: RequestFields) => {
    setError(null);
    const supabase    = createClient();
    const redirectTo  = `${window.location.origin}/reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo });
    if (err) { setError(err.message); return; }
    setDone(true);
  };

  const onUpdate = async (data: UpdateFields) => {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: data.password });
    if (err) { setError(err.message); return; }
    window.location.href = "/dashboard";
  };

  // ── Email sent ─────────────────────────────────────────────────────────────

  if (done && mode === "request") {
    return (
      <div className="login-box" style={{ textAlign: "center" }}>
        <div className="lc tl" /><div className="lc tr" />
        <div className="lc bl" /><div className="lc br" />
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(15,179,187,.1)",
          border: "1px solid rgba(15,179,187,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: "1.3rem", color: "var(--teal2)",
        }}>
          <i className="fas fa-paper-plane" />
        </div>
        <div className="login-title">Check your email</div>
        <div className="login-subtitle">
          We sent a password reset link. Click it to choose a new password.
        </div>
        <Link href="/login" className="login-forgot" style={{ display: "block", marginTop: "20px" }}>
          ← Back to login
        </Link>
      </div>
    );
  }

  // ── Update password ────────────────────────────────────────────────────────

  if (mode === "update") {
    return (
      <div className="login-box">
        <div className="lc tl" /><div className="lc tr" />
        <div className="lc bl" /><div className="lc br" />

        <div className="login-logo">
          <div className="login-logo-text">Ontime<span>Academy</span></div>
          <div className="login-logo-badge">
            <i className="fas fa-lock" /> Password Reset
          </div>
        </div>

        <div className="login-title">Choose a new password</div>
        <div className="login-subtitle">Enter and confirm your new password below.</div>

        {error && (
          <div className="login-error show">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={updateForm.handleSubmit(onUpdate)} noValidate>
          <div className="login-field">
            <label className="login-label">New Password</label>
            <div className="login-input-wrap">
              <input
                type="password"
                placeholder="Min. 8 characters"
                className="login-input"
                {...updateForm.register("password")}
              />
              <i className="fas fa-lock login-input-icon" />
            </div>
            {updateForm.formState.errors.password && (
              <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>
                {updateForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="login-field">
            <label className="login-label">Confirm Password</label>
            <div className="login-input-wrap">
              <input
                type="password"
                placeholder="Repeat your password"
                className="login-input"
                {...updateForm.register("confirm")}
              />
              <i className="fas fa-lock login-input-icon" />
            </div>
            {updateForm.formState.errors.confirm && (
              <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>
                {updateForm.formState.errors.confirm.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={updateForm.formState.isSubmitting}
            className={`login-btn${updateForm.formState.isSubmitting ? " loading" : ""}`}
            style={{ marginTop: "8px" }}
          >
            <span className="btn-text">
              <i className="fas fa-lock" /> Update Password
            </span>
            <span className="spinner" />
          </button>
        </form>
      </div>
    );
  }

  // ── Request form ────────────────────────────────────────────────────────────

  return (
    <div className="login-box">
      <div className="lc tl" /><div className="lc tr" />
      <div className="lc bl" /><div className="lc br" />

      <div className="login-logo">
        <div className="login-logo-text">Ontime<span>Academy</span></div>
        <div className="login-logo-badge">
          <i className="fas fa-key" /> Password Reset
        </div>
      </div>

      <div className="login-title">Forgot your password?</div>
      <div className="login-subtitle">
        Enter your email and we&apos;ll send you a reset link.
      </div>

      {error && (
        <div className="login-error show">
          <i className="fas fa-circle-exclamation" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={requestForm.handleSubmit(onRequest)} noValidate>
        <div className="login-field">
          <label className="login-label">Email Address</label>
          <div className="login-input-wrap">
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="login-input"
              {...requestForm.register("email")}
            />
            <i className="fas fa-envelope login-input-icon" />
          </div>
          {requestForm.formState.errors.email && (
            <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>
              {requestForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={requestForm.formState.isSubmitting}
          className={`login-btn${requestForm.formState.isSubmitting ? " loading" : ""}`}
          style={{ marginTop: "8px" }}
        >
          <span className="btn-text">
            <i className="fas fa-envelope" /> Send Reset Link
          </span>
          <span className="spinner" />
        </button>
      </form>

      <div className="login-hint" style={{ marginTop: "20px" }}>
        Remembered it?{" "}
        <Link href="/login" style={{ color: "var(--teal2)", fontWeight: 600 }}>
          Back to login
        </Link>
      </div>

      <div className="login-hint" style={{ marginTop: "10px" }}>
        Staff account?{" "}
        <span style={{ color: "var(--muted)" }}>Contact the owner to reset your password.</span>
      </div>
    </div>
  );
}
