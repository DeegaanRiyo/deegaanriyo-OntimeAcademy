-- ============================================================
-- 017_student_registrations.sql
-- Replaces walk_in_payments for student-specific registrations.
-- Adds fee breakdown columns and fixes student_type values.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ── 1. Create student_registrations if it doesn't exist ──────────────────────
CREATE TABLE IF NOT EXISTS student_registrations (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  student_type        text        NOT NULL DEFAULT 'new'
                      CHECK (student_type IN ('new', 'current_old', 'zoom_virtual')),

  customer_name       text        NOT NULL,
  customer_phone      text        NOT NULL,
  customer_email      text,

  -- Optional link to a platform account
  profile_id          uuid        REFERENCES profiles(id) ON DELETE SET NULL,

  -- Fee breakdown
  course_fee_monthly  integer,
  registration_fee    integer,
  total_due           integer,

  -- Amount paid at registration
  amount              integer     NOT NULL CHECK (amount > 0),
  method              text        NOT NULL
                      CHECK (method IN ('cash', 'mpesa', 'bank_transfer', 'both')),
  reference           text,
  notes               text,

  recorded_by         uuid        NOT NULL REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── 2. If table already exists, patch missing columns ────────────────────────
ALTER TABLE student_registrations
  ADD COLUMN IF NOT EXISTS profile_id          uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_fee_monthly  integer,
  ADD COLUMN IF NOT EXISTS registration_fee    integer,
  ADD COLUMN IF NOT EXISTS total_due           integer;

-- ── 3. Fix student_type check constraint (drop old, add new) ─────────────────
-- Drop any existing check constraint on student_type
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'student_registrations'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%student_type%';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE student_registrations DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

-- Add the correct check constraint
ALTER TABLE student_registrations
  ADD CONSTRAINT student_registrations_student_type_check
  CHECK (student_type IN ('new', 'current_old', 'zoom_virtual'));

-- ── 4. Update student_flags to use registration_id instead of payment_id ─────
ALTER TABLE student_flags
  ADD COLUMN IF NOT EXISTS registration_id uuid REFERENCES student_registrations(id) ON DELETE CASCADE;

-- ── 5. RLS on student_registrations ──────────────────────────────────────────
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "receptionist_insert_registration"   ON student_registrations;
DROP POLICY IF EXISTS "receptionist_read_own_registrations" ON student_registrations;
DROP POLICY IF EXISTS "manager_read_registrations"          ON student_registrations;
DROP POLICY IF EXISTS "owner_all_registrations"             ON student_registrations;

CREATE POLICY "receptionist_insert_registration"
  ON student_registrations FOR INSERT
  WITH CHECK (
    recorded_by = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('receptionist', 'admin', 'owner', 'manager'))
  );

CREATE POLICY "receptionist_read_own_registrations"
  ON student_registrations FOR SELECT
  USING (
    recorded_by = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'receptionist')
  );

CREATE POLICY "manager_read_registrations"
  ON student_registrations FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "owner_all_registrations"
  ON student_registrations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ── 6. Drop and recreate the view with all columns ───────────────────────────
DROP VIEW IF EXISTS v_student_registrations_this_month;

CREATE VIEW v_student_registrations_this_month AS
SELECT
  sr.id,
  sr.student_type,
  sr.customer_name,
  sr.customer_phone,
  sr.customer_email,
  sr.profile_id,
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

-- Grant service role access to the view
GRANT SELECT ON v_student_registrations_this_month TO service_role;

-- ── 7. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS student_registrations_student_type_idx ON student_registrations (student_type);
CREATE INDEX IF NOT EXISTS student_registrations_recorded_by_idx  ON student_registrations (recorded_by);
CREATE INDEX IF NOT EXISTS student_registrations_created_at_idx   ON student_registrations (created_at);
