import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Ontime Academy & Co-working Space",
  description: "Get in touch with Ontime Academy & Co-working Space. Book a space, ask about courses, or enquire about membership.",
};

const socials = [
  { icon: "fab fa-instagram", href: "#", label: "Instagram" },
  { icon: "fab fa-twitter",   href: "#", label: "Twitter"   },
  { icon: "fab fa-linkedin",  href: "#", label: "LinkedIn"  },
  { icon: "fab fa-facebook",  href: "#", label: "Facebook"  },
];

export default function ContactPage() {
  return (
    <main className="bg-[var(--dark)] text-[var(--white)]">

      {/* Hero */}
      <section className="bg-[#1e1e1e] border-b border-[rgba(255,255,255,.06)] px-[clamp(20px,6vw,72px)] pt-[120px] pb-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-3.5">
            Get In Touch
          </div>
          <h1 className="font-[var(--font-fraunces)] text-[clamp(2.2rem,5vw,3.8rem)] font-black tracking-[-0.03em] leading-[1.1] mb-5">
            We&apos;d love to hear from you
          </h1>
          <p className="text-[rgba(244,250,250,.65)] text-[1.05rem] leading-[1.8] max-w-[560px]">
            Whether you want to book a space, ask about our courses, or join our community — reach out and we&apos;ll respond within minutes.
          </p>
        </div>
      </section>

      {/* Contact section */}
      <section className="px-[clamp(20px,6vw,72px)] py-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-12 items-start">

          {/* Left — contact methods */}
          <div>
            <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-bold mb-8 leading-[1.2]">
              Contact Us
            </h2>

            <div className="flex flex-col gap-4">

              {/* WhatsApp */}
              <div className="flex items-center gap-4 bg-[#222] border border-[rgba(255,255,255,.08)] rounded-xl p-5">
                <div className="w-11 h-11 rounded-[10px] bg-[rgba(193,68,14,.1)] border border-[rgba(193,68,14,.2)] flex items-center justify-center text-[var(--teal2)] text-[.9rem] shrink-0">
                  <i className="fab fa-whatsapp" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--muted)] mb-1">
                    WhatsApp (Fastest)
                  </p>
                  <p className="font-semibold text-[.95rem]">+254 746 628 668</p>
                </div>
                <a
                  href="https://wa.me/254746628668"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white text-[.78rem] font-bold px-5 py-2.5 rounded-md whitespace-nowrap transition-opacity duration-200 hover:opacity-90 gradient-brand"
                >
                  Chat Now
                </a>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 bg-[#222] border border-[rgba(255,255,255,.08)] rounded-xl p-5">
                <div className="w-11 h-11 rounded-[10px] bg-[rgba(193,68,14,.1)] border border-[rgba(193,68,14,.2)] flex items-center justify-center text-[var(--teal2)] text-[.9rem] shrink-0">
                  <i className="fas fa-envelope" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--muted)] mb-1">
                    Email
                  </p>
                  <p className="font-semibold text-[.95rem]">hello@ontimecws.com</p>
                </div>
                <a
                  href="mailto:hello@ontimecws.com"
                  className="inline-flex items-center gap-2 border border-[rgba(193,68,14,.4)] text-[var(--teal2)] text-[.78rem] font-bold px-5 py-2.5 rounded-md whitespace-nowrap hover:bg-[rgba(193,68,14,.06)] transition-colors duration-300"
                >
                  Send Email
                </a>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4 bg-[#222] border border-[rgba(255,255,255,.08)] rounded-xl p-5">
                <div className="w-11 h-11 rounded-[10px] bg-[rgba(193,68,14,.1)] border border-[rgba(193,68,14,.2)] flex items-center justify-center text-[var(--teal2)] text-[.9rem] shrink-0">
                  <i className="fas fa-map-marker-alt" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--muted)] mb-1">
                    Location
                  </p>
                  <p className="font-semibold text-[.95rem]">Nairobi, Kenya</p>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="mt-9">
              <p className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--muted)] mb-4">
                Follow Us
              </p>
              <div className="flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-[10px] bg-[var(--dark2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] text-[.85rem] hover:text-[var(--teal2)] hover:border-[rgba(193,68,14,.3)] transition-colors duration-300"
                  >
                    <i className={s.icon} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Quick action cards */}
          <div className="flex flex-col gap-5">

            {/* Book a Space */}
            <div className="bg-[rgba(193,68,14,.12)] border border-[rgba(193,68,14,.2)] rounded-xl p-7">
              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className="w-11 h-11 rounded-[10px] flex items-center justify-center text-white text-[.9rem] shrink-0 gradient-brand"
                >
                  <i className="fas fa-calendar-check" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[1.05rem] m-0">Book a Space</h3>
              </div>
              <p className="text-[rgba(244,250,250,.65)] text-[.9rem] leading-[1.75] mb-5.5">
                The fastest way to book is via WhatsApp. Send us your preferred space, date, and time — we&apos;ll confirm within minutes.
              </p>
              <a
                href={`https://wa.me/254746628668?text=${encodeURIComponent("Hi, I'd like to book a space at Ontime Academy & Co-working Space.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-white text-[.82rem] font-bold px-7 py-3 rounded-md w-full transition-opacity duration-200 hover:opacity-90 gradient-brand"
              >
                <i className="fab fa-whatsapp" aria-hidden="true" />
                Book via WhatsApp
              </a>
            </div>

            {/* Academy Enquiries */}
            <div className="bg-[#222] border border-[rgba(255,255,255,.08)] rounded-xl p-7">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-[10px] bg-[rgba(193,68,14,.1)] border border-[rgba(193,68,14,.2)] flex items-center justify-center text-[var(--teal2)] text-[.9rem] shrink-0">
                  <i className="fas fa-graduation-cap" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-[1.05rem] m-0">Academy Enquiries</h3>
              </div>
              <p className="text-[rgba(244,250,250,.65)] text-[.9rem] leading-[1.75] mb-5.5">
                Questions about courses, instructors, or enrolling? Send us a message and our team will guide you.
              </p>
              <a
                href={`https://wa.me/254746628668?text=${encodeURIComponent("Hi, I have an enquiry about Ontime Academy courses.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-[rgba(193,68,14,.4)] text-[var(--teal2)] text-[.82rem] font-bold px-7 py-3 rounded-md w-full hover:bg-[rgba(193,68,14,.06)] transition-colors duration-300"
              >
                <i className="fab fa-whatsapp" aria-hidden="true" />
                Enquire via WhatsApp
              </a>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
