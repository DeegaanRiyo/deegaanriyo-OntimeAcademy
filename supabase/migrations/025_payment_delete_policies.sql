-- ============================================================
-- Migration: 025_payment_delete_policies.sql
--
-- Adds DELETE policies on payment tables.
-- RLS is enabled on these tables but had no DELETE policies,
-- so service-client deletes were silently blocked (0 rows, no error).
-- Auth check is done in the route handler — USING (true) is correct.
-- ============================================================

CREATE POLICY "owner_delete_booking_payments"
  ON public.booking_payments FOR DELETE
  USING (true);

CREATE POLICY "owner_delete_membership_payments"
  ON public.membership_payments FOR DELETE
  USING (true);
