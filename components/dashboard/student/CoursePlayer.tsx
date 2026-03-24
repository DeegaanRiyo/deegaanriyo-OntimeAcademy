"use client";

import { useState } from "react";
import Link from "next/link";

type Quiz = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
};

type Lesson = {
  id: string;
  title: string;
  vimeo_url: string | null;
  order_index: number;
  quizzes: Quiz[];
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  price: number;
  lessons: Lesson[];
};

type Props = {
  course: Course;
  enrolmentId: string;
  progressMap: Record<string, boolean>;
  attemptMap: Record<string, { selected_index: number; is_correct: boolean }>;
};

function extractVimeoId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export default function CoursePlayer({ course, enrolmentId, progressMap, attemptMap }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState<Record<string, boolean>>({ ...progressMap });
  const [attempts, setAttempts] = useState<Record<string, { selected_index: number; is_correct: boolean }>>({ ...attemptMap });
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<{ correct: boolean } | null>(null);

  const lessons = course.lessons;
  const activeLesson = lessons[activeIdx] ?? null;
  const quiz = activeLesson?.quizzes?.[0] ?? null;
  const vimeoId = extractVimeoId(activeLesson?.vimeo_url ?? null);
  const isCompleted = activeLesson ? (progress[activeLesson.id] ?? false) : false;
  const existingAttempt = quiz ? (attempts[quiz.id] ?? null) : null;
  const totalCompleted = Object.values(progress).filter(Boolean).length;
  const pct = lessons.length > 0 ? Math.round((totalCompleted / lessons.length) * 100) : 0;

  const handleLessonSelect = (idx: number) => {
    setActiveIdx(idx);
    setQuizSelected(null);
    setQuizResult(null);
  };

  const markComplete = async () => {
    if (!activeLesson || isCompleted) return;
    const res = await fetch(`/api/student/progress/${activeLesson.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrolment_id: enrolmentId }),
    });
    if (res.ok) {
      setProgress((p) => ({ ...p, [activeLesson.id]: true }));
    }
  };

  const submitQuiz = async () => {
    if (!quiz || quizSelected === null) return;
    setQuizSaving(true);
    const res = await fetch(`/api/student/progress/${activeLesson!.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrolment_id: enrolmentId,
        quiz_id: quiz.id,
        selected_index: quizSelected,
      }),
    });
    setQuizSaving(false);
    if (res.ok) {
      const isCorrect = quizSelected === quiz.correct_index;
      setAttempts((a) => ({ ...a, [quiz.id]: { selected_index: quizSelected, is_correct: isCorrect } }));
      setQuizResult({ correct: isCorrect });
      setProgress((p) => ({ ...p, [activeLesson!.id]: true }));
    }
  };

  const modeLabel: Record<string, string> = { online: "Online", physical: "Physical", hybrid: "Hybrid" };
  const modeBadge: Record<string, string> = { online: "tl", physical: "gd", hybrid: "gr" };

  return (
    <div>
      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <div className="text-[.72rem] text-[var(--muted)] mb-1">
            <Link href="/dashboard/student/courses" className="text-[var(--teal2)]">My Courses</Link>
            {" "}&rsaquo; {course.title}
          </div>
          <h2 className="text-[1.15rem]">{course.title}</h2>
          <p>
            <span className={`badge ${modeBadge[course.mode] ?? "tl"} mr-2`}>
              {modeLabel[course.mode] ?? course.mode}
            </span>
            {lessons.length} lessons · {pct}% complete
          </p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-5">
        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div style={{
            height: "100%", borderRadius: 999,
            width: `${pct}%`,
            background: pct === 100 ? "var(--green)" : "linear-gradient(90deg,var(--teal),var(--teal2))",
            transition: "width .4s",
          }} />
        </div>
        <div className="text-[.68rem] text-[var(--muted)] mt-1 text-right">
          {totalCompleted} / {lessons.length} lessons completed
        </div>
      </div>

      <div className="grid [grid-template-columns:300px_1fr] gap-5 items-start">

        {/* Sidebar — lesson list */}
        <div className="card sticky top-20">
          <div className="card-head">
            <h3><i className="fas fa-list" /> Lessons</h3>
          </div>
          <div className="py-2">
            {lessons.length === 0 ? (
              <div className="py-6 px-[18px] text-[.78rem] text-[var(--muted)] text-center">
                No lessons added yet.
              </div>
            ) : (
              lessons.map((lesson, idx) => {
                const done = progress[lesson.id] ?? false;
                const hasQuiz = lesson.quizzes?.length > 0;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonSelect(idx)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      width: "100%", padding: "10px 16px", border: "none",
                      background: activeIdx === idx ? "var(--dark3)" : "transparent",
                      borderLeft: activeIdx === idx ? "2px solid var(--teal)" : "2px solid transparent",
                      cursor: "pointer", textAlign: "left", transition: "all .2s",
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: done ? "var(--green)" : "var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".6rem", color: done ? "#fff" : "var(--muted)",
                    }}>
                      {done ? <i className="fas fa-check" /> : <span>{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{
                        fontSize: ".78rem", fontWeight: activeIdx === idx ? 700 : 500,
                        color: activeIdx === idx ? "var(--white)" : "var(--muted)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {lesson.title}
                      </div>
                      {hasQuiz && (
                        <div className="text-[.62rem] text-[var(--gold)] mt-px">
                          <i className="fas fa-question-circle" /> Quiz
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main — video player + content */}
        <div className="flex flex-col gap-4">
          {activeLesson ? (
            <>
              {/* Video */}
              <div className="card p-0 overflow-hidden">
                {vimeoId ? (
                  <div className="relative pt-[56.25%] bg-black">
                    <iframe
                      src={`https://player.vimeo.com/video/${vimeoId}?color=0fb3bb&title=0&byline=0&portrait=0`}
                      className="absolute inset-0 w-full h-full border-none"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={activeLesson.title}
                    />
                  </div>
                ) : (
                  <div className="h-[260px] bg-[var(--dark3)] flex flex-col items-center justify-center gap-[10px] text-[var(--muted)]">
                    <i className="fas fa-video-slash text-[2rem]" />
                    <span className="text-[.8rem]">No video for this lesson</span>
                  </div>
                )}

                {/* Lesson title bar */}
                <div className="px-[18px] py-[14px] flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[.88rem]">
                      {activeIdx + 1}. {activeLesson.title}
                    </div>
                    {isCompleted && (
                      <div className="text-[.7rem] text-[var(--green)] mt-0.5">
                        <i className="fas fa-check-circle" /> Completed
                      </div>
                    )}
                  </div>
                  {!isCompleted && (
                    <button className="btn-sm btn-primary shrink-0" onClick={markComplete}>
                      <i className="fas fa-check" /> Mark Complete
                    </button>
                  )}
                </div>
              </div>

              {/* Quiz */}
              {quiz && (
                <div className="card">
                  <div className="card-head">
                    <h3><i className="fas fa-question-circle text-[var(--gold)]" /> Lesson Quiz</h3>
                    {existingAttempt && (
                      <span className={`badge ${existingAttempt.is_correct ? "gr" : "rd"}`}>
                        {existingAttempt.is_correct ? "Correct" : "Incorrect"}
                      </span>
                    )}
                  </div>
                  <div className="px-[22px] py-[18px]">
                    <p className="font-semibold text-[.85rem] mb-4 leading-[1.5]">
                      {quiz.question}
                    </p>
                    <div className="flex flex-col gap-2">
                      {quiz.options.map((opt, i) => {
                        const isSelected = (existingAttempt ? existingAttempt.selected_index : quizSelected) === i;
                        const showResult = existingAttempt || quizResult;
                        const isCorrectOpt = i === quiz.correct_index;
                        let bg = "var(--dark3)";
                        let border = "var(--border)";
                        let color = "var(--white)";
                        if (showResult) {
                          if (isCorrectOpt) { bg = "rgba(34,197,94,.12)"; border = "var(--green)"; color = "var(--green)"; }
                          else if (isSelected && !isCorrectOpt) { bg = "rgba(239,68,68,.1)"; border = "var(--red)"; color = "var(--red)"; }
                        } else if (isSelected) {
                          bg = "rgba(15,179,187,.12)"; border = "var(--teal)";
                        }
                        return (
                          <button
                            key={i}
                            disabled={!!existingAttempt || !!quizResult}
                            onClick={() => setQuizSelected(i)}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              padding: "10px 14px", borderRadius: "8px",
                              background: bg, border: `1px solid ${border}`, color,
                              cursor: (existingAttempt || quizResult) ? "default" : "pointer",
                              fontSize: ".82rem", textAlign: "left", transition: "all .2s",
                            }}
                          >
                            <span style={{
                              width: 20, height: 20, borderRadius: "50%",
                              border: `1px solid ${isSelected ? "currentColor" : "var(--border)"}`,
                              background: isSelected ? "currentColor" : "transparent",
                              flexShrink: 0,
                            }} />
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {/* Result feedback */}
                    {(quizResult || existingAttempt) && (
                      <div style={{
                        marginTop: "14px", padding: "10px 14px", borderRadius: "8px",
                        background: (quizResult?.correct ?? existingAttempt?.is_correct)
                          ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
                        border: `1px solid ${(quizResult?.correct ?? existingAttempt?.is_correct) ? "var(--green)" : "var(--red)"}`,
                        fontSize: ".8rem",
                        color: (quizResult?.correct ?? existingAttempt?.is_correct) ? "var(--green)" : "var(--red)",
                        display: "flex", alignItems: "center", gap: "8px",
                      }}>
                        <i className={`fas ${(quizResult?.correct ?? existingAttempt?.is_correct) ? "fa-check-circle" : "fa-times-circle"}`} />
                        {(quizResult?.correct ?? existingAttempt?.is_correct)
                          ? "Correct! Well done."
                          : `Incorrect. The correct answer is: "${quiz.options[quiz.correct_index]}"`}
                      </div>
                    )}

                    {/* Submit button */}
                    {!existingAttempt && !quizResult && (
                      <button
                        className="btn-sm btn-primary mt-[14px] disabled:opacity-60"
                        disabled={quizSelected === null || quizSaving}
                        onClick={submitQuiz}
                      >
                        {quizSaving
                          ? <><i className="fas fa-circle-notch fa-spin" /> Submitting…</>
                          : <><i className="fas fa-paper-plane" /> Submit Answer</>}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between gap-3">
                <button
                  className="btn-sm btn-ghost disabled:opacity-40"
                  disabled={activeIdx === 0}
                  onClick={() => handleLessonSelect(activeIdx - 1)}
                >
                  <i className="fas fa-chevron-left" /> Previous
                </button>
                {activeIdx < lessons.length - 1 ? (
                  <button
                    className="btn-sm btn-primary"
                    onClick={() => handleLessonSelect(activeIdx + 1)}
                  >
                    Next <i className="fas fa-chevron-right" />
                  </button>
                ) : (
                  <Link href="/dashboard/student/courses" className="btn-sm btn-gold">
                    <i className="fas fa-flag-checkered" /> Finish Course
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="card">
              <div className="empty !py-16 !px-5">
                <i className="fas fa-play-circle" />
                <p>This course has no lessons yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
