"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const schema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  username:  z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username too long")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only"),
  password:  z.string().min(6, "Password must be at least 6 characters"),
  role:      z.enum(["manager", "receptionist"] as const, { error: "Select a role" }),
});

type Fields = z.infer<typeof schema>;

type Credentials = {
  full_name: string;
  username:  string;
  password:  string;
  role:      string;
};

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [error,       setError]       = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [showPass,    setShowPass]    = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    setError(null);
    const res = await fetch("/api/owner/create-user", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to create account");
      return;
    }
    setCredentials({ ...data });
    reset();
  };

  const copyCredentials = () => {
    if (!credentials) return;
    const text =
      `Ontime Academy & Co-working Space — Staff Account\n` +
      `Name:     ${credentials.full_name}\n` +
      `Role:     ${credentials.role}\n` +
      `Username: ${credentials.username}\n` +
      `Password: ${credentials.password}\n` +
      `Login at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Success state: show credentials card ─────────────────
  if (credentials) {
    return (
      <div>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--dark)", margin: 0 }}>Account Created</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6, marginTop: "4px", marginBottom: 0 }}>
            Copy the credentials below and share them with the staff member.
          </p>
        </div>

        <div className="card" style={{ maxWidth: "480px" }}>
          <div className="card-head">
            <h3><i className="fas fa-key" /> Credentials</h3>
            <span className="badge gr"><span className="badge-dot" />ready</span>
          </div>

          <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { label: "Full Name", value: credentials.full_name, mono: false },
              { label: "Role",      value: credentials.role,      mono: false },
              { label: "Username",  value: credentials.username,  mono: true  },
              { label: "Password",  value: credentials.password,  mono: true  },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.6px", color: "var(--muted)", marginBottom: "4px", textTransform: "uppercase" }}>
                  {label}
                </div>
                <input
                  readOnly
                  value={value}
                  style={{
                    width: "100%",
                    background: "rgba(17,17,17,.04)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    fontSize: "0.875rem",
                    color: "var(--dark)",
                    fontFamily: mono ? "monospace" : "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            <button
              onClick={copyCredentials}
              className="btn-primary"
              style={{ marginTop: "4px", width: "100%", justifyContent: "center", padding: "10px 20px", fontSize: "0.8rem", borderRadius: "8px" }}
            >
              <i className={`fas ${copied ? "fa-check" : "fa-copy"}`} />
              {copied ? "Copied!" : "Copy Credentials"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <button
            onClick={() => { router.refresh(); router.push("/dashboard/owner/team"); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", fontSize: "0.8rem", fontWeight: 700,
              borderRadius: "8px", border: "1px solid var(--teal2)",
              color: "var(--teal2)", background: "transparent", cursor: "pointer",
              textTransform: "uppercase", letterSpacing: ".06em", transition: "all .25s",
            }}
          >
            <i className="fas fa-users" /> View Team
          </button>
          <button
            onClick={() => setCredentials(null)}
            className="btn-outline"
            style={{ padding: "10px 20px", fontSize: "0.8rem", borderRadius: "8px" }}
          >
            <i className="fas fa-plus" /> Add Another
          </button>
        </div>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────
  return (
    <div>
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>Add Team Member</h2>
          <p>Create a Manager or Receptionist account. Share the credentials with your staff.</p>
        </div>
        <div className="sec-actions">
          <Link href="/dashboard/owner/team" className="btn-outline" style={{ textDecoration: "none" }}>
            <i className="fas fa-arrow-left" /> Back
          </Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "480px" }}>
        <div className="card-head">
          <h3><i className="fas fa-user-plus" /> New Account</h3>
        </div>

        {error && (
          <div className="login-error show" style={{ margin: "0 20px 16px" }}>
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Role */}
          <div>
            <label className="login-label">Role</label>
            <select className="form-input" {...register("role")} defaultValue="">
              <option value="" disabled>Select role…</option>
              <option value="manager">Manager</option>
              <option value="receptionist">Receptionist</option>
            </select>
            {errors.role && (
              <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>{errors.role.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="login-label">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Amina Hassan"
              className="form-input"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>{errors.full_name.message}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="login-label">Username</label>
            <input
              type="text"
              placeholder="e.g. amina_hassan"
              autoCapitalize="none"
              className="form-input"
              {...register("username")}
            />
            <p style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "4px" }}>
              Lowercase letters, numbers, underscores only. This is what they type to log in.
            </p>
            {errors.username && (
              <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="login-label">Password</label>
            <div className="login-input-wrap" style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters"
                className="form-input"
                style={{ paddingRight: "44px" }}
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
            <p style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: "4px" }}>
              You will see this once — copy it after account creation.
            </p>
            {errors.password && (
              <p style={{ color: "var(--red)", fontSize: ".68rem", marginTop: "4px" }}>{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`login-btn${isSubmitting ? " loading" : ""}`}
            style={{ marginTop: "4px" }}
          >
            <span className="btn-text">
              <i className="fas fa-user-plus" /> Create Account
            </span>
            <span className="spinner" />
          </button>

        </form>
      </div>
    </div>
  );
}
