"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

const schema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  email:     z.string().email("Enter a valid email"),
  password:  z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number"),
  confirm:   z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type Fields = z.infer<typeof schema>;

function SignupPage() {
  const searchParams = useSearchParams();
  const returnTo     = searchParams.get("return") ?? "/dashboard";

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    setError(null);
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options:  {
        data:            { full_name: data.full_name, role: "student" },
        emailRedirectTo: `${window.location.origin}/auth/callback?return=${encodeURIComponent(returnTo)}`,
      },
    });

    if (authError) { setError(authError.message); return; }

    // Email confirmations OFF → session returned immediately → redirect now
    if (authData.session) {
      window.location.href = returnTo;
      return;
    }

    // Email confirmations ON → show verify screen
    setPendingEmail(data.email);
  };

  // ── Verify email screen (only shown when email confirmations are ON) ─────────
  if (pendingEmail) {
    return (
      <div className="login-box" style={{ textAlign: "center" }}>
        <div className="lc tl" /><div className="lc tr" />
        <div className="lc bl" /><div className="lc br" />
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: "1.3rem", color: "var(--green)",
        }}>
          <i className="fas fa-envelope-open-text" />
        </div>
        <div className="login-title">Check your email</div>
        <div className="login-subtitle">
          We sent a confirmation link to <strong style={{ color: "var(--white)" }}>{pendingEmail}</strong>
        </div>
        <p style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: 12, lineHeight: 1.7 }}>
          Click the link to verify your account —{" "}
          {returnTo.startsWith("/courses/")
            ? "you'll be taken straight back to the course to complete payment."
            : <>then <Link href="/login" style={{ color: "var(--teal2)", fontWeight: 600 }}>sign in here</Link>.</>
          }
        </p>
      </div>
    );
  }

  // ── Sign-up form ─────────────────────────────────────────────────────────────
  return (
    <div className="login-box">
      <div className="lc tl" /><div className="lc tr" />
      <div className="lc bl" /><div className="lc br" />

      <div className="login-logo">
        <div className="login-logo-text">Ontime<span>CWS</span></div>
        <div className="login-logo-sub">Academy Student Portal</div>
        <div className="login-logo-badge">
          <i className="fas fa-graduation-cap" /> Create Account
        </div>
      </div>

      <div className="login-title">Join Ontime Academy</div>
      <div className="login-subtitle">
        {returnTo.startsWith("/courses/")
          ? "Create your free account to enrol and pay for this course."
          : "Free to create. Enrol in courses and track your learning."}
      </div>

      {error && (
        <div className="login-error show">
          <i className="fas fa-circle-exclamation" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="login-field">
          <label className="login-label">Full Name</label>
          <div className="login-input-wrap">
            <input type="text" placeholder="e.g. Jane Kamau" autoComplete="name"
              className="login-input" {...register("full_name")} />
            <i className="fas fa-user login-input-icon" />
          </div>
          {errors.full_name && <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: 4 }}>{errors.full_name.message}</p>}
        </div>

        <div className="login-field">
          <label className="login-label">Email Address</label>
          <div className="login-input-wrap">
            <input type="email" placeholder="jane@example.com" autoComplete="email"
              className="login-input" {...register("email")} />
            <i className="fas fa-envelope login-input-icon" />
          </div>
          {errors.email && <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: 4 }}>{errors.email.message}</p>}
        </div>

        <div className="login-field">
          <label className="login-label">Password</label>
          <div className="login-input-wrap">
            <input type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password" className="login-input" {...register("password")} />
            <i className="fas fa-lock login-input-icon" />
          </div>
          {errors.password && <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: 4 }}>{errors.password.message}</p>}
        </div>

        <div className="login-field">
          <label className="login-label">Confirm Password</label>
          <div className="login-input-wrap">
            <input type="password" placeholder="Repeat your password"
              autoComplete="new-password" className="login-input" {...register("confirm")} />
            <i className="fas fa-lock login-input-icon" />
          </div>
          {errors.confirm && <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: 4 }}>{errors.confirm.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}
          className={`login-btn${isSubmitting ? " loading" : ""}`} style={{ marginTop: 8 }}>
          <span className="btn-text"><i className="fas fa-bolt" /> Create Account &amp; Continue</span>
          <span className="spinner" />
        </button>
      </form>

      <div className="login-hint" style={{ marginTop: 20 }}>
        Already have an account?{" "}
        <Link href={`/login?return=${encodeURIComponent(returnTo)}`} style={{ color: "var(--teal2)", fontWeight: 600 }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}
