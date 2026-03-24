"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const MODES      = ["online", "physical", "hybrid"] as const;
const LEVELS     = ["beginner", "intermediate", "advanced"] as const;
const LANGUAGES  = ["English", "Swahili", "English & Swahili"] as const;
const CATEGORIES = [
  "Technology & IT",
  "Business & Entrepreneurship",
  "Digital Marketing",
  "Design & Creative",
  "Health & Wellness",
  "Finance & Accounting",
  "Leadership & Management",
  "Language & Communication",
  "Arts & Culture",
  "Other",
] as const;

const schema = z.object({
  title:           z.string().min(3, "Title must be at least 3 characters"),
  category:        z.string().min(1, "Please select a category"),
  level:           z.enum(LEVELS, { message: "Please select a difficulty level" } as any),
  description:     z.string().min(20, "Description must be at least 20 characters"),
  outcomes:        z.string().optional(),
  prerequisites:   z.string().optional(),
  mode:            z.enum(MODES),
  language:        z.enum(LANGUAGES),
  duration:        z.string().optional(),
  max_students:    z.string().optional(),
  price:           z.string().refine(
    (v) => v === "" || v === "0" || (Number(v) >= 100),
    { message: "Paid courses must be at least KES 100" }
  ),
  thumbnail_url:   z.union([z.string().url("Enter a valid image URL"), z.literal("")]),
  has_certificate: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const MODE_ICONS: Record<string, string> = {
  online:   "fa-laptop",
  physical: "fa-chalkboard-teacher",
  hybrid:   "fa-layer-group",
};
const LEVEL_COLORS: Record<string, string> = {
  beginner:     "#4ade80",
  intermediate: "#f59e0b",
  advanced:     "#f87171",
};

const inputCls = "w-full bg-[var(--dark3)] border border-[var(--border)] rounded-lg px-[13px] py-[10px] text-[var(--white)] text-[.85rem] outline-none";
const textareaCls = `${inputCls} resize-y leading-[1.6]`;
const labelCls = "block text-[.68rem] font-bold text-[var(--muted)] uppercase tracking-[.08em] mb-1.5";
const fieldError = "text-[.7rem] text-[var(--red)] mt-1";

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[.72rem] font-bold text-[var(--teal2)] uppercase tracking-[.08em] pb-[10px] border-b border-[var(--border)] mb-4">
      <i className={`fas ${icon}`} />
      {label}
    </div>
  );
}

