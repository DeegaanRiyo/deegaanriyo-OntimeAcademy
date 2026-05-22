-- ============================================================
-- Migration: 024_soft_delete_bookings.sql
--
-- Adds soft-delete to bookings.
-- The DELETE button sets deleted_at instead of removing the row.
-- booking_payments are untouched → revenue is always preserved.
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
