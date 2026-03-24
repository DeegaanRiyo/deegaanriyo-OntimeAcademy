import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EditProfileForm from "@/components/dashboard/member/EditProfileForm";

export default async function MemberProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "member") redirect("/dashboard");

  const { data: member } = await supabase
    .from("members")
    .select(
      "id, slug, profession, bio, portfolio_url, linkedin_url, twitter_url, is_public"
    )
    .eq("id", user.id)
    .single();

  if (!member) notFound();

  return (
    <div className="max-w-[1160px] mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <p className="eyebrow mb-1">Member Dashboard</p>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">My Profile</h1>
        <p className="text-[#6B7280] mt-1">
          Update your public profile and contact details.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-[1fr_300px] gap-6 max-lg:grid-cols-1">
        {/* Left — Edit Form */}
        <EditProfileForm profile={profile} member={member} />

        {/* Right — Sidebar Cards */}
        <aside className="flex flex-col gap-4">
          {/* Card 1: Profile Visibility */}
          <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-5">
            <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Profile Visibility
            </h2>
            <div className="flex items-center gap-2 mb-2">
              {member.is_public ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F7F7] text-[#0D7377]">
                  Public
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-[#6B7280]">
                  Private
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">
              You can toggle visibility in the form.
            </p>
          </div>

          {/* Card 2: Membership */}
          <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-5">
            <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Membership
            </h2>
            <div className="mb-3">
              <p className="text-xs text-[#6B7280] mb-0.5">Email address</p>
              <p className="text-sm font-medium text-[#1A1A1A] break-all">
                {profile.email}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Email cannot be changed here.
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] mb-0.5">Directory slug</p>
              {member.is_public ? (
                <Link
                  href={`/members/${member.slug}`}
                  className="text-sm font-medium text-[#0D7377] hover:text-[#14A3A8] transition-colors"
                >
                  /members/{member.slug}
                </Link>
              ) : (
                <p className="text-sm font-medium text-[#1A1A1A]">
                  /members/{member.slug}
                </p>
              )}
            </div>
          </div>

          {/* Card 3: Public Profile (only if is_public) */}
          {member.is_public && (
            <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-5">
              <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Public Profile
              </h2>
              <Link
                href={`/members/${member.slug}`}
                className="text-sm font-medium text-[#0D7377] hover:text-[#14A3A8] transition-colors"
              >
                View your public profile →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
