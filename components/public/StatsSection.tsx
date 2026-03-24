const stats = [
  { number: "500+", label: "Co-working Members" },
  { number: "4",    label: "Bookable Spaces" },
  { number: "20+",  label: "Academy Courses" },
  { number: "98%",  label: "Satisfaction Rate" },
];

export default function StatsSection() {
  return (
    <section className="bg-white py-16 px-6 lg:px-16 xl:px-24 border-b border-border">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 w-full">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`text-center py-6 px-4
              ${i < 3 ? "border-r border-border" : ""}
              ${i >= 2 ? "max-md:border-t max-md:border-border" : ""}
              ${i === 1 ? "max-md:border-r-0" : ""}
              ${i === 3 ? "max-md:border-r-0" : ""}
            `}
          >
            <span className="text-[2rem] font-extrabold text-teal-primary leading-none block max-md:text-[1.7rem]">
              {s.number}
            </span>
            <span className="text-sm font-medium text-muted mt-2 block">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
