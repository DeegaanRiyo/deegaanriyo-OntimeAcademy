import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Space } from "@/types";

const pillsMap: Record<string, string[]> = {
  boardroom:          ["TV & Projector", "Video Conf.", "Wi-Fi", "Air-Con"],
  "conference-room":  ["Up to 50 people", "AV Setup", "Wi-Fi", "Air-Con"],
  "podcast-studio":   ["Studio Mics", "Cameras", "Studio Lighting", "Sound Setup"],
  "content-studio":   ["Green Screen", "Backdrops", "Ring Lights", "Cameras"],
};

const placeholderImages: Record<string, string> = {
  boardroom:          "/ontimemedia/boardroom.jpeg",
  "conference-room":  "/ontimemedia/confrenceroom.jpeg",
  "podcast-studio":   "/ontimemedia/podcast.png",
  "content-studio":   "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80",
};

export const metadata = {
  title: "Our Spaces — Ontime Academy & Co-working Space",
  description:
    "Browse and book Ontime's co-working spaces in Nairobi — boardroom, conference hall, podcast studio, and content studio.",
};

export default async function SpacesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("spaces")
    .select("id, name, slug, description, hourly_rate, is_available, photos")
    .order("created_at", { ascending: true });

  const spaces: Space[] = (data as Space[]) ?? [];

  return (
    <div className="bg-[var(--dark)] text-[var(--white)] min-h-screen">

      {/* Page hero */}
      <section className="bg-[#1e1e1e] border-b border-[rgba(255,255,255,.06)] px-[clamp(20px,6vw,72px)] pt-[120px] pb-[60px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-3">
            Our Spaces
          </div>
          <h1 className="font-[var(--font-fraunces)] text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.02em] leading-[1.1] mb-4">
            Find the perfect space for your next session.
          </h1>
          <p className="text-[rgba(244,250,250,.65)] text-[1.05rem] leading-[1.8] max-w-[520px]">
            Four purpose-built spaces in Nairobi — available to book by the hour or for the full day.
          </p>
        </div>
      </section>

      {/* Cards grid */}
      <section className="px-[clamp(20px,6vw,72px)] py-[60px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {spaces.map((sp: Space) => {
              const image = sp.photos?.[0] ?? placeholderImages[sp.slug] ?? "";
              const pills = pillsMap[sp.slug] ?? [];

              return (
                <div
                  key={sp.id}
                  className="bg-[#1c1c1c] border border-[rgba(255,255,255,.08)] rounded-xl overflow-hidden transition-all duration-300 hover:border-[rgba(193,68,14,.4)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,.4)]"
                >
                  {/* Image — full bleed, taller for more visual impact */}
                  <div className="relative h-[260px] overflow-hidden">
                    <Image
                      src={image}
                      alt={sp.name}
                      fill
                      className="object-cover object-center transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* Subtle gradient overlay so image blends into card body */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] via-transparent to-transparent opacity-60" />
                    {/* Availability badge overlaid on image */}
                    <div className="absolute top-3 right-3">
                      {sp.is_available ? (
                        <span className="px-3 py-1 rounded-full text-[.63rem] font-bold bg-[rgba(0,0,0,.55)] backdrop-blur-sm text-[#86efac] border border-[rgba(34,197,94,.4)]">
                          Available
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[.63rem] font-bold bg-[rgba(0,0,0,.55)] backdrop-blur-sm text-[#fca5a5] border border-[rgba(239,68,68,.4)]">
                          Occupied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <div className="mb-2">
                      <h2 className="text-[1.15rem] font-bold text-white m-0">{sp.name}</h2>
                    </div>

                    <p className="text-[.88rem] text-[rgba(255,255,255,.78)] leading-[1.65] mb-4 line-clamp-2">
                      {sp.description ?? "A professional space designed for productivity and collaboration."}
                    </p>

                    {/* Feature pills */}
                    <div className="flex gap-1.5 flex-wrap mb-5">
                      {pills.map((pill) => (
                        <span
                          key={pill}
                          className="px-3 py-1 rounded-full bg-[rgba(193,68,14,.15)] border border-[rgba(193,68,14,.25)] text-[#f4a97f] text-[.7rem] font-semibold"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,.08)]">
                      <span className="text-[1.05rem] font-extrabold text-white">
                        {sp.hourly_rate > 0 ? (
                          <>
                            KES {sp.hourly_rate.toLocaleString()}
                            <span className="text-[.72rem] font-normal text-[rgba(255,255,255,.45)]"> /hr</span>
                          </>
                        ) : (
                          <span className="text-[.82rem] font-semibold text-[rgba(255,255,255,.45)]">
                            Enquire for pricing
                          </span>
                        )}
                      </span>
                      <Link
                        href={`/spaces/${sp.slug}`}
                        className="inline-flex items-center gap-1.5 text-white text-[.8rem] font-bold px-[22px] py-2.5 rounded-md transition-opacity duration-200 hover:opacity-90 gradient-brand"
                      >
                        View &amp; Book
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {spaces.length === 0 && (
            <div className="text-center py-24 text-[var(--muted)] text-[.9rem]">
              Spaces are loading — please check back shortly.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
