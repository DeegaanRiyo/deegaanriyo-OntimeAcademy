import Link from "next/link";

export default function MembershipTeaser() {
  return (
    <section className="bg-gray-50 py-20 px-6 lg:px-16 xl:px-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full items-center">

        {/* Copy */}
        <div>
          <span className="eyebrow mb-3 block">Co-working Membership</span>
          <h2 className="text-[clamp(1.8rem,3.5vw,2.7rem)] font-bold leading-[1.15] text-dark mb-4">
            Your desk.<br />Your community.<br />
            <span className="text-teal-primary">Your city.</span>
          </h2>
          <p className="text-base leading-relaxed text-muted mb-5">
            Join Nairobi&apos;s growing community of freelancers, creatives, and
            entrepreneurs at <strong className="text-dark font-semibold">Ontime Academy & Co-working Space</strong>.
            Get a dedicated desk, lightning-fast internet, and a public profile to
            showcase your work to potential clients.
          </p>

          {/* Price callout */}
          <div className="flex items-baseline gap-2 mb-6 p-5 bg-white rounded-lg border border-border w-fit">
            <span className="text-[2.2rem] font-extrabold text-teal-primary">KES 7,500</span>
            <span className="text-muted text-base">/month</span>
            <span className="text-sm text-muted ml-1">· 30-day rolling</span>
          </div>

          <ul className="list-none flex flex-col gap-3 mb-7">
            {[
              "Dedicated desk access, Monday to Saturday",
              "High-speed fibre internet throughout",
              "Access to all common areas and lounges",
              "Public profile on the member directory",
              "Priority booking on all studio spaces",
              "Community events and networking sessions",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-base text-dark">
                <i className="fas fa-check-circle text-teal-primary text-base w-[18px] shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex gap-3 flex-wrap">
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                "Hi, I'd like to enquire about co-working membership at Ontime Academy & Co-working Space."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              <i className="fab fa-whatsapp" />
              Enquire via WhatsApp
            </a>
            <Link href="/members" className="btn-outline inline-flex items-center gap-2">
              Meet our members
            </Link>
          </div>
        </div>

        {/* Image */}
        <div className="relative">
          <div className="absolute -bottom-3 -right-3 w-14 h-1 bg-teal-primary" />
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80"
            alt="Ontime Academy & Co-working Space Nairobi"
            className="w-full aspect-video object-cover rounded-lg block"
          />
          {/* Member count badge */}
          <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-wash rounded-full flex items-center justify-center shrink-0">
              <i className="fas fa-users text-teal-primary text-sm" />
            </div>
            <div>
              <p className="text-base font-bold text-dark leading-none">500+ Members</p>
              <p className="text-xs text-muted mt-0.5">and growing</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
