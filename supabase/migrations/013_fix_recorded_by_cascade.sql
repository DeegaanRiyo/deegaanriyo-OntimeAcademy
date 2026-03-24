-- ============================================================
-- Migration: 013_fix_recorded_by_cascade.sql
-- Description: Allow staff accounts to be deleted without losing
--              walk-in payment records.
--
-- Problem: walk_in_payments.recorded_by is NOT NULL with no ON DELETE
--          rule, so deleting a receptionist/staff member who has
--          recorded payments fails with a FK violation.
--
-- Fix: Make recorded_by nullable + set ON DELETE SET NULL.
--      Payment records are preserved; recorded_by becomes NULL
--      when the staff member's account is deleted.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Drop the existing FK constraint
ALTER TABLE walk_in_payments
  DROP CONSTRAINT IF EXISTS walk_in_payments_recorded_by_fkey;

-- Step 2: Make the column nullable (so SET NULL can work)
ALTER TABLE walk_in_payments
  ALTER COLUMN recorded_by DROP NOT NULL;

-- Step 3: Re-add the FK with ON DELETE SET NULL
ALTER TABLE walk_in_payments
  ADD CONSTRAINT walk_in_payments_recorded_by_fkey
  FOREIGN KEY (recorded_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- ── VERIFY ──────────────────────────────────────────────────
-- SELECT conname, confdeltype
-- FROM pg_constraint
-- WHERE conrelid = 'walk_in_payments'::regclass
-- AND conname = 'walk_in_payments_recorded_by_fkey';
-- Expected: confdeltype = 'n' (SET NULL)
