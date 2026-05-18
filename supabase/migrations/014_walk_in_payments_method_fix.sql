-- ============================================================
-- 014_walk_in_payments_method_fix.sql
-- Expand the method check constraint to include mpesa and both
-- ============================================================
--
-- Problem: The original constraint only allowed ('cash', 'bank_transfer').
-- The application also uses 'mpesa' (M-Pesa) and 'both' (split payments).
-- Any registration via M-Pesa or split payment was failing with a
-- constraint violation, leaving orphaned auth accounts and profiles
-- (member account created but payment not recorded).
--
-- Fix: Drop the old constraint and add a new one with all valid values.
-- ============================================================

ALTER TABLE walk_in_payments
  DROP CONSTRAINT IF EXISTS walk_in_payments_method_check;

ALTER TABLE walk_in_payments
  ADD CONSTRAINT walk_in_payments_method_check
  CHECK (method IN ('cash', 'mpesa', 'bank_transfer', 'both'));
