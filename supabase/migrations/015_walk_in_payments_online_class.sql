-- ============================================================
-- 015_walk_in_payments_online_class.sql
-- Add 'online_class' as a valid payment type so online students
-- are tracked separately from physical class students.
-- ============================================================
--
-- Before: type CHECK ('membership', 'physical_class', 'space_rental')
-- After:  type CHECK ('membership', 'physical_class', 'online_class', 'space_rental')
--
-- This allows manager/owner dashboards to report Physical Class
-- and Online Class revenue independently.
-- ============================================================

ALTER TABLE walk_in_payments
  DROP CONSTRAINT IF EXISTS walk_in_payments_type_check;

ALTER TABLE walk_in_payments
  ADD CONSTRAINT walk_in_payments_type_check
  CHECK (type IN ('membership', 'physical_class', 'online_class', 'space_rental'));
