import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Ontime Academy & Co-working Space",
  description: "Frequently asked questions about Ontime Academy courses and Co-working Space bookings.",
};

const faqs = [
  {
    category: "Co-working Space",
    items: [
      { q: "How do I book a space?", a: "Click 'Book a Space' on any page to send us a WhatsApp message. Our team confirms your booking within minutes. No deposit required for most bookings." },
      { q: "What spaces are available?", a: "We have four spaces: the Boardroom (executive meetings), Conference Room (up to 50 people), Podcast Studio (recording & live streams), and Content Studio (video shoots & photography)." },
      { q: "Can I book for a full day?", a: "Yes. We offer hourly, half-day, and full-day rates. Contact us via WhatsApp for full-day pricing on all spaces." },
      { q: "Is Wi-Fi available?", a: "Yes, all spaces include high-speed Wi-Fi. The Boardroom and Conference Room also have AV setups and air conditioning." },
      { q: "Where are you located?", a: "We're based in Nairobi, Kenya. Contact us via WhatsApp for the exact address and directions." },
    ],
  },
  {
    category: "Ontime Academy",
    items: [
      { q: "How do I enrol in a course?", a: "Browse our courses at /courses, create a free student account, and enrol directly. Some courses require payment — handled securely via M-Pesa." },
      { q: "Are courses self-paced?", a: "Yes. All Academy courses are pre-recorded and fully self-paced. Watch lessons on your schedule and take quizzes when you're ready." },
      { q: "What topics does the Academy cover?", a: "Our instructors teach digital marketing, business development, creative skills, photography, video production, and more — all tailored to the Nairobi market." },
      { q: "Do I get a certificate?", a: "Yes. Students who complete all lessons and pass the final quiz receive a completion certificate from Ontime Academy." },
    ],
  },
  {
    category: "Membership",
    items: [
      { q: "What is an Ontime Membership?", a: "Ontime Membership (KES 7,500/month) gives you access to the co-working community, member directory, exclusive events, and discounts on space bookings." },
      { q: "How do I become a member?", a: "Members are invited by our admin team. Contact us via WhatsApp or the contact page and we'll get you set up." },
      { q: "Can I list my business in the member directory?", a: "Yes. Members can create a public profile and list their business, skills, and contact details in our member directory." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="bg-[var(--dark)] text-[var(--white)]">

      {/* Hero */}
      <section className="bg-[#1e1e1e] border-b border-[rgba(255,255,255,.06)] px-[clamp(20px,6vw,72px)] pt-[120px] pb-20">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="text-[.65rem] font-bold tracking-[.2em] uppercase text-[var(--teal2)] mb-3.5">
            Help Centre
          </div>
          <h1 className="font-[var(--font-fraunces)] text-[clamp(2.2rem,5vw,3.8rem)] font-black tracking-[-0.03em] leading-[1.1] mb-5">
            Frequently Asked Questions
          </h1>
          <p className="text-[rgba(244,250,250,.65)] text-[1.05rem] leading-[1.7] max-w-[480px] mx-auto">
            Everything you need to know about our spaces, courses, and membership.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="px-[clamp(20px,6vw,72px)] py-20">
        <div className="max-w-[800px] mx-auto">
          {faqs.map((section, sIdx) => (
            <div key={section.category} className={sIdx < faqs.length - 1 ? "mb-14" : ""}>
              <h2 className="text-[1.1rem] font-bold mb-5 pb-3 border-b border-[var(--border)] flex items-center gap-2.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--teal2)] shrink-0" />
                {section.category}
              </h2>
              <div className="flex flex-col gap-3">
                {section.items.map((item) => (
                  <div
                    key={item.q}
                    className="bg-[#222] border border-[rgba(255,255,255,.07)] rounded-xl p-6"
                  >
                    <p className="font-semibold text-[.92rem] mb-2 border-l-[3px] border-[var(--teal2)] pl-3">
                      {item.q}
                    </p>
                    <p className="text-[rgba(244,250,250,.6)] text-[.85rem] leading-[1.7] pl-[15px]">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still have questions */}
      <section className="bg-[#1e1e1e] border-t border-[rgba(255,255,255,.06)] px-[clamp(20px,6vw,72px)] py-20 text-center">
        <div className="max-w-[500px] mx-auto">
          <h3 className="font-bold text-[1.2rem] mb-3">Still have questions?</h3>
          <p className="text-[rgba(244,250,250,.65)] text-[.9rem] leading-[1.7] mb-6">
            Reach out on WhatsApp and we&apos;ll get back to you within minutes.
          </p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white text-[.82rem] font-bold px-7 py-3 rounded-md transition-opacity duration-200 hover:opacity-90 gradient-brand"
          >
            <i className="fab fa-whatsapp" aria-hidden="true" /> Chat on WhatsApp
          </a>
        </div>
      </section>

    </div>
  );
}
