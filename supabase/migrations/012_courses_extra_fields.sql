-- ============================================================
-- 012_courses_extra_fields.sql
-- Adds richer metadata columns to the courses table
-- ============================================================

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS category       text,
  ADD COLUMN IF NOT EXISTS level          text
                            CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS duration       text,          -- e.g. "4 weeks", "20 hours"
  ADD COLUMN IF NOT EXISTS outcomes       text,          -- what students will learn
  ADD COLUMN IF NOT EXISTS prerequisites  text,          -- optional prior knowledge
  ADD COLUMN IF NOT EXISTS language       text NOT NULL DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS max_students   integer,       -- null = unlimited
  ADD COLUMN IF NOT EXISTS has_certificate boolean NOT NULL DEFAULT false;

-- ── VERIFY ──────────────────────────────────────────────────
-- SELECT id, title, category, level, language, duration, has_certificate FROM courses LIMIT 5;
