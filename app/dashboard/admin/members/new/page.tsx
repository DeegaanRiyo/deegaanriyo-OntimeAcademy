"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  profession: z.string().optional(),
  subscription_start: z.string().min(1, "Start date is required"),
  subscription_end: z.string().min(1, "End date is required"),
});

type FormValues = z.infer<typeof schema>;

export default function AddMemberPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-[560px] mx-auto">
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#E8F7F7] flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-xl text-[#0D7377]" />
          </div>
          <h2 className="text-[1.2rem] font-bold text-dark mb-2">Member Created</h2>
          <p className="text-muted text-[0.9rem] mb-6">
            An invite email has been sent to the member. They can set their password using the link in the email.
          </p>
          <Link
            href="/dashboard/admin/members"
            className="btn-primary inline-flex items-center gap-2"
          >
            <i className="fas fa-users" />
            View Members
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[560px] mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/admin/members"
        className="inline-flex items-center gap-1.5 text-[0.88rem] text-muted hover:text-dark transition-colors mb-6"
      >
        <i className="fas fa-arrow-left text-xs" />
        Back to Members
      </Link>

      {/* Page title */}
      <div className="mb-6">
        <p className="eyebrow mb-1">Co-Working</p>
        <h1 className="text-[1.6rem] font-extrabold text-dark leading-tight">Add New Member</h1>
      </div>

      {/* Form card */}
      <div className="card p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Full name */}
          <div>
            <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("full_name")}
              type="text"
              placeholder="Jane Doe"
              className="form-input w-full"
            />
            {errors.full_name && (
              <p className="text-red-500 text-[0.8rem] mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="jane@example.com"
              className="form-input w-full"
            />
            {errors.email && (
              <p className="text-red-500 text-[0.8rem] mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
              Phone <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="+254 700 000 000"
              className="form-input w-full"
            />
          </div>

          {/* Profession */}
          <div>
            <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
              Profession <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              {...register("profession")}
              type="text"
              placeholder="e.g. Graphic Designer"
              className="form-input w-full"
            />
          </div>

          {/* Subscription dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
                Subscription Start <span className="text-red-500">*</span>
              </label>
              <input
                {...register("subscription_start")}
                type="date"
                className="form-input w-full"
              />
              {errors.subscription_start && (
                <p className="text-red-500 text-[0.8rem] mt-1">{errors.subscription_start.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
                Subscription End <span className="text-red-500">*</span>
              </label>
              <input
                {...register("subscription_end")}
                type="date"
                className="form-input w-full"
              />
              {errors.subscription_end && (
                <p className="text-red-500 text-[0.8rem] mt-1">{errors.subscription_end.message}</p>
              )}
            </div>
          </div>

          {/* Error message */}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-[8px] px-4 py-3 flex items-start gap-2">
              <i className="fas fa-exclamation-circle text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-[0.85rem]">{errorMsg}</p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" />
                  Create Member &amp; Send Invite
                </>
              )}
            </button>
            <p className="text-center text-muted text-[0.8rem] mt-3">
              An invite email will be sent to the address above.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
