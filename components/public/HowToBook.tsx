const steps = [
  {
    num: "1",
    title: "Choose your space",
    desc: "Boardroom, Conference Room, Podcast Studio, or Content Studio — all in the heart of Nairobi.",
  },
  {
    num: "2",
    title: "Select date & time",
    desc: "Pick your preferred date, start time, and how many hours you need.",
  },
  {
    num: "3",
    title: "Send a WhatsApp",
    desc: "Use our booking form to open WhatsApp with everything pre-filled. We confirm instantly.",
  },
  {
    num: "4",
    title: "Walk in ready",
    desc: "Show up and your space is fully set up and waiting for you.",
  },
];

export default function HowToBook() {
  return (
    <section className="bg-white py-20 px-6 lg:px-16 xl:px-24">

      {/* Heading */}
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <span className="eyebrow mb-3 block">How to Book</span>
        <h2 className="text-[clamp(1.8rem,3.5vw,2.7rem)] font-bold text-dark mb-4">Book in 4 easy steps.</h2>
        <p className="text-base leading-relaxed text-muted max-w-[520px] mx-auto">
          No complicated forms. Fill in your details, hit send — your booking goes straight to WhatsApp.
        </p>
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full relative">
        {/* Dashed connector line — desktop only */}
        <div className="absolute top-7 left-[14%] right-[14%] h-[1px] border-t-2 border-dashed border-border z-0 max-md:hidden" />

        {steps.map((step) => (
          <div key={step.num} className="text-center px-4 relative z-10">
            <div
              className="w-14 h-14 bg-teal-primary rounded-full flex items-center justify-center mx-auto mb-5
                          text-white text-base font-bold shadow-[0_4px_14px_rgba(13,115,119,0.3)]"
            >
              {step.num}
            </div>
            <h4 className="text-base font-bold text-dark mb-2.5">{step.title}</h4>
            <p className="text-base leading-relaxed text-muted">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-14">
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-2"
        >
          <i className="fab fa-whatsapp" />
          Book Now on WhatsApp
        </a>
      </div>
    </section>
  );
}
