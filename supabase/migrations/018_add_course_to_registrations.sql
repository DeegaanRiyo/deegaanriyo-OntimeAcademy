-- ============================================================
-- 018_add_course_to_registrations.sql
-- Adds a free-text course_name column to student_registrations
-- and updates v_student_registrations_this_month to include it.
-- ============================================================

-- ── 1. Add course_name column ─────────────────────────────────────────────────
ALTER TABLE student_registrations
  ADD COLUMN IF NOT EXISTS course_name text;

-- ── 2. Recreate view with course_name ────────────────────────────────────────
DROP VIEW IF EXISTS v_student_registrations_this_month;

CREATE VIEW v_student_registrations_this_month AS
SELECT
  sr.id,
  sr.student_type,
  sr.customer_name,
  sr.customer_phone,
  sr.customer_email,
  sr.profile_id,
  sr.course_name,
  sr.course_fee_monthly,
  sr.registration_fee,
  sr.total_due,
  sr.amount,
  sr.method,
  sr.reference,
  sr.notes,
  sr.recorded_by,
  sr.created_at,
  p.full_name  AS recorder_full_name,
  p.role       AS recorder_role
FROM student_registrations sr
LEFT JOIN profiles p ON p.id = sr.recorded_by
WHERE sr.created_at >= date_trunc('month', now());

GRANT SELECT ON v_student_registrations_this_month TO service_role;
