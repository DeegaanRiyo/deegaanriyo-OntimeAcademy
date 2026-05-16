import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Space } from "@/types";

export default async function SpacesPreview() {
  const supabase = await createClient();

  const { data: spaces, error } = await supabase
    .from("spaces")
    .select("id, name, slug, description, hourly_rate, is_available, photos")
    .order("created_at", { ascending: true });

  if (error || !spaces) return null;

  const pillsMap: Record<string, string[]> = {
    boardroom:        ["TV & Projector", "Video Conf.", "Wi-Fi", "Air-Con"],
    "conference-room":["Up to 50 people", "AV Setup", "Wi-Fi", "Air-Con"],
    "podcast-studio": ["Studio Mics", "Cameras", "Studio Lighting", "Sound Setup"],
    "content-studio": ["Green Screen", "Backdrops", "Ring Lights", "Cameras"],
  };

  const placeholderImages: Record<string, string> = {
    boardroom:         "/ontimemedia/boardroom.jpeg",
    "conference-room": "/ontimemedia/confrenceroom.jpeg",
    "podcast-studio":  "/ontimemedia/podcast.png",
    "content-studio":  "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=900&q=80",
  };

  return (
    <section className="bg-gray-50 py-20 px-6 lg:px-16 xl:px-24">

      {/* Heading */}
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <span className="eyebrow mb-3 block">Our Spaces</span>
        <h2 className="text-[clamp(1.8rem,3.5vw,2.7rem)] font-bold leading-[1.15] text-dark mb-4">
          Four spaces.<br />Endless possibilities.
        </h2>
        <div className="flex justify-center mt-4">
          <Link
            href="/spaces"
            className="text-teal-primary text-base font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all duration-200"
          >
            View all spaces <i className="fas fa-arrow-right" />
          </Link>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {spaces.map((sp: Space) => {
          const image = sp.photos?.[0] ?? placeholderImages[sp.slug] ?? "";
          const pills = pillsMap[sp.slug] ?? [];

          return (
            <div
              key={sp.id}
              className="bg-white rounded-[10px] overflow-hidden border border-border
                         relative transition-all duration-[400ms] hover:-translate-y-1.5
                         hover:shadow-[0_16px_44px_rgba(0,0,0,0.10)] group w-full"
            >
              {/* Left-border animation */}
              <div className="absolute top-0 left-0 w-[3px] h-0 bg-teal-primary transition-all duration-[400ms] group-hover:h-full" />

              {/* Image */}
              <div className="overflow-hidden">
                <img
                  src={image}
                  alt={sp.name}
                  className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-dark">{sp.name}</h3>
                  {sp.is_available ? (
                    <span className="badge-open">Open</span>
                  ) : (
                    <span className="badge-occupied">Occupied</span>
                  )}
                </div>

                <p className="text-base leading-relaxed text-muted mb-4 line-clamp-2">
                  {sp.description}
                </p>

                {/* Feature pills */}
                <div className="flex gap-2 flex-wrap mb-5">
                  {pills.map((pill) => (
                    <span
                      key={pill}
                      className="px-3 py-1 bg-teal-wash text-teal-primary text-sm font-semibold rounded-full"
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-[1.1rem] font-extrabold text-dark">
                    {sp.hourly_rate > 0 ? (
                      <>
                        KES {sp.hourly_rate.toLocaleString()}
                        <span className="text-sm font-normal text-muted"> /hr</span>
                      </>
                    ) : (
                      <span className="text-base font-semibold text-muted">
                        Enquire for pricing
                      </span>
                    )}
                  </span>
                  <Link
                    href={`/spaces/${sp.slug}`}
                    className="bg-teal-primary text-white text-sm font-bold px-5 py-2.5 rounded
                               flex items-center gap-1.5 hover:bg-teal-light transition-colors duration-200"
                  >
                    View &amp; Book
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
