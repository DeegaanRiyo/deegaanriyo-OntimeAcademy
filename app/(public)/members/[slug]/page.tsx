import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

type MemberDetail = {
  id: string;
  slug: string;
  profession: string | null;
  bio: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  is_active: boolean;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase  = await createClient();

  const { data } = await supabase
    .from("members")
    .select("slug, profession, profiles(full_name)")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!data) return { title: "Member not found" };

  const name       = (data.profiles as unknown as { full_name: string })?.full_name ?? "Ontime Member";
  const profession = data.profession ?? "Ontime Co-working Member";

  return {
    title: `${name} — Ontime Member Directory`,
    description: `${name} · ${profession} · Ontime Co-working Space, Nairobi.`,
  };
}

export default async function MemberProfilePage({ params }: Props) {
  const { slug } = await params;
  const supabase  = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select(`
      id, slug, profession, bio,
      portfolio_url, linkedin_url, twitter_url,
      subscription_start, subscription_end, is_active,
      profiles(full_name, avatar_url, email)
    `)
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (error || !data) notFound();

  const member  = data as unknown as MemberDetail;
  const profile = member.profiles;
  const name    = profile?.full_name ?? "Ontime Member";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  let daysRemaining: number | null = null;
  if (member.subscription_end) {
    const end  = new Date(member.subscription_end);
    const now  = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    daysRemaining = diff > 0 ? diff : 0;
  }

  const socialLinks = [
    member.portfolio_url && { href: member.portfolio_url, icon: "fas fa-globe",     label: "Portfolio"   },
    member.linkedin_url  && { href: member.linkedin_url,  icon: "fab fa-linkedin",  label: "LinkedIn"    },
    member.twitter_url   && { href: member.twitter_url,   icon: "fab fa-twitter",   label: "Twitter / X" },
  ].filter(Boolean) as { href: string; icon: string; label: string }[];

  return (
    <div className="bg-[var(--dark)] text-[var(--white)] min-h-screen">

      {/* Back link */}
      <div className="bg-[var(--dark2)] border-b border-[var(--border)] px-[clamp(20px,6vw,72px)] pt-24 pb-4">
        <div className="max-w-[1200px] mx-auto">
          <Link
            href="/members"
            className="text-[var(--muted)] text-[.8rem] inline-flex items-center gap-1.5 hover:text-[var(--white)] transition-colors duration-200"
          >
            <i className="fas fa-arrow-left text-[.7rem]" aria-hidden="true" />
            Back to Member Directory
          </Link>
        </div>
      </div>

      {/* Profile hero */}
      <div className="bg-[var(--dark2)] border-b border-[var(--border)] px-[clamp(20px,6vw,72px)] py-10">
        <div className="max-w-[1200px] mx-auto flex items-start gap-7 flex-wrap">

          {/* Avatar */}
          <div className="relative shrink-0">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={name}
                width={96}
                height={96}
                className="rounded-full object-cover border-[3px] border-[var(--teal)] block"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-[1.5rem] font-bold text-white gradient-brand"
              >
                {initials}
              </div>
            )}
            {member.is_active && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#4ade80] rounded-full border-2 border-[var(--dark2)] block" />
            )}
          </div>

          {/* Name + profession */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-[var(--font-fraunces)] text-[clamp(1.4rem,3vw,1.9rem)] font-black tracking-[-0.02em] leading-[1.2] m-0">
                {name}
              </h1>
              {member.is_active && (
                <span className="text-[.65rem] font-bold tracking-[.12em] uppercase text-[var(--teal2)] bg-[rgba(193,68,14,.12)] border border-[rgba(193,68,14,.25)] rounded px-2 py-0.5">
                  Active Member
                </span>
              )}
            </div>

            {member.profession && (
              <p className="text-[var(--teal2)] font-semibold text-[.9rem] mb-3">{member.profession}</p>
            )}

            {member.bio && (
              <p className="text-[var(--muted)] text-[.88rem] leading-[1.75] max-w-[640px]">{member.bio}</p>
            )}

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[.8rem] font-semibold border border-[var(--border)] px-3.5 py-1.5 rounded-full hover:border-[rgba(193,68,14,.4)] hover:text-[var(--teal2)] transition-all duration-200"
                  >
                    <i className={`${s.icon} text-[.75rem]`} aria-hidden="true" />
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Membership card */}
          <div className="bg-[rgba(193,68,14,.08)] border border-[rgba(193,68,14,.2)] rounded-xl p-6 shrink-0 min-w-[200px]">
            <p className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-4">
              Membership
            </p>
            <div className="flex flex-col gap-3">
              {member.subscription_start && (
                <div>
                  <p className="text-[.68rem] text-[var(--muted)] mb-0.5">Member since</p>
                  <p className="text-[.85rem] font-semibold">
                    {new Date(member.subscription_start).toLocaleDateString("en-KE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
              {daysRemaining !== null && (
                <div>
                  <p className="text-[.68rem] text-[var(--muted)] mb-0.5">Subscription</p>
                  <p
                    className="text-[.85rem] font-semibold"
                    style={{ color: daysRemaining > 7 ? "#4ade80" : "#f59e0b" }}
                  >
                    {daysRemaining > 0 ? `${daysRemaining} days left` : "Expired"}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1200px] mx-auto px-[clamp(20px,6vw,72px)] py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* Left — placeholder */}
          <div className="bg-[var(--dark2)] rounded-xl border border-[var(--border)] p-12 text-center">
            <div className="w-12 h-12 bg-[rgba(193,68,14,.15)] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-layer-group text-[var(--teal2)] text-[1.1rem]" aria-hidden="true" />
            </div>
            <p className="font-bold text-[.95rem] mb-1.5">Activity coming soon</p>
            <p className="text-[var(--muted)] text-[.82rem] leading-[1.7] max-w-[300px] mx-auto">
              Course history, achievements, and community contributions will appear here in Phase 2.
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">

            {/* Connect card */}
            <div className="bg-[var(--dark2)] rounded-xl border border-[var(--border)] p-6">
              <h3 className="font-bold text-[.92rem] mb-4">
                Connect with {name.split(" ")[0]}
              </h3>
              <a
                href={`https://wa.me/254746628668?text=${encodeURIComponent(`Hi, I'd like to connect with ${name} — I found them on the Ontime member directory.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-white font-bold py-3 rounded-md text-[.84rem] transition-opacity duration-200 hover:opacity-90 gradient-brand"
              >
                <i className="fab fa-whatsapp" aria-hidden="true" />
                Connect via Ontime
              </a>
              <p className="text-center text-[.7rem] text-[var(--muted)] mt-2">
                We&apos;ll pass your message on
              </p>
            </div>

            {/* Also at Ontime */}
            <div className="bg-[var(--dark2)] rounded-xl border border-[var(--border)] p-6">
              <p className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--muted)] mb-4">
                Also at Ontime
              </p>
              {[
                { href: "/members",  icon: "fas fa-users",          label: "Browse all members" },
                { href: "/spaces",   icon: "fas fa-building",        label: "Book a space"       },
                { href: "/courses",  icon: "fas fa-graduation-cap",  label: "Academy courses"    },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-2 text-[.82rem] text-[var(--muted)] py-1.5 hover:text-[var(--white)] transition-colors duration-200"
                >
                  <i className={`${l.icon} text-[.75rem]`} aria-hidden="true" />
                  {l.label}
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
