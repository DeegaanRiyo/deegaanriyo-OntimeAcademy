export default function CTASection() {
  return (
    <section className="bg-teal-primary py-20 px-6 lg:px-16 xl:px-24 text-center">

      {/* Label */}
      <span className="inline-block text-xs font-semibold uppercase tracking-[0.22em] text-white/60 mb-5">
        Ontime Academy & Co-working Space
      </span>

      <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-extrabold text-white mb-4 leading-[1.15] max-md:text-[clamp(1.8rem,6vw,3rem)]">
        Ready to build something great?
      </h2>
      <p className="text-base leading-relaxed text-white/80 max-w-[560px] mx-auto mb-10">
        Book a space, enrol in a course, or join as a co-working member.
        Ontime Academy & Co-working Space is here and ready when you are.
      </p>

      <div className="flex gap-3.5 justify-center flex-wrap mb-10 max-md:flex-col max-md:items-center max-md:gap-3">
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-teal-primary text-base font-bold px-8 py-4 rounded flex items-center gap-2
                     hover:bg-teal-wash hover:-translate-y-0.5 transition-all duration-200 max-md:w-full max-md:max-w-xs max-md:justify-center"
        >
          <i className="fab fa-whatsapp" />
          Chat on WhatsApp
        </a>
        <a
          href="/courses"
          className="border-2 border-white/45 text-white text-base font-semibold px-8 py-4 rounded flex items-center gap-2
                     hover:border-white hover:bg-white/10 transition-all duration-200 max-md:w-full max-md:max-w-xs max-md:justify-center"
        >
          <i className="fas fa-graduation-cap" />
          Explore the Academy
        </a>
      </div>

      <div className="flex justify-center gap-10 flex-wrap max-md:flex-col max-md:items-center max-md:gap-3.5">
        {[
          { icon: "fas fa-phone",          text: "0746 628 668" },
          { icon: "fas fa-map-marker-alt", text: "Nairobi, Kenya" },
          { icon: "fas fa-clock",          text: "Mon–Sat · 7AM–9PM" },
          { icon: "fas fa-envelope",       text: "info@ontimecws.com" },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-2 text-white/80 text-base">
            <i className={`${item.icon} text-white/90`} />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
