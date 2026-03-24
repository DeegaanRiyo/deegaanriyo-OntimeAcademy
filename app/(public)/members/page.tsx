import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Member Directory — Ontime Academy & Co-working Space",
  description:
    "Meet the professionals, creators, and entrepreneurs who work out of Ontime Co-working Space in Nairobi.",
};

type MemberRow = {
  id: string;
  slug: string;
  profession: string | null;
  bio: string | null;
  is_active: boolean;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
};

export default async function MembersPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("members")
    .select("id, slug, profession, bio, is_active, profiles(full_name, avatar_url)")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const members: MemberRow[] = (data as unknown as MemberRow[]) ?? [];

  return (
    <div className="bg-[var(--dark)] text-[var(--white)] min-h-screen">

      {/* Hero */}
      <section className="bg-[#1e1e1e] border-b border-[rgba(255,255,255,.06)] px-[clamp(20px,6vw,72px)] pt-[120px] pb-[60px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-3">
            Community
          </div>
          <h1 className="font-[var(--font-fraunces)] text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.02em] leading-[1.1] mb-4">
            Meet the Ontime community.
          </h1>
          <p className="text-[rgba(244,250,250,.65)] text-[1.05rem] leading-[1.8] max-w-[520px]">
            Professionals, creators, and entrepreneurs building their next chapter
            right here in Nairobi. Browse our member directory and make a connection.
          </p>

          {/* Stats strip */}
          <div className="flex gap-8 mt-6 flex-wrap">
            <div>
              <div className="text-[1.8rem] font-extrabold text-[var(--teal2)] leading-none">
                {members.length > 0 ? `${members.length}+` : "500+"}
              </div>
              <div className="text-[.72rem] text-[var(--muted)] mt-1">Active members</div>
            </div>
            <div>
              <div className="text-[1.8rem] font-extrabold text-[var(--teal2)] leading-none">20+</div>
              <div className="text-[.72rem] text-[var(--muted)] mt-1">Industries represented</div>
            </div>
            <div>
              <div className="text-[1.8rem] font-extrabold text-[var(--teal2)] leading-none">1</div>
              <div className="text-[.72rem] text-[var(--muted)] mt-1">Nairobi location</div>
            </div>
          </div>
        </div>
      </section>

      {/* Member grid */}
      <section className="px-[clamp(20px,6vw,72px)] py-14">
        <div className="max-w-[1200px] mx-auto">

          {members.length > 0 ? (
            <>
              <p className="text-[.85rem] text-[rgba(244,250,250,.5)] mb-6">
                {members.length} member{members.length !== 1 ? "s" : ""} listed
              </p>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
                {members.map((member) => {
                  const name     = member.profiles?.full_name ?? "Ontime Member";
                  const avatar   = member.profiles?.avatar_url;
                  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

                  return (
                    <Link
                      key={member.id}
                      href={`/members/${member.slug}`}
                      className="block bg-[#222] border border-[rgba(255,255,255,.07)] rounded-xl p-6 text-center no-underline text-inherit transition-all duration-300 hover:border-[rgba(193,68,14,.3)] hover:-translate-y-0.5"
                    >
                      {/* Avatar */}
                      <div className="relative w-fit mx-auto mb-4">
                        {avatar ? (
                          <Image
                            src={avatar}
                            alt={name}
                            width={72}
                            height={72}
                            className="rounded-full object-cover border-2 border-[var(--border)] block"
                          />
                        ) : (
                          <div
                            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[1.2rem] font-bold text-white gradient-brand"
                          >
                            {initials}
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#4ade80] rounded-full border-2 border-[var(--dark2)] block" />
                      </div>

                      <p className="font-bold text-[.92rem] leading-[1.3] mb-1 truncate text-[var(--white)]">
                        {name}
                      </p>

                      {member.profession && (
                        <p className="text-[var(--teal2)] text-[.73rem] font-semibold mb-2 truncate">
                          {member.profession}
                        </p>
                      )}

                      {member.bio && (
                        <p className="text-[rgba(244,250,250,.55)] text-[.82rem] leading-[1.6] line-clamp-2">
                          {member.bio}
                        </p>
                      )}

                      <p className="mt-3 text-[var(--teal2)] text-[.74rem] font-semibold">
                        View profile →
                      </p>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState />
          )}

          {/* Membership CTA */}
          <div className="bg-[rgba(193,68,14,.08)] border border-[rgba(193,68,14,.2)] rounded-xl p-8 flex items-center justify-between flex-wrap gap-5 mt-12">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 gradient-brand"
              >
                <i className="fas fa-id-badge text-white text-[1.1rem]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[1rem] font-bold mb-1">Become an Ontime member</p>
                <p className="text-[.82rem] text-[rgba(244,250,250,.6)]">
                  KES 7,500/month · Hot desk access · Community network · Academy discounts
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/254746628668?text=${encodeURIComponent("Hi, I'd like to find out more about Ontime Academy & Co-working Space membership.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white text-[.82rem] font-bold px-7 py-3 rounded-md shrink-0 transition-opacity duration-200 hover:opacity-90 gradient-brand"
            >
              <i className="fab fa-whatsapp" aria-hidden="true" />
              Enquire about membership
            </a>
          </div>

        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 px-5">
      <div className="w-16 h-16 bg-[rgba(193,68,14,.15)] rounded-full flex items-center justify-center mx-auto mb-5">
        <i className="fas fa-users text-[var(--teal2)] text-[1.4rem]" aria-hidden="true" />
      </div>
      <h2 className="font-bold text-[var(--white)] text-[1.1rem] mb-2">
        Our members are joining soon
      </h2>
      <p className="text-[rgba(244,250,250,.55)] text-[.88rem] max-w-[340px] mx-auto leading-[1.7]">
        The community directory will be live shortly.
        Interested in becoming an Ontime member?
      </p>
      <a
        href={`https://wa.me/254746628668?text=${encodeURIComponent("Hi, I'd like to find out more about Ontime Academy & Co-working Space membership.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-white text-[.82rem] font-bold px-7 py-3 rounded-md mt-6 transition-opacity duration-200 hover:opacity-90 gradient-brand"
      >
        <i className="fab fa-whatsapp" aria-hidden="true" />
        Chat with us
      </a>
    </div>
  );
}
