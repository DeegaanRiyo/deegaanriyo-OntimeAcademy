"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Quiz = { id: string; question: string; options: string[]; correct_index: number };
type Lesson = { id: string; title: string; vimeo_url: string; order_index: number; quizzes: Quiz[] };
type Course = {
  id: string; title: string; description: string | null; price: number;
  thumbnail_url: string | null; mode: string; is_published: boolean; lessons: Lesson[];
};

// ── Helpers ──────────────────────────────────────────────────

function youtubeEmbed(url: string): string {
  // Handles: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return url;
}

function youtubeId(url: string): string | null {
  const embed = youtubeEmbed(url);
  const m = embed.match(/embed\/([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Quiz editor sub-component ─────────────────────────────────

function QuizEditor({ lesson, onSave }: { lesson: Lesson; onSave: (quiz: Quiz) => void }) {
  const existing = lesson.quizzes?.[0] ?? null;
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [q,       setQ]       = useState(existing?.question ?? "");
  const [opts,    setOpts]    = useState<string[]>(existing?.options ?? ["", "", "", ""]);
  const [correct, setCorrect] = useState(existing?.correct_index ?? 0);
  const [error,   setError]   = useState<string | null>(null);

  const save = async () => {
    setError(null);
    if (!q.trim()) { setError("Question is required"); return; }
    const filled = opts.filter((o) => o.trim());
    if (filled.length < 2) { setError("At least 2 options required"); return; }
    setSaving(true);
    const res = await fetch(`/api/teacher/lessons/${lesson.id}/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, options: opts.filter((o) => o.trim()), correct_index: correct }),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error ?? "Failed"); return; }
    onSave(await res.json());
    setOpen(false);
  };

  const del = async () => {
    await fetch(`/api/teacher/lessons/${lesson.id}/quiz`, { method: "DELETE" });
    onSave(null as any);
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="act-btn" title={existing ? "Edit quiz" : "Add quiz"}
        style={{ color: existing ? "var(--gold2)" : "var(--muted)" }}>
        <i className={`fas ${existing ? "fa-question-circle" : "fa-plus-circle"}`} />
      </button>
    );
  }

  return (
    <div className="bg-[var(--dark3)] border border-[var(--border)] rounded-[10px] p-4 mt-[10px]">
      <div className="font-bold text-[.78rem] mb-3 text-[var(--teal2)]">
        <i className="fas fa-question-circle" /> Quiz for: {lesson.title}
      </div>
      {error && <div className="text-[var(--red)] text-[.72rem] mb-[10px]">{error}</div>}
      <div className="form-group mb-[10px]">
        <label className="form-label">Question</label>
        <input className="form-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="What is…?" />
      </div>
      <div className="form-group mb-[10px]">
        <label className="form-label">Options (leave blank to omit)</label>
        {opts.map((o, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <input type="radio" name={`correct-${lesson.id}`} checked={correct === i}
              onChange={() => setCorrect(i)} style={{ accentColor: "var(--teal2)" }} />
            <input className="form-input flex-1" placeholder={`Option ${i + 1}`}
              value={o} onChange={(e) => setOpts((p) => { const n = [...p]; n[i] = e.target.value; return n; })} />
          </div>
        ))}
        <p className="text-[.62rem] text-[var(--muted)] mt-1">
          Select the radio button next to the correct answer.
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="btn-sm btn-primary disabled:opacity-60">
          {saving ? "Saving…" : "Save Quiz"}
        </button>
        {existing && <button onClick={del} className="btn-sm btn-ghost text-[var(--red)]">Remove</button>}
        <button onClick={() => setOpen(false)} className="btn-sm btn-ghost">Cancel</button>
      </div>
    </div>
  );
}

// ── Add lesson form ───────────────────────────────────────────

function AddLessonForm({ courseId, onAdded }: { courseId: string; onAdded: (l: Lesson) => void }) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [title,  setTitle]  = useState("");
  const [url,    setUrl]    = useState("");
  const [error,  setError]  = useState<string | null>(null);

  const save = async () => {
    setError(null);
    if (!title.trim()) { setError("Title is required"); return; }
    if (!url.trim())   { setError("YouTube URL is required"); return; }
    setSaving(true);
    const res = await fetch(`/api/teacher/courses/${courseId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, video_url: url }),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error ?? "Failed"); return; }
    onAdded(await res.json());
    setTitle(""); setUrl(""); setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-sm btn-ghost mt-3">
        <i className="fas fa-plus" /> Add Lesson
      </button>
    );
  }

  return (
    <div className="bg-[var(--dark3)] border border-[rgba(15,179,187,.2)] rounded-[10px] p-4 mt-3">
      <div className="font-bold text-[.78rem] text-[var(--teal2)] mb-3">
        <i className="fas fa-plus" /> New Lesson
      </div>
      {error && <div className="text-[var(--red)] text-[.72rem] mb-[10px]">{error}</div>}
      <div className="form-group mb-[10px]">
        <label className="form-label">Lesson Title</label>
        <input className="form-input" placeholder="e.g. Introduction to the course"
          value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="form-group mb-3">
        <label className="form-label">YouTube URL</label>
        <input className="form-input" placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
          value={url} onChange={(e) => setUrl(e.target.value)} />
        <p className="text-[.62rem] text-[var(--muted)] mt-1">
          Paste any YouTube video link. The video must allow embedding.
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="btn-sm btn-primary disabled:opacity-60">
          {saving ? "Adding…" : "Add Lesson"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-sm btn-ghost">Cancel</button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function CourseEditor({ course: initial, enrolCount }: { course: Course; enrolCount: number }) {
  const router  = useRouter();
  const [course,   setCourse]   = useState<Course>(initial);
  const [saving,   setSaving]   = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [saved,    setSaved]    = useState(false);
  const [preview,  setPreview]  = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState(course.title);
  const [desc,  setDesc]  = useState(course.description ?? "");
  const [price, setPrice] = useState(String(course.price));
  const [thumb, setThumb] = useState(course.thumbnail_url ?? "");
  const [mode,  setMode]  = useState(course.mode);

  const saveDetails = async () => {
    setError(null); setSaved(false); setSaving(true);
    const res = await fetch(`/api/teacher/courses/${course.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc, price: Number(price), thumbnail_url: thumb, mode }),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error ?? "Failed"); return; }
    setCourse((c) => ({ ...c, title, description: desc, price: Number(price), thumbnail_url: thumb, mode }));
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const togglePublish = async () => {
    setToggling(true);
    const res = await fetch(`/api/teacher/courses/${course.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !course.is_published }),
    });
    setToggling(false);
    if (res.ok) setCourse((c) => ({ ...c, is_published: !c.is_published }));
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    await fetch(`/api/teacher/lessons/${lessonId}`, { method: "DELETE" });
    setCourse((c) => ({ ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) }));
    if (preview === lessonId) setPreview(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="sec-head">
        <div className="sec-head-left">
          <h2>{course.title}</h2>
          <p>{course.lessons.length} lesson{course.lessons.length !== 1 ? "s" : ""} · {enrolCount} student{enrolCount !== 1 ? "s" : ""} enrolled</p>
        </div>
        <div className="sec-actions">
          <button onClick={togglePublish} disabled={toggling}
            className={`btn-sm ${course.is_published ? "btn-ghost" : "btn-primary"} disabled:opacity-60`}>
            <i className={`fas ${course.is_published ? "fa-eye-slash" : "fa-eye"}`} />
            {toggling ? "…" : course.is_published ? "Unpublish" : "Publish"}
          </button>
          <button onClick={() => router.push("/dashboard/teacher/courses")} className="btn-sm btn-ghost">
            <i className="fas fa-arrow-left" /> Back
          </button>
        </div>
      </div>

      <div className="grid-2 items-start">

        {/* Left — Course details */}
        <div className="card">
          <div className="card-head">
            <h3><i className="fas fa-info-circle" /> Course Details</h3>
            <span className={`badge ${course.is_published ? "gr" : ""}`}>
              <span className="badge-dot" />{course.is_published ? "Published" : "Draft"}
            </span>
          </div>
          <div className="px-[22px] py-5 flex flex-col gap-[14px]">
            {error && (
              <div className="bg-[rgba(239,68,68,.08)] border border-[rgba(239,68,68,.25)] rounded-lg px-3.5 py-2.5 text-[.75rem] text-[var(--red)]">
                <i className="fas fa-circle-exclamation" /> {error}
              </div>
            )}
            {saved && (
              <div className="bg-[rgba(34,197,94,.08)] border border-[rgba(34,197,94,.25)] rounded-lg px-3.5 py-2.5 text-[.75rem] text-[var(--green)]">
                <i className="fas fa-check-circle" /> Changes saved.
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input resize-y" rows={3}
                value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mode</label>
                <select className="form-input" value={mode} onChange={(e) => setMode(e.target.value)}>
                  {["online","physical","hybrid"].map((m) => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (KES)</label>
                <input type="number" min={0} step={100} className="form-input"
                  value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Thumbnail URL</label>
              <input type="url" className="form-input" placeholder="https://…"
                value={thumb} onChange={(e) => setThumb(e.target.value)} />
              {thumb && (
                <img src={thumb} alt="thumbnail preview" className="mt-[10px] w-full max-h-[140px] object-cover rounded-lg border border-[var(--border)]" />
              )}
            </div>
          </div>
          <div className="modal-foot">
            <button onClick={saveDetails} disabled={saving} className="btn-sm btn-primary disabled:opacity-60">
              {saving ? <><i className="fas fa-circle-notch fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save Details</>}
            </button>
          </div>
        </div>

        {/* Right — Lessons */}
        <div className="card">
          <div className="card-head">
            <h3><i className="fas fa-list-ol" /> Lessons</h3>
            <span className="text-[.68rem] text-[var(--muted)]">{course.lessons.length} total</span>
          </div>
          <div className="px-[22px] py-4">

            {/* YouTube preview panel */}
            {preview && (() => {
              const lesson = course.lessons.find((l) => l.id === preview);
              if (!lesson) return null;
              const embedUrl = youtubeEmbed(lesson.vimeo_url ?? "");
              return (
                <div className="mb-4 rounded-[10px] overflow-hidden border border-[var(--border)] bg-black">
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--dark3)]">
                    <span className="text-[.72rem] font-semibold"><i className="fab fa-youtube text-[#FF0000] mr-1.5" />{lesson.title}</span>
                    <button onClick={() => setPreview(null)} className="act-btn" title="Close preview"><i className="fas fa-times" /></button>
                  </div>
                  <div className="relative pb-[56.25%] h-0">
                    <iframe
                      src={embedUrl}
                      className="absolute top-0 left-0 w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            })()}

            {course.lessons.length === 0 ? (
              <div className="empty !py-8">
                <i className="fab fa-youtube text-[2rem] text-[#FF0000]" />
                <p>No lessons yet. Add your first YouTube lesson below.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-[10px]">
                {course.lessons.map((lesson, idx) => {
                  const ytId = youtubeId(lesson.vimeo_url);
                  return (
                    <div key={lesson.id} style={{
                      background: "var(--dark3)", border: `1px solid ${preview === lesson.id ? "var(--teal2)" : "var(--border)"}`,
                      borderRadius: "10px", padding: "14px 16px",
                    }}>
                      <div className="flex items-start justify-between gap-3">
                        {/* Thumbnail stub */}
                        {ytId && (
                          <button onClick={() => setPreview(preview === lesson.id ? null : lesson.id)}
                            className="shrink-0 w-[52px] h-9 rounded-[6px] overflow-hidden border-none p-0 cursor-pointer relative"
                            title="Preview video">
                            <img
                              src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,.35)]">
                              <i className="fas fa-play text-white text-[.55rem]" />
                            </div>
                          </button>
                        )}
                        <div className="flex items-center gap-[10px] flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-[6px] shrink-0 bg-[rgba(15,179,187,.12)] text-[var(--teal2)] flex items-center justify-center text-[.7rem] font-bold">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[.82rem] truncate">
                              {lesson.title}
                            </div>
                            <div className="text-[.62rem] text-[var(--muted)] mt-0.5">
                              <i className="fab fa-youtube mr-1 text-[#FF0000]" />
                              {lesson.vimeo_url.replace(/^https?:\/\//, "")}
                            </div>
                            {lesson.quizzes?.[0] && (
                              <div className="text-[.62rem] text-[var(--gold2)] mt-[3px]">
                                <i className="fas fa-question-circle mr-1" />
                                Quiz attached
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="td-action">
                          <QuizEditor lesson={lesson} onSave={(quiz) => {
                            setCourse((c) => ({
                              ...c,
                              lessons: c.lessons.map((l) =>
                                l.id === lesson.id ? { ...l, quizzes: quiz ? [quiz] : [] } : l
                              ),
                            }));
                          }} />
                          <button onClick={() => deleteLesson(lesson.id)} className="act-btn del" title="Delete lesson">
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <AddLessonForm courseId={course.id} onAdded={(lesson) =>
              setCourse((c) => ({ ...c, lessons: [...c.lessons, { ...lesson, quizzes: [] }] }))
            } />
          </div>
        </div>

      </div>
    </div>
  );
}
