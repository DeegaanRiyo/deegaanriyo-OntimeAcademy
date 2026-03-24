import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import MpesaEnrolButton from "@/components/public/MpesaEnrolButton";

type LiveCourse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  mode: string;
  teacher_name: string;
  lesson_count: number;
};

type Props = { params: Promise<{ slug: string }> };

async function getCourse(slug: string): Promise<LiveCourse | null> {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, description, thumbnail_url, price, mode, teacher_id")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!course) return null;

  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", course.id);

  const { data: teacher } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", course.teacher_id)
    .single();

  return {
    ...course,
    lesson_count: lessonCount ?? 0,
    teacher_name: teacher?.full_name || teacher?.email || "Instructor",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Course Not Found" };
  return {
    title: `${course.title} — Ontime Academy`,
    description: course.description ?? undefined,
  };
}

function modeLabel(mode: string) {
  return { online: "Online", physical: "In-Person", hybrid: "Hybrid" }[mode] ?? mode;
}

const courseFeatures = [
  { icon: "fa-infinity",    text: "Lifetime access"          },
  { icon: "fa-mobile-alt",  text: "Watch on any device"      },
  { icon: "fa-certificate", text: "Certificate on completion" },
  { icon: "fa-comments",    text: "WhatsApp support"          },
];

const includesItems = (lessonCount: number) => [
  { icon: "fa-play-circle",  text: `${lessonCount} video lesson${lessonCount !== 1 ? "s" : ""}` },
  { icon: "fa-infinity",     text: "Lifetime access"                  },
  { icon: "fa-certificate",  text: "Completion certificate"           },
  { icon: "fa-mobile-alt",   text: "Watch on any device"              },
  { icon: "fa-comments",     text: "WhatsApp instructor support"      },
  { icon: "fa-download",     text: "Downloadable resources"           },
];

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const FALLBACK_THUMB = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80";
  const thumbnail = course.thumbnail_url || FALLBACK_THUMB;

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="pub-hero bg-[var(--dark)] border-b border-[var(--border)] px-[clamp(24px,6vw,72px)] pt-[120px] pb-[60px]">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">

          {/* Left — course info */}
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6">
              <Link href="/courses" className="text-[var(--muted)] text-[.78rem] hover:text-[var(--white)] transition-colors duration-200">
                ← All Courses
              </Link>
              <span className="text-[var(--border2)] text-[.78rem]">/</span>
              <span className="text-[var(--teal2)] text-[.78rem] font-semibold">
                {modeLabel(course.mode)}
              </span>
            </div>

            <h1 className="font-[var(--font-fraunces)] text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.1] mb-4 tracking-[-0.02em]">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-[rgba(244,250,250,.7)] text-[.95rem] leading-[1.75] mb-7 max-w-[560px]">
                {course.description}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-5 items-center">
              <span className="flex items-center gap-1.5 text-[.82rem] text-[rgba(244,250,250,.65)]">
                <i className="fas fa-user-circle text-[var(--teal2)]" aria-hidden="true" />
                {course.teacher_name}
              </span>
              <span className="flex items-center gap-1.5 text-[.82rem] text-[rgba(244,250,250,.65)]">
                <i className="fas fa-play-circle text-[var(--teal2)]" aria-hidden="true" />
                {course.lesson_count} lesson{course.lesson_count !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5 text-[.82rem] text-[rgba(244,250,250,.65)]">
                <i className="fas fa-signal text-[var(--teal2)]" aria-hidden="true" />
                {modeLabel(course.mode)}
              </span>
            </div>
          </div>

          {/* Right — enrol card */}
          <div className="bg-[var(--dark2)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,.4)] sticky top-[100px]">
            {/* Thumbnail */}
            <div className="relative h-[180px] overflow-hidden">
              <Image
                src={thumbnail}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 360px"
                priority
              />
            </div>

            <div className="p-6 pb-7">
              <div className="font-[var(--font-fraunces)] text-[1.6rem] font-bold text-[var(--teal2)] leading-none mb-1">
                {course.price === 0 ? "Free" : `KES ${course.price.toLocaleString()}`}
              </div>
              <p className="text-[var(--muted)] text-[.75rem] mb-5">
                One-time payment · Lifetime access
              </p>

              <MpesaEnrolButton
                courseId={course.id}
                price={course.price}
                courseTitle={course.title}
                courseSlug={course.slug}
              />

              {/* Features */}
              <div className="border-t border-[var(--border)] mt-5 pt-5 flex flex-col gap-2.5">
                {courseFeatures.map((f) => (
                  <div key={f.text} className="flex items-center gap-2.5 text-[.78rem] text-[var(--muted)]">
                    <i className={`fas ${f.icon} text-[var(--teal2)] w-4 text-center`} aria-hidden="true" />
                    {f.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Course details ────────────────────────────────────────── */}
      <section className="bg-[var(--dark2)] border-t border-[var(--border)] px-[clamp(24px,6vw,72px)] py-20">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">

          <div>
            {/* What's included */}
            <h2 className="font-[var(--font-fraunces)] text-[1.5rem] font-bold mb-6">
              What&apos;s included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-12">
              {includesItems(course.lesson_count).map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 text-[.82rem] text-[rgba(244,250,250,.7)]">
                  <i className={`fas ${item.icon} text-[var(--teal2)] text-[.75rem] w-4 text-center`} aria-hidden="true" />
                  {item.text}
                </div>
              ))}
            </div>

            {/* Instructor */}
            <h2 className="font-[var(--font-fraunces)] text-[1.5rem] font-bold mb-5">
              Your Instructor
            </h2>
            <div className="flex items-center gap-4 bg-[var(--dark)] border border-[var(--border)] rounded-xl px-6 py-5">
              <div
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 text-[1.2rem] font-bold text-white gradient-brand"
              >
                {course.teacher_name[0].toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-[.95rem]">{course.teacher_name}</div>
                <div className="text-[var(--teal2)] text-[.72rem] mt-0.5">Ontime Academy Instructor</div>
              </div>
            </div>
          </div>

          {/* Right — repeat enrol card */}
          <div className="bg-[var(--dark)] border border-[var(--border)] rounded-xl p-6 sticky top-[100px]">
            <div className="font-[var(--font-fraunces)] text-[1.6rem] font-bold text-[var(--teal2)] mb-4">
              {course.price === 0 ? "Free" : `KES ${course.price.toLocaleString()}`}
            </div>
            <MpesaEnrolButton
              courseId={course.id}
              price={course.price}
              courseTitle={course.title}
              courseSlug={course.slug}
            />
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="bg-[var(--teal)] px-[clamp(24px,6vw,72px)] py-[72px] text-center">
        <div className="max-w-[540px] mx-auto">
          <h2 className="font-[var(--font-fraunces)] text-[clamp(1.4rem,3vw,2rem)] font-extrabold mb-3">
            Ready to start learning?
          </h2>
          <p className="text-[rgba(244,250,250,.8)] text-[.9rem] mb-7">
            {course.price === 0
              ? "This course is free — enrol now and start immediately."
              : `KES ${course.price.toLocaleString()} · One-time · Lifetime access`}
          </p>
          <Link href={`/courses/${course.slug}#enrol`} className="nbtn inline-flex">
            <i className="fas fa-graduation-cap" aria-hidden="true" /><span>Enrol Now</span>
          </Link>
        </div>
      </section>
    </>
  );
}
