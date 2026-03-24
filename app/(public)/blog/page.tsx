import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Ontime Academy & Co-working Space",
  description: "Insights, tips, and stories from Ontime Academy & Co-working Space.",
};

export default function BlogPage() {
  return (
    <main className="bg-[var(--dark)] text-[var(--white)]">

      {/* Hero */}
      <section className="bg-[#1e1e1e] border-b border-[rgba(255,255,255,.06)] px-[clamp(20px,6vw,72px)] pt-[120px] pb-20">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-3.5">
            Stories &amp; Insights
          </div>
          <h1 className="font-[var(--font-fraunces)] text-[clamp(2.2rem,5vw,3.8rem)] font-black tracking-[-0.03em] leading-[1.1] mb-5">
            The Ontime Blog
          </h1>
          <p className="text-[rgba(244,250,250,.65)] text-[1.05rem] leading-[1.8] max-w-[480px] mx-auto">
            Tips, stories, and insights from our community of creators, entrepreneurs, and professionals.
          </p>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="px-[clamp(20px,6vw,72px)] py-24">
        <div className="max-w-[520px] mx-auto text-center">

          <div className="w-[72px] h-[72px] rounded-[18px] bg-[rgba(193,68,14,.08)] border border-[rgba(193,68,14,.2)] flex items-center justify-center mx-auto mb-7 text-[var(--teal2)] text-[1.6rem]">
            <i className="fas fa-pen-nib" aria-hidden="true" />
          </div>

          <div className="inline-block bg-[rgba(193,68,14,.08)] border border-[rgba(193,68,14,.18)] rounded-full px-4 py-1 text-[.68rem] font-bold tracking-[.15em] uppercase text-[var(--teal2)] mb-5">
            Coming Soon
          </div>

          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold mb-4 leading-[1.2]">
            We&apos;re writing something great
          </h2>

          <p className="text-[rgba(244,250,250,.65)] text-[1rem] leading-[1.8] mb-9">
            We&apos;re working on articles, case studies, and behind-the-scenes stories from the Ontime community. Check back soon!
          </p>

          <div className="w-12 h-0.5 mx-auto mb-9 rounded-sm gradient-brand-h" />

          <a
            href="https://wa.me/254746628668"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white text-[.82rem] font-bold px-7 py-3 rounded-md transition-opacity duration-200 hover:opacity-90 gradient-brand"
          >
            <i className="fab fa-whatsapp" aria-hidden="true" />
            Stay Connected on WhatsApp
          </a>

        </div>
      </section>

    </main>
  );
}
