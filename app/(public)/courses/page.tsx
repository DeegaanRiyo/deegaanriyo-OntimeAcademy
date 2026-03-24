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
            Practical, career-relevant courses taught by professionals who&apos;ve done it
            in the real Nairobi market. Self-paced. Pay once. Learn forever.
          </p>
        </div>
      </section>

      {/* ── Course grid ──────────────────────────────────────────── */}
      <section className="courses-grid-section bg-[var(--dark2)] px-[clamp(24px,6vw,72px)] pb-20">
        <div className="max-w-[1280px] mx-auto">

          {courses.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="font-[var(--font-fraunces)] text-[1.5rem] mb-2.5 text-[var(--dark)]">
                Courses coming soon
              </h2>
              <p className="sec-p">Our instructors are busy building amazing content. Check back soon!</p>
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
