"use client";

import Link from "next/link";
import { useState } from "react";
import type { Space } from "@/types";

const durations = [
  { label: "1 hr",     hrs: 1 },
  { label: "2 hrs",    hrs: 2 },
  { label: "3 hrs",    hrs: 3 },
  { label: "4 hrs",    hrs: 4 },
  { label: "Half Day", hrs: 5 },
  { label: "Full Day", hrs: 9 },
];

type Props = { spaces: Space[] };

export default function HeroSection({ spaces }: Props) {
  const [selectedSpace, setSelectedSpace] = useState(spaces[0]);
  const [selectedDur,   setSelectedDur]   = useState(durations[0]);

  const hasPricing = selectedSpace.hourly_rate > 0;
  const total      = hasPricing ? selectedSpace.hourly_rate * selectedDur.hrs : null;

  const waMessage = encodeURIComponent(
    total
      ? `Hi, I'd like to book the ${selectedSpace.name} for ${selectedDur.label} at Ontime Academy & Co-working Space. Estimated cost: KES ${total.toLocaleString()}`
      : `Hi, I'd like to enquire about booking the ${selectedSpace.name} at Ontime Academy & Co-working Space.`
  );

  return (
    <section className="min-h-screen bg-gray-50 flex items-center pt-[108px] pb-16 px-6 lg:px-16 xl:px-24 max-md:pt-[90px]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full items-center">

        {/* ── Left — Copy ── */}
        <div>
          <span className="eyebrow mb-5 block">Nairobi&apos;s Smartest Workspace</span>

          <h1 className="text-[clamp(2.4rem,4.5vw,3.8rem)] font-extrabold leading-[1.08] text-dark mb-5 max-md:text-[clamp(2rem,7vw,3.5rem)]">
            Learn. Create.<br />
            <span className="text-teal-primary">Collaborate.</span>
          </h1>

          <p className="text-lg text-muted leading-loose mb-4 font-normal max-w-[500px]">
            <strong className="text-dark font-semibold">Ontime Academy</strong> brings you
            online courses from Nairobi&apos;s best professionals — while{" "}
            <strong className="text-dark font-semibold">Ontime Co-working Space</strong>{" "}
            gives you the physical workspace, studios, and community to get your best work done.
          </p>

          <div className="flex gap-3 flex-wrap mb-7">
            <div className="flex items-center gap-2 bg-teal-wash border border-teal-primary/20 rounded-full px-4 py-2">
              <i className="fas fa-graduation-cap text-teal-primary text-sm" />
              <span className="text-teal-primary text-sm font-semibold">Ontime Academy</span>
            </div>
            <div className="flex items-center gap-2 bg-teal-wash border border-teal-primary/20 rounded-full px-4 py-2">
              <i className="fas fa-building text-teal-primary text-sm" />
              <span className="text-teal-primary text-sm font-semibold">Co-working Space</span>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap mb-7 max-md:flex-col max-md:items-stretch">
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center gap-2"
            >
              <i className="fab fa-whatsapp" />
              Book a Space
            </a>
            <Link href="/courses" className="btn-outline flex items-center justify-center gap-2">
              <i className="fas fa-graduation-cap" />
              Explore Courses
            </Link>
          </div>

          <p className="text-sm text-muted flex items-center gap-2 flex-wrap">
            <span className="w-1.5 h-1.5 bg-teal-primary rounded-full inline-block" />
            500+ members
            <span className="w-1.5 h-1.5 bg-teal-primary rounded-full inline-block" />
            Est. 2020
            <span className="w-1.5 h-1.5 bg-teal-primary rounded-full inline-block" />
            Nairobi, Kenya
          </p>
        </div>

        {/* ── Right — Quick Booking Card ── */}
        <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.10)] p-8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 bg-teal-wash rounded-md flex items-center justify-center">
              <i className="fas fa-calendar-check text-teal-primary text-sm" />
            </div>
            <h3 className="text-[1.1rem] font-bold text-dark">Quick Book a Space</h3>
          </div>
          <p className="text-base text-muted mb-5 ml-[42px]">
            Select a space and duration to see your price instantly.
          </p>

          {/* Space selector */}
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2.5 block">
            Select Space
          </span>
          <div className="flex flex-col gap-2 mb-5">
            {spaces.map((sp) => (
              <button
                key={sp.id}
                onClick={() => setSelectedSpace(sp)}
                className={`px-4 py-3 border rounded-md flex justify-between items-center transition-all duration-200 text-left cursor-pointer
                  ${selectedSpace.id === sp.id
                    ? "border-teal-primary bg-teal-wash"
                    : "border-border bg-white hover:border-teal-primary hover:bg-teal-wash"
                  }`}
              >
                <span className="text-base font-semibold text-dark">{sp.name}</span>
                <span className="text-sm font-semibold text-teal-primary">
                  {sp.hourly_rate > 0 ? `KES ${sp.hourly_rate.toLocaleString()}/hr` : "Enquire"}
                </span>
              </button>
            ))}
          </div>

          {/* Duration selector */}
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2.5 block">
            Select Duration
          </span>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {durations.map((d) => (
              <button
                key={d.hrs}
                onClick={() => setSelectedDur(d)}
                className={`py-2.5 px-2.5 border rounded-md text-center text-sm font-semibold transition-all duration-200 cursor-pointer
                  ${selectedDur.hrs === d.hrs
                    ? "border-teal-primary bg-teal-wash text-teal-primary"
                    : "border-border bg-white text-muted hover:border-teal-primary hover:text-teal-primary"
                  }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Price display */}
          <div className="bg-gray-50 rounded-lg px-5 py-4 mb-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted">Estimated Total</p>
              <p className="text-xs text-muted mt-0.5">
                {selectedDur.label} &middot; {selectedSpace.name}
              </p>
            </div>
            {total !== null ? (
              <span className="text-[1.7rem] font-extrabold text-teal-primary">
                KES {total.toLocaleString()}
              </span>
            ) : (
              <span className="text-base font-semibold text-muted italic">Enquire for rate</span>
            )}
          </div>

          {/* WhatsApp CTA */}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-teal-primary text-white text-base font-bold
                       py-4 rounded-md hover:bg-teal-light transition-colors duration-200"
          >
            <i className="fab fa-whatsapp text-lg" />
            {total !== null ? `Book via WhatsApp — KES ${total.toLocaleString()}` : "Enquire via WhatsApp"}
          </a>

          <p className="text-center text-xs text-muted mt-3">
            Confirmation within minutes &middot; No deposit required
          </p>
        </div>
      </div>
    </section>
  );
}
