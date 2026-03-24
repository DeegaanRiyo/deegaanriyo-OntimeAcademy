-- ============================================================
-- Migration: 001_spaces.sql
-- Description: Creates the `spaces` table and seeds all 4
--              bookable spaces for Ontime Co-Working Space.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ── 1. ENUM: space availability is a simple boolean toggle ──
--    No enum needed — we use is_available (boolean).
--    Kept as a note for clarity.


-- ── 2. CREATE TABLE: spaces ─────────────────────────────────
CREATE TABLE IF NOT EXISTS spaces (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Display name shown on the website (e.g. "Boardroom")
  name         text NOT NULL,

  -- URL-friendly slug used in routes (e.g. /spaces/boardroom)
  slug         text NOT NULL UNIQUE,

  -- Full marketing description shown on the space detail page
  description  text,

  -- Hourly rate in KES — set by Owner via dashboard
  hourly_rate  integer NOT NULL DEFAULT 0,

  -- Open / Occupied toggle — Admin flips this from the dashboard
  -- Reflected immediately as badge on public space cards
  is_available boolean NOT NULL DEFAULT true,

  -- Array of Supabase Storage URLs for the photo gallery
  -- Populated later when the client uploads photos
  photos       text[] NOT NULL DEFAULT '{}',

  created_at   timestamptz NOT NULL DEFAULT now()
);


-- ── 3. ROW LEVEL SECURITY ────────────────────────────────────
--    Public can READ spaces (needed for the public website).
--    Only authenticated users with admin/owner role can write.
--    Full RLS policies for roles are added in a later migration
--    once the profiles table and roles are set up.

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated visitors) to read spaces
CREATE POLICY "spaces_public_read"
  ON spaces
  FOR SELECT
  USING (true);


-- ── 4. SEED DATA: 4 Bookable Spaces ─────────────────────────
--    NOTE: Conference Room, Podcast Studio, and Content Studio
--    are the SAME physical hall marketed under 3 distinct names.
--    Rates for the multipurpose hall are TBC — set to 0 for now.
--    Owner can update them via /dashboard/owner/settings.

INSERT INTO spaces (name, slug, description, hourly_rate, is_available, photos)
VALUES

  -- ── Boardroom ──────────────────────────────────────────────
  (
    'Boardroom',
    'boardroom',
    'Our compact, professional boardroom is perfect for executive meetings, client presentations, investor pitches, and focused team sessions. Equipped with a large TV, projector, and video conferencing setup in a quiet, private setting.',
    1000,   -- KES 1,000/hr (confirmed rate)
    true,
    '{}'    -- Photos to be added after client uploads assets
  ),

  -- ── Conference Room ────────────────────────────────────────
  (
    'Conference Room',
    'conference-room',
    'Our multipurpose hall configured in standard conference layout — seats up to 50 people. Ideal for training sessions, corporate seminars, product launches, team workshops, and large group events.',
    0,      -- Rate TBC — update via Owner dashboard
    true,
    '{}'
  ),

  -- ── Podcast Studio ─────────────────────────────────────────
  (
    'Podcast Studio',
    'podcast-studio',
    'The same multipurpose hall reconfigured into a professional podcast and recording studio. Set up with studio-grade microphones, cameras, and studio lighting — everything ready for your next episode, interview, or live stream.',
    0,      -- Rate TBC — update via Owner dashboard
    true,
    '{}'
  ),

  -- ── Content Studio ─────────────────────────────────────────
  (
    'Content Studio',
    'content-studio',
    'The multipurpose hall transformed into a full content creation studio. Green screen, professional backdrops, ring lights, and cameras — perfect for YouTube videos, brand shoots, product photography, and social media content.',
    0,      -- Rate TBC — update via Owner dashboard
    true,
    '{}'
  )

ON CONFLICT (slug) DO NOTHING;
-- ON CONFLICT: safe to re-run — won't duplicate rows if slug already exists


-- ── 5. VERIFY ───────────────────────────────────────────────
-- After running, confirm with:
--   SELECT id, name, slug, hourly_rate, is_available FROM spaces;
-- Expected: 4 rows — Boardroom, Conference Room, Podcast Studio, Content Studio
