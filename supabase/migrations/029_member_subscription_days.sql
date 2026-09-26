-- Add subscription_days column so we know the original subscription duration
-- (used for renewals — defaults to 30 for existing members)
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS subscription_days integer NOT NULL DEFAULT 30;
