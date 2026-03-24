-- ============================================================
-- Migration: 004_courses_lessons.sql
-- Description: Creates courses, lessons, and quizzes tables
--              for the Ontime Academy e-learning platform.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── COURSES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The teacher who owns this course
  teacher_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text,
  thumbnail_url   text,

  -- Delivery mode: online | physical | hybrid
  mode            text NOT NULL DEFAULT 'online'
                  CHECK (mode IN ('online', 'physical', 'hybrid')),

  -- Price in KES (0 = free)
  price           integer NOT NULL DEFAULT 0,

  -- Draft / Published toggle
  is_published    boolean NOT NULL DEFAULT false,

  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Anyone can read published courses
CREATE POLICY "courses_public_read"
  ON courses FOR SELECT
  USING (is_published = true);

-- Teachers can read their own courses (including drafts)
CREATE POLICY "courses_teacher_read_own"
  ON courses FOR SELECT
  USING (auth.uid() = teacher_id);

-- Teachers can insert their own courses
CREATE POLICY "courses_teacher_insert"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own courses
CREATE POLICY "courses_teacher_update"
  ON courses FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Teachers can delete their own courses
CREATE POLICY "courses_teacher_delete"
  ON courses FOR DELETE
  USING (auth.uid() = teacher_id);


-- ── LESSONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  title         text NOT NULL,

  -- Vimeo video URL or embed URL
  vimeo_url     text NOT NULL,

  -- Ordering within the course (1-based)
  order_index   integer NOT NULL DEFAULT 1,

  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Enrolled students + teachers can read lessons
-- (open read for now; tighten in 007_rls_policies.sql)
CREATE POLICY "lessons_auth_read"
  ON lessons FOR SELECT
  USING (auth.role() = 'authenticated');

-- Teachers manage their own lessons (via course ownership)
CREATE POLICY "lessons_teacher_insert"
  ON lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
        AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "lessons_teacher_update"
  ON lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
        AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "lessons_teacher_delete"
  ON lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
        AND courses.teacher_id = auth.uid()
    )
  );


-- ── QUIZZES ─────────────────────────────────────────────────
-- One quiz question per lesson (simple single-choice MCQ)

CREATE TABLE IF NOT EXISTS quizzes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  question        text NOT NULL,

  -- 2–4 answer options stored as text array
  options         text[] NOT NULL,

  -- 0-based index into options[]
  correct_index   integer NOT NULL,

  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read quizzes
CREATE POLICY "quizzes_auth_read"
  ON quizzes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Teachers manage quizzes for their lessons
CREATE POLICY "quizzes_teacher_insert"
  ON quizzes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = lesson_id
        AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "quizzes_teacher_update"
  ON quizzes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = lesson_id
        AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "quizzes_teacher_delete"
  ON quizzes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = lesson_id
        AND c.teacher_id = auth.uid()
    )
  );


-- ── VERIFY ──────────────────────────────────────────────────
-- SELECT id, title, slug, price, is_published FROM courses;
-- SELECT id, title, order_index, vimeo_url FROM lessons LIMIT 10;
-- SELECT id, question, correct_index FROM quizzes LIMIT 10;
