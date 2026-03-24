"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  password:  z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type Fields = z.infer<typeof schema>;

// The invite flow:
// 1. Admin invites member via Supabase (inviteUserByEmail) — done in Admin Dashboard (Step 11)
// 2. Member clicks email link → Supabase redirects to /auth/callback?code=...&type=invite
// 3. Callback route exchanges code, creates session, redirects to /invite/setup
// 4. This page: user sets password + name, then goes to /dashboard/member

export default function InvitePage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail,    setUserEmail]    = useState("");
  const [error,        setError]        = useState<string | null>(null);

  // Check if there is an active recovery/invite session
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? "");
        setSessionReady(true);
      }
    });

    // Also listen for the SIGNED_IN event (in case the callback just ran)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        setUserEmail(session.user.email ?? "");
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    setError(null);
    const supabase = createClient();

    // Update password and name
    const { error: updateErr } = await supabase.auth.updateUser({
      password: data.password,
      data: { full_name: data.full_name },
    });

    if (updateErr) { setError(updateErr.message); return; }

    // Also update the profile row
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ full_name: data.full_name })
        .eq("id", user.id);
    }

    window.location.href = "/dashboard/member";
  };

  // ── Loading — waiting for session ────────────────────────────────────────────

  if (!sessionReady) {
    return (
      <div className="w-full max-w-[420px] text-center">
        <div className="bg-white rounded-[12px] border border-border shadow-[0_8px_40px_rgba(0,0,0,0.07)] p-10">
          <i className="fas fa-circle-notch fa-spin text-teal-primary text-2xl mb-4 block" />
          <p className="text-muted text-[0.88rem]">Verifying your invite link…</p>
        </div>
      </div>
    );
  }

  // ── Setup form ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-[440px]">
      <div className="bg-white rounded-[12px] border border-border shadow-[0_8px_40px_rgba(0,0,0,0.07)] p-8">

        {/* Welcome header */}
        <div className="mb-7">
          <div className="w-12 h-12 bg-teal-wash rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-id-badge text-teal-primary text-lg" />
          </div>
          <span className="eyebrow mb-2 block">Member Invite</span>
          <h1 className="text-[1.5rem] font-bold text-dark leading-tight">
            Welcome to Ontime!
          </h1>
          {userEmail && (
            <p className="text-muted text-[0.82rem] mt-1.5">
              Setting up your account for <strong className="text-dark">{userEmail}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-[0.82rem] rounded-md px-4 py-3 mb-5 flex items-center gap-2">
            <i className="fas fa-exclamation-circle shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          <div>
            <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1.5">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Kamau"
              autoComplete="name"
              className="form-input"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-red-500 text-[0.72rem] mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1.5">
              Set Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="form-input"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-red-500 text-[0.72rem] mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1.5">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              className="form-input"
              {...register("confirm")}
            />
            {errors.confirm && (
              <p className="text-red-500 text-[0.72rem] mt-1">{errors.confirm.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 text-[0.88rem] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <><i className="fas fa-circle-notch fa-spin" /> Setting up account…</>
            ) : (
              <><i className="fas fa-check-circle" /> Complete Setup</>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
