import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "Courses — Ontime Academy",
  description: "Browse all online courses from Ontime Academy. Practical, career-relevant courses taught by Nairobi's top professionals.",
};

export const revalidate = 60;

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  mode: string;
  lesson_count: number;
  teacher_name: string;
};

async function getPublishedCourses(): Promise<CourseRow[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, description, price, thumbnail_url, mode, teacher_id")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (!courses || courses.length === 0) return [];

  const { data: lessonCounts } = await supabase
    .from("lessons")
    .select("course_id")
    .in("course_id", courses.map((c: any) => c.id));

  const countMap: Record<string, number> = {};
  (lessonCounts ?? []).forEach((l: any) => {
    countMap[l.course_id] = (countMap[l.course_id] ?? 0) + 1;
  });

  const teacherIds = Array.from(new Set(courses.map((c: any) => c.teacher_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", teacherIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p: any) => [p.id, p.full_name || p.email || "Instructor"])
  );

  return courses.map((c: any) => ({
    id:            c.id,
    slug:          c.slug,
    title:         c.title,
    description:   c.description,
    price:         c.price,
    thumbnail_url: c.thumbnail_url,
    mode:          c.mode,
    lesson_count:  countMap[c.id] ?? 0,
    teacher_name:  profileMap[c.teacher_id] ?? "Instructor",
  }));
}

function modeLabel(mode: string) {
  return { online: "Online", physical: "In-Person", hybrid: "Hybrid" }[mode] ?? mode;
}

function modeCls(mode: string) {
  return { online: "cb on", physical: "cb pp", hybrid: "cb gr" }[mode] ?? "cb gr";
}

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pub-hero bg-[var(--dark2)] px-[clamp(24px,6vw,72px)] pt-[140px] pb-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="sec-tag">Ontime Academy</div>
          <h1 className="sec-h max-w-[640px] mb-5">
            Learn from <em>Nairobi&apos;s best.</em>
          </h1>
          <p className="sec-p max-w-[520px]">
            Practical, career-relevant courses from professionals who live and work in the real
            Nairobi market. Self-paced. Pay once. Learn forever. Launching soon.
          </p>
        </div>
      </section>

      {/* ── Course grid ──────────────────────────────────────────── */}
      <section className="courses-grid-section bg-[var(--dark2)] px-[clamp(24px,6vw,72px)] pb-20">
        <div className="max-w-[1280px] mx-auto">

          {courses.length === 0 ? (
            <div className="py-16 flex flex-col items-center">

              {/* Icon */}
              <div className="w-20 h-20 rounded-full bg-[rgba(193,68,14,.08)] border border-[rgba(193,68,14,.18)] flex items-center justify-center mb-7 text-[2rem] text-[var(--teal2)]">
                <i className="fas fa-graduation-cap" />
              </div>

              {/* Headline */}
              <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-3">
                Coming Soon
              </div>
              <h2 className="font-[var(--font-fraunces)] text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-[var(--dark)] text-center leading-[1.2] mb-4 max-w-[500px]">
                We&apos;re building something great
              </h2>
              <p className="text-[var(--muted)] text-[.95rem] leading-[1.75] text-center max-w-[460px] mb-8">
                Our instructors are developing practical, career-relevant courses for the Nairobi market.
                First courses launch soon — follow us on WhatsApp to be the first to know.
              </p>

              {/* Notify CTA */}
              <a
                href={`https://wa.me/254746628668?text=${encodeURIComponent("Hi, I'd like to be notified when Ontime Academy courses launch.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-[.9rem] no-underline mb-10"
                style={{ background: "#25D366" }}
              >
                <i className="fab fa-whatsapp text-[1.1rem]" />
                Notify me on WhatsApp
              </a>

              {/* Upcoming categories */}
              <p className="text-[.62rem] font-bold uppercase tracking-[.14em] text-[var(--muted)] mb-4">
                Topics we&apos;re working on
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-[520px]">
                {[
                  "Digital Marketing",
                  "Business Finance",
                  "Graphic Design",
                  "Content Creation",
                  "Public Speaking",
                  "Entrepreneurship",
                  "Social Media",
                  "Photography",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full border border-[var(--border)] text-[var(--muted)] text-[.72rem] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

            </div>
          ) : (
            <>
              <p className="text-[.72rem] text-[var(--muted)] mb-8 tracking-[.1em] uppercase">
                {courses.length} course{courses.length !== 1 ? "s" : ""} available
              </p>

              <div className="courses-grid-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug ?? course.id}`}
                    className="crs flex flex-col no-underline text-inherit"
                  >
                    <div className="crs-top-bar" />

                    {/* Thumbnail */}
                    {course.thumbnail_url && (
                      <div className="crs-thumb relative h-[170px] overflow-hidden rounded-t-[4px]">
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    )}

                    {/* Icon (shown when no thumbnail) */}
                    {!course.thumbnail_url && (
                      <div className="crs-icon">
                        <i className="fas fa-graduation-cap" />
                      </div>
                    )}

                    <div className="crs-type">{course.teacher_name}</div>
                    <h3 className="crs-h">{course.title}</h3>
                    {course.description && (
                      <p className="crs-p line-clamp-2">{course.description}</p>
                    )}

                    <div className="crs-meta">
                      <span className="cm">
                        <i className="fas fa-play-circle" />
                        {course.lesson_count} lesson{course.lesson_count !== 1 ? "s" : ""}
                      </span>
                      <span className="cm">
                        <i className="fas fa-signal" />
                        {modeLabel(course.mode)}
                      </span>
                    </div>

                    <div className="crs-foot mt-auto">
                      <div className="cbadges">
                        <span className={modeCls(course.mode)}>{modeLabel(course.mode)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-[var(--font-fraunces)] text-[1.1rem] font-bold text-[var(--teal)]">
                          {course.price === 0 ? "Free" : `KES ${course.price.toLocaleString()}`}
                        </span>
                        <span className="crs-enroll">
                          Enroll <i className="fas fa-arrow-right" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="pub-cta bg-[var(--teal)] px-[clamp(24px,6vw,72px)] py-20 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-[var(--font-fraunces)] text-[clamp(1.4rem,3vw,2rem)] font-extrabold mb-3.5 text-white">
            Are you a professional? Teach with us.
          </h2>
          <p className="text-[rgba(244,250,250,.8)] text-[1.05rem] leading-[1.7] mb-7">
            Share your expertise with Nairobi&apos;s next generation. We handle the platform — you just teach.
          </p>
          <a
            href={`https://wa.me/254746628668?text=${encodeURIComponent("Hi, I'm interested in becoming an instructor at Ontime Academy.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="nbtn inline-flex mx-auto"
          >
            <i className="fab fa-whatsapp" /><span>Become an Instructor</span>
          </a>
        </div>
      </section>
    </>
  );
}
