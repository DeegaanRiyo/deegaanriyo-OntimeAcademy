-- Soft-delete support for members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Backfill ghost profiles (have role=member but no members row)
INSERT INTO public.members (id, slug, is_active, is_public, membership_fee, subscription_days)
SELECT
  p.id,
  LOWER(REPLACE(p.full_name, ' ', '-')) || '-' || LEFT(p.id::text, 6),
  false,
  false,
  0,
  30
FROM profiles p
LEFT JOIN members m ON m.id = p.id
WHERE p.role = 'member' AND m.id IS NULL
ON CONFLICT (id) DO NOTHING;
