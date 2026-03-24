"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

// Staff log in with a username (e.g. "amina").
// We convert it to amina@ontimecws.app before passing to Supabase.
// Students and members log in with their real email address.
// The field accepts both — detection is by presence of "@".
const STAFF_EMAIL_DOMAIN = "ontimecws.app";

const schema = z.object({
  credential: z.string().min(2, "Enter your username or email"),
  password:   z.string().min(6, "Password must be at least 6 characters"),
});

type Fields = z.infer<typeof schema>;

function toEmail(credential: string): string {
  return credential.includes("@")
    ? credential.trim()
    : `${credential.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;
}

function LoginPage() {
  const searchParams = useSearchParams();
  const [error,    setError]    = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Show deactivated message when middleware redirects here with ?deactivated=1
  useEffect(() => {
    if (searchParams.get("deactivated") === "1") {
      setError("Your account has been deactivated. Contact your manager.");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    setError(null);
    const supabase = createClient();
    const email    = toEmail(data.credential);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password: data.password });

    if (authError) {
      setError("Incorrect username/email or password. Please try again.");
      return;
    }

    // Guard: account deactivated (metadata may not be synced to JWT yet on
    // the very first sign-in after deactivation — double-check here)
    if (authData.user?.user_metadata?.is_active === false) {
      await supabase.auth.signOut();
      setError("Your account has been deactivated. Contact your manager.");
      return;
    }

    // Full navigation ensures the server reads the fresh Supabase session cookie.
    const returnTo = searchParams.get("return");
    window.location.href = (returnTo && returnTo.startsWith("/")) ? returnTo : "/dashboard";
  };

  return (
    <div className="login-box">
      {/* Corner accents */}
      <div className="lc tl" /><div className="lc tr" />
      <div className="lc bl" /><div className="lc br" />

      {/* Logo */}
      <div className="login-logo">
        <div className="login-logo-text">Ontime<span>Academy</span></div>
        <div className="login-logo-sub">Academy &amp; Co-working Space</div>
        <div className="login-logo-badge">
          <i className="fas fa-shield-halved" /> Secure Portal
        </div>
      </div>

      <div className="login-title">Welcome back</div>
      <div className="login-subtitle">
        Staff: enter your username. Students &amp; members: enter your email.
      </div>

      {/* Error / deactivated message */}
      {error && (
        <div className="login-error show">
          <i className="fas fa-circle-exclamation" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* Username or Email */}
        <div className="login-field">
          <label className="login-label">Username or Email</label>
          <div className="login-input-wrap">
            <input
              type="text"
              placeholder="username or you@email.com"
              autoComplete="username"
              autoCapitalize="none"
              className="login-input"
              {...register("credential")}
            />
            <i className="fas fa-user login-input-icon" />
          </div>
          {errors.credential && (
            <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>
              {errors.credential.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="login-field">
          <label className="login-label">Password</label>
          <div className="login-input-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="login-input"
              {...register("password")}
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPass((v) => !v)}
            >
              <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"}`} />
            </button>
          </div>
          {errors.password && (
            <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="login-options">
          <label className="login-remember">
            <input type="checkbox" className="login-check" defaultChecked />
            <span>Remember me</span>
          </label>
          <Link href="/forgot-password" className="login-forgot">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`login-btn${isSubmitting ? " loading" : ""}`}
        >
          <span className="btn-text">
            <i className="fas fa-arrow-right-to-bracket" /> Sign In
          </span>
          <span className="spinner" />
        </button>
      </form>

      <div className="login-divider"><span>New to Ontime?</span></div>

      <Link href={`/signup?return=${encodeURIComponent(searchParams.get("return") ?? "/dashboard")}`} className="login-alt-btn">
        <i className="fas fa-user-plus" /> Create a student account
      </Link>

      <div className="login-hint" style={{ marginTop: "16px" }}>
        Staff accounts are created by your manager.{" "}
        <a
          href={`https://wa.me/254746628668?text=${encodeURIComponent("Hi, I'd like to join Ontime Academy & Co-working Space as a member.")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--teal2)", fontWeight: 600 }}
        >
          Contact us on WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
