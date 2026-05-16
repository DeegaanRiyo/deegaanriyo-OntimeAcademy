import Link from "next/link";

export default function AboutSection() {
  return (
    <section className="bg-white py-20 px-6 lg:px-16 xl:px-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full items-center">

        {/* Image */}
        <div className="relative">
          <div className="absolute -top-3 -left-3 w-14 h-1 bg-teal-primary" />
          <img
            src="/ontimemedia/section2a.jpeg"
            alt="Ontime Academy & Co-working Space Nairobi"
            className="w-full aspect-video object-cover rounded-lg block"
          />
        </div>

        {/* Copy */}
        <div>
          <span className="eyebrow mb-3 block">Who We Are</span>
          <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold leading-[1.2] text-dark mb-4">
            Two wings.<br />One powerful platform.
          </h2>
          <p className="text-[.88rem] leading-relaxed text-muted mb-6">
            <strong className="text-dark font-semibold">Ontime Academy & Co-working Space</strong>{" "}
            is Nairobi&apos;s go-to destination for freelancers, creatives, and entrepreneurs.
            We combine a premium physical workspace with a fully-featured online academy —
            everything you need to grow your skills and your business, under one brand.
          </p>

          {/* Two-wing breakdown */}
          <div className="flex flex-col gap-4 mb-7">
            <div className="flex gap-3 p-5 bg-gray-50 rounded-lg border-l-[3px] border-teal-primary">
              <div className="w-10 h-10 bg-teal-wash rounded-md flex items-center justify-center shrink-0">
                <i className="fas fa-graduation-cap text-teal-primary text-sm" />
              </div>
              <div>
                <p className="text-[.88rem] font-bold text-dark mb-1">Ontime Academy</p>
                <p className="text-[.84rem] text-muted leading-relaxed">
                  Online courses, progress tracking, quizzes, and certificates — taught by Nairobi&apos;s top professionals.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-5 bg-gray-50 rounded-lg border-l-[3px] border-teal-primary">
              <div className="w-10 h-10 bg-teal-wash rounded-md flex items-center justify-center shrink-0">
                <i className="fas fa-building text-teal-primary text-sm" />
              </div>
              <div>
                <p className="text-[.88rem] font-bold text-dark mb-1">Ontime Co-working Space</p>
                <p className="text-[.84rem] text-muted leading-relaxed">
                  Monthly memberships, bookable meeting rooms, podcast studio, content studio — all in Nairobi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Link href="/about" className="btn-primary inline-flex items-center gap-2">
              Learn more about us
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-primary text-[.88rem] font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all duration-200"
            >
              Book a tour <i className="fas fa-arrow-right" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
