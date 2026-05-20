-- ============================================================
-- reset_to_clean.sql
-- Clears ALL transactional / test data.
--
-- KEEPS:
--   • profiles (owner, manager, receptionist, teacher, etc.)
--   • spaces
--   • auth users
--   • courses / lessons / quizzes (content stays)
--
-- WIPES:
--   • student_registrations  (all student records + fees)
--   • student_flags          (all open/resolved flags)
--   • members                (all membership subscriptions)
--   • expenses               (all recorded expenses)
--   • walk_in_payments       (legacy table — cleared for safety)
--   • bookings               (all space reservations)
--   • payments               (all online platform payments)
--   • enrolments             (all course enrolments)
--   • lesson_progress / quiz_attempts  (all learning progress)
--   • pending_registrations / invite_tokens / password_reset_requests
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Learning progress (no FKs pointing back)
TRUNCATE TABLE quiz_attempts            RESTART IDENTITY CASCADE;
TRUNCATE TABLE lesson_progress          RESTART IDENTITY CASCADE;
TRUNCATE TABLE enrolments               RESTART IDENTITY CASCADE;

-- 2. Payments (online platform)
TRUNCATE TABLE payments                 RESTART IDENTITY CASCADE;

-- 3. Student registrations + flags (new schema)
TRUNCATE TABLE student_flags            RESTART IDENTITY CASCADE;
TRUNCATE TABLE student_registrations    RESTART IDENTITY CASCADE;

-- 4. Legacy walk-in payments (old schema — safe to clear)
TRUNCATE TABLE walk_in_payments         RESTART IDENTITY CASCADE;

-- 5. Members (subscription records only — profiles stay)
TRUNCATE TABLE members                  RESTART IDENTITY CASCADE;

-- 6. Expenses
TRUNCATE TABLE expenses                 RESTART IDENTITY CASCADE;

-- 7. Bookings (space reservations)
TRUNCATE TABLE bookings                 RESTART IDENTITY CASCADE;

-- 8. Auth / invite tokens
TRUNCATE TABLE pending_registrations    RESTART IDENTITY CASCADE;
TRUNCATE TABLE password_reset_requests  RESTART IDENTITY CASCADE;
TRUNCATE TABLE invite_tokens            RESTART IDENTITY CASCADE;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT
  tbl,
  cnt,
  CASE WHEN cnt = 0 THEN '✓ clear' ELSE '⚠ not empty' END AS status
FROM (
       SELECT 'student_registrations'    AS tbl, COUNT(*) AS cnt FROM student_registrations
  UNION ALL SELECT 'student_flags',              COUNT(*) FROM student_flags
  UNION ALL SELECT 'members',                    COUNT(*) FROM members
  UNION ALL SELECT 'expenses',                   COUNT(*) FROM expenses
  UNION ALL SELECT 'bookings',                   COUNT(*) FROM bookings
  UNION ALL SELECT 'payments',                   COUNT(*) FROM payments
  UNION ALL SELECT 'enrolments',                 COUNT(*) FROM enrolments
  UNION ALL SELECT 'walk_in_payments',           COUNT(*) FROM walk_in_payments
  UNION ALL SELECT 'quiz_attempts',              COUNT(*) FROM quiz_attempts
  UNION ALL SELECT 'lesson_progress',            COUNT(*) FROM lesson_progress
  UNION ALL SELECT 'pending_registrations',      COUNT(*) FROM pending_registrations
  UNION ALL SELECT 'password_reset_requests',    COUNT(*) FROM password_reset_requests
  UNION ALL SELECT 'invite_tokens',              COUNT(*) FROM invite_tokens
) t
ORDER BY tbl;

-- Profiles kept (for reference):
SELECT role, COUNT(*) AS kept FROM profiles GROUP BY role ORDER BY role;
