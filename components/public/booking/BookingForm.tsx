"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Space } from "@/types";

// ─── Validation schema ──────────────────────────────────────────────────────

const bookingSchema = z.object({
  visitor_name:  z.string().min(2, "Name must be at least 2 characters"),
  visitor_email: z.string().email("Enter a valid email").or(z.literal("")).optional(),
  visitor_phone: z.string().min(9, "Enter a valid phone number"),
  booking_date:  z.string().min(1, "Select a date"),
  start_time:    z.string().min(1, "Select a start time"),
  hours:         z.coerce.number().min(1).max(9),
});

type BookingFields = z.infer<typeof bookingSchema>;

// ─── Time slots: 7:00 AM – 8:00 PM in 30-min increments ───────────────────

function generateTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let h = 7; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break;
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm   = h < 12 ? "AM" : "PM";
      const label  = `${hour12}:${m === 0 ? "00" : "30"} ${ampm}`;
      const value  = `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
      slots.push({ value, label });
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

const HOUR_OPTIONS = [
  { value: 1, label: "1 hr" },
  { value: 2, label: "2 hrs" },
  { value: 3, label: "3 hrs" },
  { value: 4, label: "4 hrs" },
  { value: 5, label: "5 hrs" },
  { value: 6, label: "6 hrs" },
  { value: 7, label: "7 hrs" },
  { value: 8, label: "8 hrs" },
  { value: 9, label: "Full Day" },
];

// ─── Today's date in YYYY-MM-DD format ────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Format time label from HH:MM value ───────────────────────────────────

function formatTimeLabel(value: string): string {
  const slot = TIME_SLOTS.find((s) => s.value === value);
  return slot ? slot.label : value;
}

// ─── Component ─────────────────────────────────────────────────────────────

interface BookingFormProps {
  space: Space;
}

export default function BookingForm({ space }: BookingFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFields>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      hours: 1,
      start_time: "08:00",
    },
  });

  const watchedHours = watch("hours");

  const estimatedCost =
    space.hourly_rate > 0
      ? space.hourly_rate * (watchedHours === 9 ? 8 : Number(watchedHours))
      : null;

  const onSubmit = async (data: BookingFields) => {
    setSubmitting(true);

    const hoursValue = Number(data.hours);
    const cost       = space.hourly_rate > 0
      ? space.hourly_rate * (hoursValue === 9 ? 8 : hoursValue)
      : 0;

    // 1. Save booking to Supabase via API route (fire-and-forget — WhatsApp opens regardless)
    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id:       space.id,
          visitor_name:   data.visitor_name,
          visitor_email:  data.visitor_email ?? null,
          visitor_phone:  data.visitor_phone,
          booking_date:   data.booking_date,
          start_time:     data.start_time,
          hours:          hoursValue,
          estimated_cost: cost,
        }),
      });
    } catch {
      // Non-blocking — WhatsApp link still opens
    }

    // 2. Build WhatsApp message
    const hourLabel =
      hoursValue === 9
        ? "Full Day"
        : `${hoursValue} ${hoursValue === 1 ? "hr" : "hrs"}`;

    const costText =
      space.hourly_rate > 0
        ? `KES ${cost.toLocaleString()}`
        : "Rate on enquiry";

    const message = [
      `Hi, I'd like to book the *${space.name}* at Ontime Academy.`,
      ``,
      `*Name:* ${data.visitor_name}`,
      `*Phone:* ${data.visitor_phone}`,
      ...(data.visitor_email ? [`*Email:* ${data.visitor_email}`] : []),
      `*Date:* ${data.booking_date}`,
      `*Start time:* ${formatTimeLabel(data.start_time)}`,
      `*Duration:* ${hourLabel}`,
      `*Estimated cost:* ${costText}`,
    ].join("\n");

    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
    const waURL    = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

    // 3. Open WhatsApp
    window.open(waURL, "_blank", "noopener,noreferrer");

    setSubmitting(false);
    setSubmitted(true);
  };

  // ── Success state ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-green-600 text-lg" />
        </div>
        <h3 className="font-bold text-dark text-[1rem] mb-1">Booking sent!</h3>
        <p className="text-muted text-[0.82rem] leading-relaxed">
          Check WhatsApp to confirm with the team.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-5 text-teal-primary text-[0.8rem] font-semibold hover:underline"
        >
          Make another booking
        </button>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">

      {/* Name + Phone — side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Jane Kamau"
            className="form-input"
            {...register("visitor_name")}
          />
          {errors.visitor_name && (
            <p className="text-red-500 text-[0.68rem] mt-0.5">{errors.visitor_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="+254 7XX XXX XXX"
            className="form-input"
            {...register("visitor_phone")}
          />
          {errors.visitor_phone && (
            <p className="text-red-500 text-[0.68rem] mt-0.5">{errors.visitor_phone.message}</p>
          )}
        </div>
      </div>

      {/* Date + Email — side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            min={todayISO()}
            className="form-input"
            {...register("booking_date")}
          />
          {errors.booking_date && (
            <p className="text-red-500 text-[0.68rem] mt-0.5">{errors.booking_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted mb-1">
            Email <span className="opacity-50 font-normal normal-case tracking-normal">(opt.)</span>
          </label>
          <input
            type="email"
            placeholder="jane@example.com"
            className="form-input"
            {...register("visitor_email")}
          />
          {errors.visitor_email && (
            <p className="text-red-500 text-[0.68rem] mt-0.5">{errors.visitor_email.message}</p>
          )}
        </div>
      </div>

      {/* Start time + Hours — side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <select className="form-input" {...register("start_time")}>
            {TIME_SLOTS.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
          {errors.start_time && (
            <p className="text-red-500 text-[0.68rem] mt-0.5">{errors.start_time.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted mb-1">
            Duration <span className="text-red-500">*</span>
          </label>
          <select className="form-input" {...register("hours")}>
            {HOUR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live cost estimator */}
      <div className="bg-teal-wash rounded-md px-4 py-3 flex items-center justify-between">
        <span className="text-[0.78rem] font-semibold text-teal-primary uppercase tracking-wider">
          Estimated Cost
        </span>
        <span className="text-[1rem] font-extrabold text-teal-primary">
          {estimatedCost !== null
            ? `KES ${estimatedCost.toLocaleString()}`
            : "Rate on enquiry"}
        </span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-[0.88rem] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <i className="fab fa-whatsapp text-[1.1rem]" />
        {submitting ? "Opening WhatsApp…" : "Book via WhatsApp"}
      </button>

    </form>
  );
}
