"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  profession: z.string().optional(),
  bio: z.string().max(300, "Bio max 300 characters").optional(),
  portfolio_url: z
    .string()
    .url("Enter a valid URL")
    .or(z.literal(""))
    .optional(),
  linkedin_url: z
    .string()
    .url("Enter a valid URL")
    .or(z.literal(""))
    .optional(),
  twitter_url: z
    .string()
    .url("Enter a valid URL")
    .or(z.literal(""))
    .optional(),
  is_public: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  member: {
    id: string;
    slug: string;
    profession: string | null;
    bio: string | null;
    portfolio_url: string | null;
    linkedin_url: string | null;
    twitter_url: string | null;
    is_public: boolean;
  };
};

export default function EditProfileForm({ profile, member }: Props) {
  const router = useRouter();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      profession: member.profession ?? "",
      bio: member.bio ?? "",
      portfolio_url: member.portfolio_url ?? "",
      linkedin_url: member.linkedin_url ?? "",
      twitter_url: member.twitter_url ?? "",
      is_public: member.is_public,
    },
  });

  const watchedBio = watch("bio");
  const watchedPublic = watch("is_public");

  async function onSubmit(values: FormValues) {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong.");
        return;
      }
      setSuccessMsg("Profile updated!");
      router.refresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-[10px] border border-[#E5E7EB] p-8"
    >
      {/* Success Banner */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <i className="fa-solid fa-circle-check" />
          {successMsg}
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <i className="fa-solid fa-circle-exclamation" />
          {errorMsg}
        </div>
      )}

      {/* Section: Personal Details */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">
          Personal Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("full_name")}
              className="form-input w-full"
              placeholder="Your full name"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Phone
            </label>
            <input
              {...register("phone")}
              className="form-input w-full"
              placeholder="+254 700 000 000"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Professional Info */}
      <div className="mt-6 border-t border-[#E5E7EB] pt-6">
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">
          Professional Info
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Profession / Title
            </label>
            <input
              {...register("profession")}
              className="form-input w-full"
              placeholder="e.g. Software Developer"
            />
            {errors.profession && (
              <p className="mt-1 text-xs text-red-500">
                {errors.profession.message}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[#1A1A1A]">
                Bio
              </label>
              <span className="text-xs text-[#6B7280]">
                {watchedBio?.length ?? 0}/300
              </span>
            </div>
            <textarea
              {...register("bio")}
              rows={4}
              className="form-input w-full resize-none"
              placeholder="Tell people a little about yourself..."
            />
            {errors.bio && (
              <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Social Links */}
      <div className="mt-6 border-t border-[#E5E7EB] pt-6">
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">
          Social Links
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Portfolio / Website
            </label>
            <input
              {...register("portfolio_url")}
              className="form-input w-full"
              placeholder="https://..."
            />
            {errors.portfolio_url && (
              <p className="mt-1 text-xs text-red-500">
                {errors.portfolio_url.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              LinkedIn
            </label>
            <input
              {...register("linkedin_url")}
              className="form-input w-full"
              placeholder="https://linkedin.com/in/..."
            />
            {errors.linkedin_url && (
              <p className="mt-1 text-xs text-red-500">
                {errors.linkedin_url.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Twitter / X
            </label>
            <input
              {...register("twitter_url")}
              className="form-input w-full"
              placeholder="https://twitter.com/..."
            />
            {errors.twitter_url && (
              <p className="mt-1 text-xs text-red-500">
                {errors.twitter_url.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Profile Visibility */}
      <div className="mt-6 border-t border-[#E5E7EB] pt-6">
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">
          Profile Visibility
        </h2>
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => setValue("is_public", !watchedPublic)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:ring-offset-2 ${
              watchedPublic ? "bg-[#0D7377]" : "bg-gray-300"
            }`}
            role="switch"
            aria-checked={watchedPublic}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                watchedPublic ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">
              Show my profile in the member directory
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              When enabled, your name and profile are visible to visitors.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin" />
              Saving…
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk" />
              Save Profile
            </>
          )}
        </button>
      </div>
    </form>
  );
}
