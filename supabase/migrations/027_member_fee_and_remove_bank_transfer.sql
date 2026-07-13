-- Migration 027: Add membership_fee to members + remove bank_transfer from payment methods
-- Run in: Supabase Dashboard → SQL Editor → New Query

-- ── 1. Add membership_fee column to members ─────────────────────────────────
-- Each member can have a different agreed monthly rate (VIP, negotiated, etc.)
-- Existing members default to 7500 (the previous fixed rate).

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS membership_fee integer NOT NULL DEFAULT 7500;

-- ── 2. Remove bank_transfer from membership_payments method CHECK ────────────
-- Drop the old constraint and re-create with only cash + mpesa.

ALTER TABLE public.membership_payments
  DROP CONSTRAINT IF EXISTS membership_payments_method_check;

ALTER TABLE public.membership_payments
  ADD CONSTRAINT membership_payments_method_check CHECK (method IN ('cash', 'mpesa'));

-- ── 3. Remove bank_transfer from booking_payments method CHECK ───────────────

ALTER TABLE public.booking_payments
  DROP CONSTRAINT IF EXISTS booking_payments_method_check;

ALTER TABLE public.booking_payments
  ADD CONSTRAINT booking_payments_method_check CHECK (method IN ('cash', 'mpesa'));
