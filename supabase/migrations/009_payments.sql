-- ============================================================
-- Migration: 009_payments.sql
-- Description: Creates payments table for M-Pesa STK Push
--              course enrolment payments.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--              (run AFTER 005_enrolments_progress.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  student_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id               uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Amount in KES (integer — M-Pesa does not support decimals)
  amount                  integer NOT NULL,

  -- Phone in 254XXXXXXXXX format
  phone                   text NOT NULL,

  -- Daraja STK Push reference fields
  merchant_request_id     text,
  checkout_request_id     text UNIQUE,

  -- Filled on successful payment
  mpesa_receipt_number    text,

  -- pending → paid | failed | cancelled
  status                  text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),

  -- Human-readable failure reason from Daraja (e.g. "Request cancelled by user")
  failure_reason          text,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Students can read their own payment records
CREATE POLICY "payments_student_read_own"
  ON payments FOR SELECT
  USING (auth.uid() = student_id);

-- Admin / Owner can read all payments
CREATE POLICY "payments_admin_read"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

-- Inserts and updates are done server-side via service role (bypasses RLS).
-- No client-side INSERT/UPDATE policies needed.


-- ── VERIFY ──────────────────────────────────────────────────
-- SELECT id, student_id, course_id, amount, status, checkout_request_id FROM payments;
