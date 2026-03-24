import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Space } from "@/types";
import BookingForm from "@/components/public/booking/BookingForm";
import SpaceScheduleClient from "./SpaceScheduleClient";

// ─── Static data maps ───────────────────────────────────────────────────────

const placeholderImages: Record<string, string> = {
  boardroom:          "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80",
  "conference-room":  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
  "podcast-studio":   "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80",
  "content-studio":   "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80",
};

const galleryFallback: Record<string, [string, string]> = {
  boardroom: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=75",
    "https://images.unsplash.com/photo-1497366754035-f200586c6ef0?w=800&q=75",
  ],
  "conference-room": [
    "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&q=75",
    "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&q=75",
  ],
  "podcast-studio": [
    "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=75",
    "https://images.unsplash.com/photo-1493552532829-d4218da09e96?w=800&q=75",
  ],
  "content-studio": [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=75",
    "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=75",
  ],
};

const pillsMap: Record<string, string[]> = {
  boardroom:          ["TV & Projector", "Video Conf.", "Wi-Fi", "Air-Con"],
  "conference-room":  ["Up to 50 people", "AV Setup", "Wi-Fi", "Air-Con"],
  "podcast-studio":   ["Studio Mics", "Cameras", "Studio Lighting", "Sound Setup"],
  "content-studio":   ["Green Screen", "Backdrops", "Ring Lights", "Cameras"],
};

const eyebrowMap: Record<string, string> = {
  boardroom:          "Meeting Room",
  "conference-room":  "Multipurpose Hall · Seats 50",
  "podcast-studio":   "Multipurpose Hall · Podcast Setup",
  "content-studio":   "Multipurpose Hall · Content Setup",
};

