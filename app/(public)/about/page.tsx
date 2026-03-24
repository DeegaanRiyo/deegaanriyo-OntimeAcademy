import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Ontime Academy & Co-working Space",
  description: "Learn about Ontime Academy & Co-working Space — Nairobi's smartest workspace for learning, creating, and collaborating.",
};

const statCards = [
  { icon: "fa-graduation-cap", label: "Ontime Academy",   value: "Online Courses"      },
  { icon: "fa-building",       label: "Co-working Space", value: "Physical Workspace"  },
  { icon: "fa-users",          label: "Community",        value: "500+ Members"        },
  { icon: "fa-map-marker-alt", label: "Location",         value: "Nairobi, Kenya"      },
];

const values = [
  {
    icon: "fa-lightbulb",
    title: "Practical Learning",
    desc: "Every course on Ontime Academy is built around real-world application — not theory. Our instructors are practitioners, not just educators.",
  },
  {
    icon: "fa-handshake",
    title: "Community First",
    desc: "We're more than a space. Our members network, collaborate, and grow together. Joining Ontime means joining Nairobi's most connected professional community.",
  },
  {
    icon: "fa-bolt",
    title: "Always On",
    desc: "Whether you're booking a studio for a shoot or enrolling in a new course, Ontime is built to move fast. Confirmations within minutes, not days.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[var(--dark)] text-[var(--white)]">

      {/* Hero */}
      <section className="bg-[#1e1e1e] border-b border-[rgba(255,255,255,.06)] px-[clamp(20px,6vw,72px)] pt-[120px] pb-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-3.5">
            Our Story
          </div>
          <h1 className="font-[var(--font-fraunces)] text-[clamp(2.2rem,5vw,3.8rem)] font-black tracking-[-0.03em] leading-[1.1] mb-5">
            Built for Nairobi&apos;s<br />Creators &amp; Professionals
          </h1>
          <p className="text-[rgba(244,250,250,.65)] text-[1.05rem] leading-[1.8] max-w-[560px]">
            Ontime Academy &amp; Co-working Space was founded with a single mission — give Nairobi&apos;s
            professionals, creators, and entrepreneurs the tools and space they need to do their best work.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-[clamp(20px,6vw,72px)] py-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-16 items-center">
          <div>
            <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-3">
              Our Mission
            </div>
            <h2 className="font-[var(--font-fraunces)] text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold leading-[1.2] mb-5">
              Two wings. One community.
            </h2>
            <p className="text-[rgba(244,250,250,.65)] text-[1rem] leading-[1.8] mb-4">
              <strong className="text-[var(--white)]">Ontime Academy</strong> is our online learning platform where
              Nairobi&apos;s top professionals teach practical, career-relevant courses — from digital marketing
              and business skills to creative and technical disciplines.
            </p>
            <p className="text-[rgba(244,250,250,.65)] text-[1rem] leading-[1.8] mb-4">
              <strong className="text-[var(--white)]">Ontime Co-working Space</strong> is our physical hub in
              Nairobi — a boardroom, conference hall, podcast studio, and content studio available for
              hourly and daily bookings. A space where things get done.
            </p>
            <p className="text-[rgba(244,250,250,.65)] text-[1rem] leading-[1.8]">
              Together, they form a complete ecosystem for modern professionals who learn online and
              execute offline.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((item) => (
              <div
                key={item.label}
                className="bg-[#2a2a2a] border border-[rgba(255,255,255,.08)] rounded-xl p-5"
              >
                <div className="w-9 h-9 rounded-lg bg-[rgba(193,68,14,.1)] border border-[rgba(193,68,14,.2)] flex items-center justify-center text-[var(--teal2)] text-[.8rem] mb-3">
                  <i className={`fas ${item.icon}`} aria-hidden="true" />
                </div>
                <p className="text-[.65rem] text-[var(--muted)] uppercase tracking-[.1em] font-bold mb-1">
                  {item.label}
                </p>
                <p className="text-[var(--white)] font-bold text-[.95rem]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#1e1e1e] border-y border-[rgba(255,255,255,.06)] px-[clamp(20px,6vw,72px)] py-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-3">
            <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-3">
              Our Values
            </div>
            <h2 className="font-[var(--font-fraunces)] text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold leading-[1.2] mb-12">
              What we stand for
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-[#2a2a2a] border border-[rgba(255,255,255,.06)] rounded-xl p-7"
              >
                <div className="w-11 h-11 rounded-[10px] bg-[rgba(193,68,14,.1)] border border-[rgba(193,68,14,.2)] flex items-center justify-center text-[var(--teal2)] text-[.9rem] mb-4">
                  <i className={`fas ${v.icon}`} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[1.05rem] mb-3">{v.title}</h3>
                <p className="text-[rgba(244,250,250,.55)] text-[.88rem] leading-[1.7]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#111] border-t border-[rgba(255,255,255,.06)] px-[clamp(20px,6vw,72px)] py-20 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-[var(--font-fraunces)] text-[clamp(1.6rem,3vw,2.2rem)] font-black mb-4">
            Ready to join the community?
          </h2>
          <p className="text-[rgba(244,250,250,.65)] text-[1.05rem] leading-[1.7] mb-8">
            Book a space today or explore our Academy courses.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white text-[.82rem] font-bold px-7 py-3 rounded-md transition-opacity duration-200 hover:opacity-90 gradient-brand"
            >
              <i className="fab fa-whatsapp" aria-hidden="true" /> Book a Space
            </a>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 border border-[rgba(193,68,14,.4)] text-[var(--teal2)] px-7 py-3 rounded-md text-[.82rem] font-bold hover:bg-[rgba(193,68,14,.06)] transition-colors duration-300"
            >
              <i className="fas fa-graduation-cap" aria-hidden="true" /> Explore Academy
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
