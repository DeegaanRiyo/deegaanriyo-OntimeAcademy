"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

type MemberFull = {
  id: string;
  slug: string;
  profession: string | null;
  bio: string | null;
  is_active: boolean;
  subscription_start: string | null;
  subscription_end: string | null;
  profiles: { full_name: string; email: string; phone: string | null };
};

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  profession: z.string().optional(),
  bio: z.string().optional(),
  subscription_start: z.string().optional(),
  subscription_end: z.string().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function EditMemberForm({ member }: { member: MemberFull }) {
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: member.profiles.full_name,
      phone: member.profiles.phone ?? "",
      profession: member.profession ?? "",
      bio: member.bio ?? "",
      subscription_start: member.subscription_start ?? "",
      subscription_end: member.subscription_end ?? "",
      is_active: member.is_active,
    },
  });

  async function onSubmit(values: FormValues) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Full name */}
      <div>
        <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("full_name")}
          type="text"
          className="form-input w-full"
        />
        {errors.full_name && (
          <p className="text-red-500 text-[0.8rem] mt-1">{errors.full_name.message}</p>
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

      {/* Bio */}
      <div>
        <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
          Bio <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          {...register("bio")}
          rows={3}
          placeholder="Short bio..."
          className="form-input w-full resize-none"
        />
      </div>

      {/* Subscription dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
            Subscription Start
          </label>
          <input
            {...register("subscription_start")}
            type="date"
            className="form-input w-full"
          />
        </div>
        <div>
          <label className="block text-[0.85rem] font-semibold text-dark mb-1.5">
            Subscription End
          </label>
          <input
            {...register("subscription_end")}
            type="date"
            className="form-input w-full"
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-4 py-3">
        <div>
          <p className="text-[0.88rem] font-semibold text-dark">Active Subscription</p>
          <p className="text-[0.78rem] text-muted">Toggle to mark member as active or expired</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            {...register("is_active")}
            type="checkbox"
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-[#E5E7EB] peer-focus:ring-2 peer-focus:ring-[#0D7377]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D7377]" />
        </label>
      </div>

      {/* Feedback messages */}
      {status === "saved" && (
        <div className="bg-green-50 border border-green-200 rounded-[8px] px-4 py-3 flex items-center gap-2">
          <i className="fas fa-check-circle text-green-600 shrink-0" />
          <p className="text-green-700 text-[0.85rem] font-medium">Changes saved successfully.</p>
        </div>
      )}
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
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
