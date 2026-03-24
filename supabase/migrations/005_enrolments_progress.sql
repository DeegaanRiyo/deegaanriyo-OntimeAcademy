-- ============================================================
-- Migration: 005_enrolments_progress.sql
-- Description: Creates enrolments, lesson_progress, and
--              quiz_attempts tables for student tracking.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--              (run AFTER 004_courses_lessons.sql)
-- ============================================================

-- ── ENROLMENTS ──────────────────────────────────────────────
-- One row per student per course

CREATE TABLE IF NOT EXISTS enrolments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id         uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  enrolled_at       timestamptz NOT NULL DEFAULT now(),
  last_accessed_at  timestamptz,

  -- Prevent duplicate enrolments
  UNIQUE (student_id, course_id)
);

ALTER TABLE enrolments ENABLE ROW LEVEL SECURITY;

-- Students can see their own enrolments
CREATE POLICY "enrolments_student_read_own"
  ON enrolments FOR SELECT
  USING (auth.uid() = student_id);

-- Students can enrol themselves
CREATE POLICY "enrolments_student_insert"
  ON enrolments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own enrolment (last_accessed_at)
CREATE POLICY "enrolments_student_update"
  ON enrolments FOR UPDATE
  USING (auth.uid() = student_id);

-- Teachers can read enrolments for their courses
CREATE POLICY "enrolments_teacher_read"
  ON enrolments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
        AND courses.teacher_id = auth.uid()
    )
  );

-- Admin/Owner can read all enrolments
CREATE POLICY "enrolments_admin_read"
  ON enrolments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );


-- ── LESSON PROGRESS ─────────────────────────────────────────
-- One row per student per lesson (created when lesson is completed)

CREATE TABLE IF NOT EXISTS lesson_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_id    uuid NOT NULL REFERENCES enrolments(id) ON DELETE CASCADE,
  lesson_id       uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  completed       boolean NOT NULL DEFAULT false,
  completed_at    timestamptz,

  UNIQUE (enrolment_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Students can read their own progress
CREATE POLICY "lesson_progress_student_read"
  ON lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrolments
      WHERE enrolments.id = enrolment_id
        AND enrolments.student_id = auth.uid()
    )
  );

-- Students can insert/update their own progress
CREATE POLICY "lesson_progress_student_insert"
  ON lesson_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrolments
      WHERE enrolments.id = enrolment_id
        AND enrolments.student_id = auth.uid()
    )
  );

CREATE POLICY "lesson_progress_student_update"
  ON lesson_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM enrolments
      WHERE enrolments.id = enrolment_id
        AND enrolments.student_id = auth.uid()
    )
  );


-- ── QUIZ ATTEMPTS ────────────────────────────────────────────
-- Records each student's quiz answer per lesson

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id         uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,

  -- The index the student selected
  selected_index  integer NOT NULL,
  is_correct      boolean NOT NULL,

  attempted_at    timestamptz NOT NULL DEFAULT now(),

  -- One attempt per student per quiz (upsert on re-attempt)
  UNIQUE (student_id, quiz_id)
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Students read/write their own attempts
CREATE POLICY "quiz_attempts_student_read"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "quiz_attempts_student_insert"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "quiz_attempts_student_update"
  ON quiz_attempts FOR UPDATE
  USING (auth.uid() = student_id);


-- ── VERIFY ──────────────────────────────────────────────────
-- SELECT id, student_id, course_id, enrolled_at FROM enrolments;
-- SELECT id, enrolment_id, lesson_id, completed FROM lesson_progress;
-- SELECT id, student_id, quiz_id, is_correct FROM quiz_attempts;
