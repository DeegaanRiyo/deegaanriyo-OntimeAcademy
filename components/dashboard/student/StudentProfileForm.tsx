"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type Props = {
  userId: string;
  initialName: string;
  initialEmail: string;
  initialAvatar: string;
};

const schema = z.object({
  full_name:  z.string().min(2, "Name must be at least 2 characters"),
  avatar_url: z.union([z.string().url("Enter a valid URL"), z.literal("")]),
});

type FormData = z.infer<typeof schema>;

export default function StudentProfileForm({ userId, initialName, initialEmail, initialAvatar }: Props) {
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name:  initialName,
      avatar_url: initialAvatar,
    },
  });

  const avatarUrl = watch("avatar_url");
  const initials  = (initialName || initialEmail).slice(0, 2).toUpperCase();

  const onSubmit = async (data: FormData) => {
    setSuccess(false);
    const res = await fetch("/api/student/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ full_name: data.full_name.trim(), avatar_url: data.avatar_url.trim() }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError("root", { message: j.error ?? "Failed to update profile." });
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="card">
        <div className="card-head">
          <h3><i className="fas fa-user-circle" /> Account Info</h3>
        </div>
        <div className="px-6 py-[22px] flex flex-col gap-[18px]">

          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center font-bold text-[1.1rem] text-white"
              style={{
                background: avatarUrl
                  ? `url(${avatarUrl}) center/cover no-repeat`
                  : "linear-gradient(135deg,var(--teal),var(--teal2))",
              }}
            >
              {!avatarUrl && initials}
            </div>
            <p className="flex-1 text-[.75rem] text-[var(--muted)]">
              Paste an image URL below to update your avatar.
            </p>
          </div>

          {/* Messages */}
          {errors.root && (
            <div className="bg-[rgba(239,68,68,.08)] border border-[rgba(239,68,68,.25)] rounded-lg px-3.5 py-2.5 text-[.78rem] text-[var(--red)] flex items-center gap-2">
              <i className="fas fa-circle-exclamation" aria-hidden="true" /> {errors.root.message}
            </div>
          )}
          {success && (
            <div className="bg-[rgba(34,197,94,.08)] border border-[rgba(34,197,94,.25)] rounded-lg px-3.5 py-2.5 text-[.78rem] text-[var(--green)] flex items-center gap-2">
              <i className="fas fa-check-circle" aria-hidden="true" /> Profile updated successfully.
            </div>
          )}

          {/* Email (read-only) */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input disabled:opacity-60 disabled:cursor-not-allowed"
              value={initialEmail}
              disabled
            />
            <span className="text-[.68rem] text-[var(--muted)] mt-1 block">
              Email cannot be changed here.
            </span>
          </div>

          {/* Full name */}
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              type="text"
              className={`form-input ${errors.full_name ? "border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(239,68,68,.1)]" : ""}`}
              placeholder="Your full name"
              aria-invalid={!!errors.full_name}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-[.7rem] text-[var(--red)] flex items-center gap-1 mt-1">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Avatar URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="avatar_url">
              Avatar URL{" "}
              <span className="text-[var(--muted)] font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="avatar_url"
              type="url"
              className={`form-input ${errors.avatar_url ? "border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(239,68,68,.1)]" : ""}`}
              placeholder="https://…"
              aria-invalid={!!errors.avatar_url}
              {...register("avatar_url")}
            />
            {errors.avatar_url && (
              <p className="text-[.7rem] text-[var(--red)] flex items-center gap-1 mt-1">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                {errors.avatar_url.message}
              </p>
            )}
          </div>

        </div>
        <div className="modal-foot">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-sm btn-primary disabled:opacity-60"
          >
            {isSubmitting
              ? <><i className="fas fa-circle-notch fa-spin" /> Saving…</>
              : <><i className="fas fa-save" /> Save Changes</>}
          </button>
        </div>
      </div>
    </form>
  );
}
