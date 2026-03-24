-- ============================================================
-- Migration: 010_space_sessions.sql
-- Description: Extends bookings table for operational space
--              management by Receptionist and Manager.
--
-- New columns:
--   end_time   — explicit end time (preferred over hours)
--   setup      — room configuration (e.g. "Podcast Recording")
--   booked_by  — profile id of staff who created the booking
--
-- New statuses: active (checked-in), completed (session ended)
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Add new columns ───────────────────────────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time   time;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS setup      text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booked_by  uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- ── 2. Extend status constraint ──────────────────────────────
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'pending',    -- public form submission, awaiting review
    'confirmed',  -- approved or created by staff
    'rejected',   -- declined by staff
    'cancelled',  -- cancelled by booker or staff
    'active',     -- client has checked in, session in progress
    'completed'   -- session ended
  ));

-- ── 3. RLS: staff can insert bookings directly ────────────────
-- (existing bookings_auth_update already allows authenticated updates)
-- Allow manager + receptionist to insert confirmed/active bookings
DROP POLICY IF EXISTS "bookings_staff_insert" ON bookings;
CREATE POLICY "bookings_staff_insert"
  ON bookings FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    get_my_role() IN ('owner', 'admin', 'manager', 'receptionist')
  );

-- ── 4. Verify ────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'bookings'
-- ORDER BY ordinal_position;