const includedMap: Record<string, string[]> = {
  boardroom: [
    "Large TV & projector",
    "Video conferencing setup",
    "Whiteboard",
    "High-speed Wi-Fi",
    "Air conditioning",
    "Seating for up to 10",
  ],
  "conference-room": [
    "Seats up to 50 people",
    "Full AV setup",
    "Projector & screen",
    "High-speed Wi-Fi",
    "Air conditioning",
    "Flexible seating arrangements",
  ],
  "podcast-studio": [
    "Professional studio microphones",
    "Camera & tripod setup",
    "Studio lighting rig",
    "Soundproofing panels",
    "Live streaming capable",
    "Recording software available",
  ],
  "content-studio": [
    "Green screen backdrop",
    "Professional backdrops (multiple)",
    "Ring lights & LED panels",
    "Camera & tripod",
    "High-speed Wi-Fi",
    "Changing area available",
  ],
};

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase  = await createClient();

  const { data: space } = await supabase
    .from("spaces")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!space) return { title: "Space not found" };

  return {
    title: `${space.name} — Ontime Academy & Co-working Space`,
    description:
      space.description ??
      `Book the ${space.name} at Ontime Academy in Nairobi.`,
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase  = await createClient();

  const { data: space, error } = await supabase
    .from("spaces")
    .select("id, name, slug, description, hourly_rate, is_available, photos")
    .eq("slug", slug)
    .single();

  if (error || !space) notFound();

  const sp            = space as Space;
  const heroImage     = sp.photos?.[0] ?? placeholderImages[sp.slug] ?? "";
  const pills         = pillsMap[sp.slug] ?? [];
  const eyebrow       = eyebrowMap[sp.slug] ?? "Co-working Space";
  const included      = includedMap[sp.slug] ?? [];
  const [gal1, gal2]  = galleryFallback[sp.slug] ?? [heroImage, heroImage];

  const galleryImages: string[] =
    sp.photos && sp.photos.length > 1
      ? sp.photos.slice(1)
      : [gal1, gal2];

  return (
    <div className="bg-[var(--dark)] text-[var(--white)] min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative h-[460px] overflow-hidden">
        <Image
          src={heroImage}
          alt={sp.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div
          className="absolute inset-0 hero-overlay"
        />
        <div className="absolute bottom-0 left-0 right-0 px-[clamp(20px,6vw,72px)] py-10">
          <div className="max-w-[1200px] mx-auto flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-[rgba(244,250,250,.6)] text-[.65rem] font-bold tracking-[.2em] uppercase mb-2">
                {eyebrow}
              </div>
              <h1 className="font-[var(--font-fraunces)] text-[clamp(1.8rem,4vw,2.8rem)] font-black tracking-[-0.02em] leading-[1.1]">
                {sp.name}
              </h1>
            </div>
            {sp.is_available ? (
              <span className="px-3 py-0.5 rounded-full text-[.65rem] font-bold bg-[rgba(34,197,94,.12)] text-[#86efac] border border-[rgba(34,197,94,.3)]">
                Available Now
              </span>
            ) : (
              <span className="px-3 py-0.5 rounded-full text-[.65rem] font-bold bg-[rgba(239,68,68,.12)] text-[#fca5a5] border border-[rgba(239,68,68,.3)]">
                Currently Occupied
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <section className="px-[clamp(20px,6vw,72px)] py-12">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* ── LEFT column ─────────────────────────────────────────────── */}
          <div>
            <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-2">
              {eyebrow}
            </div>
            <h2 className="font-[var(--font-fraunces)] text-[1.75rem] font-black mb-4 leading-[1.2]">
              {sp.name}
            </h2>

            <p className="text-[.9rem] text-[var(--muted)] leading-[1.75] mb-6">
              {sp.description ??
                "A professional space designed for productivity, collaboration, and creativity. Fully equipped and available to book by the hour or for the full day."}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {pills.map((pill) => (
                <span
                  key={pill}
                  className="px-3 py-1 rounded-full bg-[rgba(193,68,14,.1)] border border-[rgba(193,68,14,.2)] text-[var(--teal2)] text-[.7rem] font-semibold"
                >
                  {pill}
                </span>
              ))}
            </div>

            {/* What's included */}
            <div className="mb-8">
              <h3 className="text-[.95rem] font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-check-circle text-[var(--teal2)] text-[.9rem]" aria-hidden="true" />
                What&apos;s included
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 list-none m-0 p-0">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[.85rem]">
                    <i className="fas fa-check text-[var(--teal2)] text-[.7rem] mt-[3px] shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Availability schedule */}
            <SpaceScheduleClient space={sp} />

            {/* Photo gallery */}
            <div>
              <h3 className="text-[.95rem] font-bold mb-4">Gallery</h3>
              <div className="grid grid-cols-2 gap-3">
                {galleryImages.slice(0, 4).map((src, i) => (
                  <div
                    key={i}
                    className="relative h-[180px] rounded-lg overflow-hidden border border-[var(--border)]"
                  >
                    <Image
                      src={src}
                      alt={`${sp.name} photo ${i + 2}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT column — booking card ──────────────────────────────── */}
          <div className="sticky top-[90px]">
            <div className="bg-[var(--dark2)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,.4)]">

              {/* Card header */}
              <div className="p-6 border-b border-[var(--border)]">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    {sp.hourly_rate > 0 ? (
                      <p className="text-[1.4rem] font-extrabold leading-none m-0">
                        KES {sp.hourly_rate.toLocaleString()}
                        <span className="text-[.8rem] font-normal text-[var(--muted)] ml-1">
                          / hour
                        </span>
                      </p>
                    ) : (
                      <p className="text-base font-bold text-[var(--muted)] m-0">
                        Enquire for pricing
                      </p>
                    )}
                  </div>
                  {sp.is_available ? (
                    <span className="px-3 py-0.5 rounded-full text-[.65rem] font-bold bg-[rgba(34,197,94,.12)] text-[#86efac] border border-[rgba(34,197,94,.3)] shrink-0">
                      Available
                    </span>
                  ) : (
                    <span className="px-3 py-0.5 rounded-full text-[.65rem] font-bold bg-[rgba(239,68,68,.12)] text-[#fca5a5] border border-[rgba(239,68,68,.3)] shrink-0">
                      Occupied
                    </span>
                  )}
                </div>
                <p className="text-[var(--muted)] text-[.75rem] mt-2 m-0">
                  Book instantly via WhatsApp — confirmation within minutes.
                </p>
              </div>

              {/* Booking form */}
              <div className="p-6">
                <BookingForm space={sp} />
              </div>

              {/* Footer note */}
              <div className="px-6 pb-5 flex items-center gap-2">
                <i className="fas fa-shield-alt text-[var(--teal2)] text-[.75rem]" aria-hidden="true" />
                <p className="text-[.72rem] text-[var(--muted)] m-0">
                  Confirmation within minutes · No deposit required
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
