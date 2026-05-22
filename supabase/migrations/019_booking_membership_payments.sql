-- Migration 019: Replace walk_in_payments with purpose-specific tables
-- Run AFTER: NOTIFY pgrst, 'reload schema'; (to fix any active cache miss first)
--
-- Step 1: Create booking_payments (replaces walk_in_payments type='space_rental')
-- Step 2: Create membership_payments (replaces walk_in_payments type='membership')
-- Step 3: Migrate existing data from walk_in_payments into the new tables
-- Step 4: Rename walk_in_payments to _legacy_walk_in_payments (kept for audit)

-- ── 1. booking_payments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount       integer NOT NULL CHECK (amount >= 0),
  method       text NOT NULL CHECK (method IN ('cash', 'mpesa', 'bank_transfer')),
  reference    text,
  recorded_by  uuid NOT NULL REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
-- Inserts via service role only (API routes) — no direct client inserts needed.

-- Index for fast payment lookup by booking
CREATE INDEX IF NOT EXISTS booking_payments_booking_id_idx ON public.booking_payments (booking_id);

-- ── 2. membership_payments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.membership_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      integer NOT NULL CHECK (amount >= 0),
  method      text NOT NULL CHECK (method IN ('cash', 'mpesa', 'bank_transfer')),
  reference   text,
  recorded_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;
-- Inserts via service role only (API routes) — no direct client inserts needed.

-- Index for fast payment lookup by member
CREATE INDEX IF NOT EXISTS membership_payments_profile_id_idx ON public.membership_payments (profile_id);

-- ── 3. Migrate existing data (only if walk_in_payments exists) ───────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'walk_in_payments') THEN

    INSERT INTO public.booking_payments (id, booking_id, amount, method, reference, recorded_by, created_at)
    SELECT
      id, booking_id, COALESCE(amount, 0),
      CASE WHEN method IN ('cash', 'mpesa', 'bank_transfer') THEN method ELSE 'cash' END,
      reference,
      COALESCE(recorded_by, (SELECT id FROM public.profiles WHERE role = 'owner' LIMIT 1)),
      created_at
    FROM public.walk_in_payments
    WHERE type = 'space_rental'
      AND booking_id IS NOT NULL
      AND booking_id IN (SELECT id FROM public.bookings)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.membership_payments (id, profile_id, amount, method, reference, recorded_by, created_at)
    SELECT
      id, profile_id, COALESCE(amount, 0),
      CASE WHEN method IN ('cash', 'mpesa', 'bank_transfer') THEN method ELSE 'cash' END,
      reference,
      COALESCE(recorded_by, (SELECT id FROM public.profiles WHERE role = 'owner' LIMIT 1)),
      created_at
    FROM public.walk_in_payments
    WHERE type = 'membership'
      AND profile_id IS NOT NULL
      AND profile_id IN (SELECT id FROM public.profiles)
    ON CONFLICT (id) DO NOTHING;

    ALTER TABLE public.walk_in_payments RENAME TO _legacy_walk_in_payments;

  END IF;
END $$;
