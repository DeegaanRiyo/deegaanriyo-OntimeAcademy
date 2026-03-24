import Link from "next/link";

const courses = [
  {
    icon: "fas fa-chart-line",
    category: "Business",
    title: "Digital Marketing Masterclass",
    desc: "Master SEO, paid ads, social media strategy and analytics — designed for the Kenyan digital market.",
    tag: "Online",
  },
  {
    icon: "fas fa-video",
    category: "Content Creation",
    title: "Content Creation & Video Production",
    desc: "Script, shoot, edit and grow — a complete video production course for creators and brands.",
    tag: "Online",
  },
  {
    icon: "fas fa-coins",
    category: "Finance",
    title: "Financial Literacy & Investment",
    desc: "Build real wealth — savings, SACCOs, stocks, and Nairobi's property market explained clearly.",
    tag: "Online",
  },
  {
    icon: "fas fa-rocket",
    category: "Entrepreneurship",
    title: "Entrepreneurship Bootcamp",
    desc: "From idea to launch — validate your business model, build your team, and attract your first customers.",
    tag: "Online",
  },
];

export default function CoursesPreview() {
  return (
    <section className="bg-white py-20 px-6 lg:px-16 xl:px-24">

      {/* Heading */}
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <span className="eyebrow mb-3 block">Ontime Academy</span>
        <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold leading-[1.2] text-dark mb-4">
          Learn from the best.<br />Grow faster.
        </h2>
        <p className="text-[.88rem] leading-relaxed text-muted mb-4">
          Premium online courses delivered by Nairobi&apos;s top professionals.
          Enrol, learn at your pace, and track your progress — all in one dashboard.
        </p>
        <Link
          href="/courses"
          className="text-teal-primary text-[.88rem] font-semibold inline-flex items-center gap-1.5 hover:gap-2.5 transition-all duration-200"
        >
          Browse all courses <i className="fas fa-arrow-right" />
        </Link>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {courses.map((c) => (
          <div
            key={c.title}
            className="bg-white rounded-lg p-6 border border-border transition-all duration-[350ms]
                       relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] w-full"
          >
            {/* Top border animation */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-teal-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-[350ms] origin-left" />

            {/* Icon */}
            <div className="w-12 h-12 bg-teal-wash rounded-lg flex items-center justify-center mb-4 text-teal-primary text-[1.1rem]">
              <i className={c.icon} />
            </div>

            <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal-primary block mb-2">
              {c.category}
            </span>
            <h3 className="text-[.95rem] font-bold text-dark mb-2 leading-[1.35]">{c.title}</h3>
            <p className="text-[.84rem] leading-relaxed text-muted mb-5">{c.desc}</p>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="px-3 py-1 bg-gray-50 text-sm font-semibold text-muted rounded-full border border-border">
                {c.tag}
              </span>
              <Link
                href="/courses"
                className="text-teal-primary text-sm font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all duration-200"
              >
                Enrol now <i className="fas fa-arrow-right" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Academy CTA strip */}
      <div className="mt-10 bg-teal-wash border border-teal-primary/20 rounded-xl p-8 flex items-center justify-between flex-wrap gap-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-teal-primary rounded-lg flex items-center justify-center shrink-0">
            <i className="fas fa-graduation-cap text-white text-base" />
          </div>
          <div>
            <p className="text-[.88rem] font-bold text-dark">Ready to start learning?</p>
            <p className="text-[.84rem] text-muted">
              Create a free account and enrol in your first course today.
            </p>
          </div>
        </div>
        <Link href="/courses" className="btn-primary inline-flex items-center gap-2 shrink-0">
          <i className="fas fa-play-circle" />
          Browse the Academy
        </Link>
      </div>
    </section>
  );
}
