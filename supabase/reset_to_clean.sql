-- ============================================================
-- reset_to_clean.sql
-- Clears all transactional/test data.
-- Profiles, spaces, and auth users are NOT touched.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

TRUNCATE TABLE quiz_attempts            RESTART IDENTITY CASCADE;
TRUNCATE TABLE lesson_progress          RESTART IDENTITY CASCADE;
TRUNCATE TABLE enrolments               RESTART IDENTITY CASCADE;
TRUNCATE TABLE payments                 RESTART IDENTITY CASCADE;
TRUNCATE TABLE walk_in_payments         RESTART IDENTITY CASCADE;
TRUNCATE TABLE bookings                 RESTART IDENTITY CASCADE;
TRUNCATE TABLE members                  RESTART IDENTITY CASCADE;
TRUNCATE TABLE pending_registrations    RESTART IDENTITY CASCADE;
TRUNCATE TABLE password_reset_requests  RESTART IDENTITY CASCADE;
TRUNCATE TABLE invite_tokens            RESTART IDENTITY CASCADE;
TRUNCATE TABLE courses                  RESTART IDENTITY CASCADE; -- cascades to lessons + quizzes

-- Verify everything is empty
SELECT 'quiz_attempts'           AS tbl, COUNT(*) FROM quiz_attempts
UNION ALL SELECT 'lesson_progress',        COUNT(*) FROM lesson_progress
UNION ALL SELECT 'enrolments',             COUNT(*) FROM enrolments
UNION ALL SELECT 'payments',               COUNT(*) FROM payments
UNION ALL SELECT 'walk_in_payments',       COUNT(*) FROM walk_in_payments
UNION ALL SELECT 'bookings',               COUNT(*) FROM bookings
UNION ALL SELECT 'members',                COUNT(*) FROM members
UNION ALL SELECT 'courses',                COUNT(*) FROM courses
UNION ALL SELECT 'pending_registrations',  COUNT(*) FROM pending_registrations
UNION ALL SELECT 'password_reset_requests',COUNT(*) FROM password_reset_requests
UNION ALL SELECT 'invite_tokens',          COUNT(*) FROM invite_tokens;