export default function CreateCourseForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", category: "", level: undefined, description: "",
      outcomes: "", prerequisites: "", mode: "online", language: "English",
      duration: "", max_students: "", price: "0",
      thumbnail_url: "", has_certificate: false,
    },
  });

  const mode         = watch("mode");
  const price        = watch("price");
  const thumbnail    = watch("thumbnail_url");
  const certificate  = watch("has_certificate");
  const isFree       = price === "0" || price === "";
  const showCapacity = mode === "physical" || mode === "hybrid";

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/teacher/courses", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        ...data,
        price:        Number(data.price) || 0,
        max_students: data.max_students ? Number(data.max_students) : null,
      }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError("root", { message: j.error ?? "Failed to create course." });
      return;
    }
    const course = await res.json();
    router.push(`/dashboard/teacher/courses/${course.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>

      {/* API Error banner */}
      {errors.root && (
        <div className="bg-[rgba(239,68,68,.08)] border border-[rgba(239,68,68,.25)] rounded-lg px-3.5 py-[11px] text-[.8rem] text-[var(--red)] flex items-center gap-[9px] mb-[18px]">
          <i className="fas fa-circle-exclamation" aria-hidden="true" /> {errors.root.message}
        </div>
      )}

      {/* ── Section 1: Identity ──────────────────────────── */}
      <div className="card mb-[18px]">
        <div className="px-6 py-5">
          <SectionHeader icon="fa-graduation-cap" label="Course Identity" />
          <div className="flex flex-col gap-4">

            {/* Title */}
            <div>
              <label className={labelCls} htmlFor="title">
                Course Title <span className="text-[var(--red)]">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={inputCls}
                placeholder="e.g. Digital Marketing Fundamentals"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
              {errors.title && <p className={fieldError}>{errors.title.message}</p>}
            </div>

            {/* Category + Level */}
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className={labelCls} htmlFor="category">
                  Category <span className="text-[var(--red)]">*</span>
                </label>
                <select id="category" className={inputCls} aria-invalid={!!errors.category} {...register("category")}>
                  <option value="">— Select category —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p className={fieldError}>{errors.category.message}</p>}
              </div>
              <div>
                <label className={labelCls} htmlFor="level">
                  Difficulty Level <span className="text-[var(--red)]">*</span>
                </label>
                <select id="level" className={inputCls} aria-invalid={!!errors.level} {...register("level")}>
                  <option value="">— Select level —</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                  ))}
                </select>
                {errors.level
                  ? <p className={fieldError}>{errors.level.message}</p>
                  : watch("level") && (
                    <div style={{ marginTop: "5px", fontSize: ".68rem", color: LEVEL_COLORS[watch("level")!] }}>
                      <i className="fas fa-circle text-[.45rem] mr-[5px]" />
                      {watch("level") === "beginner" ? "No prior knowledge needed" :
                       watch("level") === "intermediate" ? "Some experience expected" :
                       "Deep expertise required"}
                    </div>
                  )
                }
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Section 2: About ─────────────────────────────── */}
      <div className="card mb-[18px]">
        <div className="px-6 py-5">
          <SectionHeader icon="fa-align-left" label="About This Course" />
          <div className="flex flex-col gap-4">

            <div>
              <label className={labelCls} htmlFor="description">
                Course Description <span className="text-[var(--red)]">*</span>
              </label>
              <textarea
                id="description"
                className={textareaCls}
                rows={4}
                placeholder="Give students an overview of what this course covers, the approach, and key topics…"
                aria-invalid={!!errors.description}
                {...register("description")}
              />
              {errors.description && <p className={fieldError}>{errors.description.message}</p>}
            </div>

            <div>
              <label className={labelCls} htmlFor="outcomes">
                What Students Will Learn
                <span className="text-[var(--muted)] font-normal normal-case tracking-normal ml-1.5">(learning outcomes)</span>
              </label>
              <textarea
                id="outcomes"
                className={textareaCls}
                rows={3}
                placeholder="• Build a professional website from scratch&#10;• Run targeted ad campaigns&#10;• Analyse data with Excel"
                {...register("outcomes")}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="prerequisites">
                Prerequisites
                <span className="text-[var(--muted)] font-normal normal-case tracking-normal ml-1.5">(optional)</span>
              </label>
              <textarea
                id="prerequisites"
                className={textareaCls}
                rows={2}
                placeholder="e.g. Basic computer skills, smartphone with internet access"
                {...register("prerequisites")}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ── Section 3: Delivery ──────────────────────────── */}
      <div className="card mb-[18px]">
        <div className="px-6 py-5">
          <SectionHeader icon="fa-truck" label="Delivery & Schedule" />
          <div className="flex flex-col gap-4">

            {/* Mode selector — visual toggle */}
            <div>
              <label className={labelCls}>Delivery Mode</label>
              <div className="flex gap-[10px]">
                {MODES.map((m) => {
                  const active = mode === m;
                  const color  = m === "online" ? "var(--teal2)" : m === "physical" ? "#f59e0b" : "#a78bfa";
                  return (
                    <button
                      key={m} type="button"
                      onClick={() => setValue("mode", m)}
                      style={{
                        flex: 1, padding: "12px 10px", borderRadius: "9px", cursor: "pointer",
                        border: active ? `1.5px solid ${color}` : "1.5px solid var(--border)",
                        background: active ? `${color}14` : "var(--dark3)",
                        color: active ? color : "var(--muted)",
                        fontWeight: 600, fontSize: ".78rem", transition: "all .15s",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                      }}
                    >
                      <i className={`fas ${MODE_ICONS[m]} text-[1.1rem]`} />
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  );
                })}
              </div>
              <div className="mt-[7px] text-[.7rem] text-[var(--muted)]">
                {mode === "online"   ? "Fully remote — students access lessons online at their own pace." :
                 mode === "physical" ? "In-person sessions at Ontime Academy premises." :
                                      "Combination of online content and scheduled in-person sessions."}
              </div>
            </div>

            {/* Language + Duration */}
            <div className="grid grid-cols-2 gap-[14px]">
              <div>
                <label className={labelCls} htmlFor="language">Language</label>
                <select id="language" className={inputCls} {...register("language")}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="duration">
                  Duration
                  <span className="text-[var(--muted)] font-normal normal-case tracking-normal ml-1.5">(optional)</span>
                </label>
                <input id="duration" type="text" className={inputCls} placeholder="e.g. 4 weeks, 20 hours" {...register("duration")} />
              </div>
            </div>

            {showCapacity && (
              <div>
                <label className={labelCls} htmlFor="max_students">
                  Maximum Students
                  <span className="text-[var(--muted)] font-normal normal-case tracking-normal ml-1.5">(leave blank for unlimited)</span>
                </label>
                <input
                  id="max_students"
                  type="number"
                  min={1}
                  className={`${inputCls} max-w-[200px]`}
                  placeholder="e.g. 20"
                  {...register("max_students")}
                />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Section 4: Pricing ───────────────────────────── */}
      <div className="card mb-[18px]">
        <div className="px-6 py-5">
          <SectionHeader icon="fa-tag" label="Pricing" />
          <div className="flex flex-col gap-[14px]">

            <div className="flex gap-[10px]">
              {[true, false].map((free) => {
                const active = isFree === free;
                return (
                  <button
                    key={String(free)} type="button"
                    onClick={() => setValue("price", free ? "0" : "", { shouldValidate: true })}
                    style={{
                      padding: "9px 22px", borderRadius: "8px", cursor: "pointer", fontWeight: 600,
                      fontSize: ".82rem", transition: "all .15s",
                      border: active ? "1.5px solid var(--teal2)" : "1.5px solid var(--border)",
                      background: active ? "rgba(15,179,187,.12)" : "var(--dark3)",
                      color: active ? "var(--teal2)" : "var(--muted)",
                    }}
                  >
                    <i className={`fas ${free ? "fa-gift" : "fa-coins"} mr-[7px]`} />
                    {free ? "Free" : "Paid"}
                  </button>
                );
              })}
            </div>

            {!isFree && (
              <div>
                <label className={labelCls} htmlFor="price">Price (KES) <span className="text-[var(--red)]">*</span></label>
                <input
                  id="price"
                  type="number"
                  min={100}
                  step={100}
                  className={`${inputCls} max-w-[220px]`}
                  placeholder="e.g. 5,000"
                  aria-invalid={!!errors.price}
                  {...register("price")}
                />
                {errors.price && <p className={fieldError}>{errors.price.message}</p>}
              </div>
            )}

            {isFree && (
              <div className="px-[13px] py-[9px] bg-[rgba(15,179,187,.07)] border border-[rgba(15,179,187,.2)] rounded-[7px] text-[.75rem] text-[var(--teal2)]">
                <i className="fas fa-info-circle mr-[7px]" />
                This course will be accessible to all enrolled students at no cost.
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Section 5: Media & Certificate ──────────────── */}
      <div className="card mb-[18px]">
        <div className="px-6 py-5">
          <SectionHeader icon="fa-image" label="Media & Certificate" />
          <div className="flex flex-col gap-4">

            <div>
              <label className={labelCls} htmlFor="thumbnail_url">
                Thumbnail URL
                <span className="text-[var(--muted)] font-normal normal-case tracking-normal ml-1.5">(optional)</span>
              </label>
              <input
                id="thumbnail_url"
                type="url"
                className={inputCls}
                placeholder="https://example.com/image.jpg"
                aria-invalid={!!errors.thumbnail_url}
                {...register("thumbnail_url")}
              />
              {errors.thumbnail_url && <p className={fieldError}>{errors.thumbnail_url.message}</p>}
              {thumbnail && !errors.thumbnail_url && (
                <div className="mt-[10px]">
                  <img
                    src={thumbnail}
                    alt="Thumbnail preview"
                    className="max-w-[160px] h-[90px] object-cover rounded-[7px] border border-[var(--border)]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>

            {/* Certificate toggle */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative mt-px">
                <input type="checkbox" {...register("has_certificate")} className="hidden" />
                <div
                  onClick={() => setValue("has_certificate", !certificate)}
                  className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center cursor-pointer transition-all duration-150"
                  style={{
                    border: certificate ? "none" : "1.5px solid var(--border)",
                    background: certificate ? "var(--teal)" : "var(--dark3)",
                  }}
                >
                  {certificate && <i className="fas fa-check text-white text-[.62rem]" />}
                </div>
              </div>
              <div>
                <div className="text-[.85rem] font-semibold text-[var(--white)]">Award Certificate on Completion</div>
                <div className="text-[.72rem] text-[var(--muted)] mt-0.5">
                  Students who complete all lessons will receive a certificate from Ontime Academy.
                </div>
              </div>
            </label>

          </div>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────── */}
      <div className="flex gap-3 justify-end py-1 pb-6">
        <button type="button" className="btn-sm btn-ghost" onClick={() => router.push("/dashboard/teacher/courses")}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-sm btn-primary disabled:opacity-60 min-w-[140px]"
        >
          {isSubmitting
            ? <><i className="fas fa-circle-notch fa-spin mr-[7px]" />Creating…</>
            : <><i className="fas fa-plus mr-[7px]" />Create Course</>}
        </button>
      </div>

    </form>
  );
}
