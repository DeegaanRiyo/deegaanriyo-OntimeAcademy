-- ============================================================
-- Migration: 023_booking_delete_fix.sql
--
-- 1. Change booking_payments FK from CASCADE → SET NULL
--    so deleting a booking KEEPS the payment records.
--    Revenue in the overview is preserved even after deletion.
--
-- 2. Add explicit DELETE RLS policies on bookings and
--    booking_payments so that authenticated staff can delete
--    even if the service-role key isn't bypassing RLS.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Change booking_payments.booking_id FK to ON DELETE SET NULL ────────────
--    This keeps payment records (and their amounts) in the table
--    when a booking is deleted — so overview revenue stays accurate.

ALTER TABLE public.booking_payments
  DROP CONSTRAINT IF EXISTS booking_payments_booking_id_fkey;

ALTER TABLE public.booking_payments
  ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE public.booking_payments
  ADD CONSTRAINT booking_payments_booking_id_fkey
  FOREIGN KEY (booking_id)
  REFERENCES public.bookings(id)
  ON DELETE SET NULL;

-- ── 2. DELETE policy on bookings ──────────────────────────────────────────────
DROP POLICY IF EXISTS "bookings_staff_delete" ON public.bookings;
CREATE POLICY "bookings_staff_delete"
  ON public.bookings FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND get_my_role() IN ('owner', 'admin', 'manager', 'receptionist')
  );

-- ── 3. DELETE policy on booking_payments ──────────────────────────────────────
DROP POLICY IF EXISTS "booking_payments_staff_delete" ON public.booking_payments;
CREATE POLICY "booking_payments_staff_delete"
  ON public.booking_payments FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND get_my_role() IN ('owner', 'admin', 'manager', 'receptionist')
  );

-- ── 4. Also add SELECT / INSERT policies on booking_payments if missing ────────
DROP POLICY IF EXISTS "booking_payments_staff_read" ON public.booking_payments;
CREATE POLICY "booking_payments_staff_read"
  ON public.booking_payments FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND get_my_role() IN ('owner', 'admin', 'manager', 'receptionist')
  );

DROP POLICY IF EXISTS "booking_payments_staff_insert" ON public.booking_payments;
CREATE POLICY "booking_payments_staff_insert"
  ON public.booking_payments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND get_my_role() IN ('owner', 'admin', 'manager', 'receptionist')
  );
