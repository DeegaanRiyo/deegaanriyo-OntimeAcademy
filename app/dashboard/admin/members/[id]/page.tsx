import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditMemberForm from "./EditMemberForm";

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

export default async function EditMemberPage({
  params,
}: {
  params: { id: string };
}) {
  const anonClient = await createClient();
  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) redirect("/auth/login");

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await serviceClient.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "owner"].includes(profile?.role)) redirect("/dashboard");

  const { data } = await serviceClient
    .from("members")
    .select(
      "id, slug, profession, bio, is_active, subscription_start, subscription_end, profiles(full_name, email, phone)"
    )
    .eq("id", params.id)
    .single();

  if (!data) notFound();

  const member = data as unknown as MemberFull;

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
        <p className="eyebrow mb-1">Co-working Member</p>
        <h1 className="text-[1.6rem] font-extrabold text-dark leading-tight">
          {member.profiles.full_name}
        </h1>
        {/* Email read-only badge */}
        <div className="mt-2 inline-flex items-center gap-1.5 bg-[#E8F7F7] text-[#0D7377] text-[0.8rem] font-medium px-3 py-1 rounded-full">
          <i className="fas fa-envelope text-xs" />
          {member.profiles.email}
        </div>
      </div>

      {/* Form card */}
      <div className="card p-6 sm:p-8">
        <EditMemberForm member={member} />
      </div>
    </div>
  );
}
