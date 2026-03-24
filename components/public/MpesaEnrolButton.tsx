"use client";
// ─── M-Pesa Enrol Button ──────────────────────────────────────────────────────
// States: loading → unauthenticated | idle → submitting → polling → paid | failed

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  courseId:    string;
  price:       number;
  courseTitle: string;
  courseSlug:  string;
};

type Stage = "loading" | "idle" | "submitting" | "polling" | "paid" | "failed";

export default function MpesaEnrolButton({ courseId, price, courseTitle, courseSlug }: Props) {
  const router = useRouter();
  const [stage,      setStage]      = useState<Stage>("loading");
  const [isStudent,  setIsStudent]  = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [phone,      setPhone]      = useState("");
  const [error,      setError]      = useState("");
  const [receipt,    setReceipt]    = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const returnUrl = `/courses/${courseSlug}`;

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStage("idle"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "student") { setStage("idle"); return; }

      setIsStudent(true);

      const { data: enrolment } = await supabase
        .from("enrolments").select("id")
        .eq("student_id", user.id).eq("course_id", courseId).single();
      if (enrolment) setIsEnrolled(true);

      setStage("idle");
    })();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [courseId]);

  async function handlePay() {
    if (!phone.trim()) { setError("Enter your M-Pesa phone number"); return; }
    setError("");
    setStage("submitting");

    const res = await fetch("/api/payments/mpesa/initiate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ course_id: courseId, phone: phone.trim() }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Payment initiation failed");
      setStage("failed");
      return;
    }

    if (json.free) {
      setStage("paid");
      setTimeout(() => router.push(`/dashboard/student/courses/${courseId}`), 1500);
      return;
    }

    const checkoutId: string = json.checkoutRequestId;
    setStage("polling");

    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const statusRes = await fetch(`/api/payments/mpesa/status?id=${encodeURIComponent(checkoutId)}`);
      const status    = await statusRes.json();

      if (status.status === "paid") {
        clearInterval(pollRef.current!);
        setReceipt(status.mpesa_receipt_number ?? "");
        setStage("paid");
        setTimeout(() => router.push(`/dashboard/student/courses/${status.course_id}`), 2000);
      } else if (status.status === "failed" || status.status === "cancelled") {
        clearInterval(pollRef.current!);
        setError(
          status.failure_reason ??
          (status.status === "cancelled" ? "Payment was cancelled on your phone." : "Payment failed. Please try again.")
        );
        setStage("failed");
      } else if (attempts >= 20) {
        clearInterval(pollRef.current!);
        setError("Payment timed out. Check your M-Pesa and try again.");
        setStage("failed");
      }
    }, 3000);
  }

  // ── Loading ────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div className="h-12 flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-[var(--teal2)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Enrolled already ───────────────────────────────────────
  if (isEnrolled) {
    return (
      <a href={`/dashboard/student/courses/${courseId}`} className="nbtn flex justify-center">
        <i className="fas fa-play-circle" /><span>Continue Learning</span>
      </a>
    );
  }

  // ── Not a student (not logged in or wrong role) ────────────
  if (!isStudent) {
    return (
      <div className="flex flex-col gap-2.5">
        <a
          href={`/login?return=${encodeURIComponent(returnUrl)}`}
          className="nbtn flex justify-center"
        >
          <i className="fas fa-lock" /><span>Log in to Enrol</span>
        </a>
        <a
          href={`/signup?return=${encodeURIComponent(returnUrl)}`}
          className="flex items-center justify-center gap-2 py-[11px] rounded-sm border border-[rgba(193,68,14,.4)] text-[var(--teal2)] text-[.7rem] font-bold tracking-[.12em] uppercase transition-all duration-300 hover:bg-[rgba(193,68,14,.06)] hover:border-[var(--teal2)]"
        >
          <i className="fas fa-user-plus" /> Create Account &amp; Enrol
        </a>
        <p className="text-center text-[.68rem] text-[var(--muted)] mt-1">
          Free to create · Pay only when you enrol
        </p>
      </div>
    );
  }

  // ── Paid ───────────────────────────────────────────────────
  if (stage === "paid") {
    return (
      <div className="bg-[rgba(34,197,94,.08)] border border-[rgba(34,197,94,.25)] rounded-lg px-[18px] py-4">
        <p className="text-[var(--green)] font-bold text-[.9rem] m-0 mb-1 flex items-center gap-2">
          <i className="fas fa-check-circle" />
          Payment confirmed! {receipt && `Receipt: ${receipt}`}
        </p>
        <p className="text-[var(--muted)] text-[.75rem] m-0">
          Redirecting to your course…
        </p>
      </div>
    );
  }

  // ── Polling ────────────────────────────────────────────────
  if (stage === "polling") {
    return (
      <div className="bg-[rgba(193,68,14,.06)] border border-[rgba(193,68,14,.25)] rounded-lg px-[18px] py-4">
        <p className="text-[var(--teal2)] font-semibold text-[.88rem] m-0 mb-1.5 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-[var(--teal2)] border-t-transparent rounded-full animate-spin shrink-0" />
          Check your phone
        </p>
        <p className="text-[var(--muted)] text-[.75rem] m-0">
          Enter your M-Pesa PIN on the prompt sent to{" "}
          <strong className="text-[var(--white)]">{phone}</strong>
        </p>
      </div>
    );
  }

  // ── Idle / Failed — show payment form ─────────────────────
  return (
    <div>
      {stage === "failed" && error && (
        <div className="bg-[rgba(239,68,68,.08)] border border-[rgba(239,68,68,.25)] rounded-lg px-3.5 py-2.5 mb-3">
          <p className="text-[var(--red)] text-[.78rem] m-0">
            <i className="fas fa-exclamation-circle mr-1.5" aria-hidden="true" />{error}
          </p>
        </div>
      )}

      {price === 0 ? (
        <button
          onClick={handlePay}
          disabled={stage === "submitting"}
          className={`nbtn w-full justify-center ${stage === "submitting" ? "opacity-60" : ""}`}
        >
          <i className="fas fa-graduation-cap" />
          <span>{stage === "submitting" ? "Enrolling…" : "Enrol for Free"}</span>
        </button>
      ) : (
        <>
          <div className="flex gap-2 mb-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XX XXX XXX"
              className="flex-1 min-w-0 px-3.5 py-[11px] bg-[var(--dark)] border border-[var(--border)] rounded-md text-[.85rem] text-[var(--white)] placeholder:text-[var(--muted2)] focus:outline-none focus:border-[rgba(193,68,14,.45)] focus:shadow-[0_0_0_3px_rgba(193,68,14,.08)] transition-all duration-300"
              onKeyDown={(e) => { if (e.key === "Enter") handlePay(); }}
            />
            <button
              onClick={handlePay}
              disabled={stage === "submitting"}
              className={`shrink-0 px-[18px] py-[11px] rounded-md font-bold text-[.78rem] tracking-[.06em] text-white border-none cursor-pointer whitespace-nowrap transition-opacity duration-200 gradient-brand ${stage === "submitting" ? "opacity-60 cursor-wait" : ""}`}
            >
              {stage === "submitting" ? "Sending…" : "Pay"}
            </button>
          </div>
          {error && stage === "idle" && (
            <p className="text-[var(--red)] text-[.72rem] m-0 mb-2">{error}</p>
          )}
          <p className="text-[.68rem] text-[var(--muted)] m-0 flex items-center gap-1.5">
            <i className="fas fa-shield-alt text-[var(--teal2)] text-[.6rem]" aria-hidden="true" />
            You&apos;ll receive an M-Pesa prompt. Enter your PIN to complete.
          </p>
        </>
      )}
    </div>
  );
}
