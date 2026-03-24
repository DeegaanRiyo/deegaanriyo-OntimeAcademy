-- ============================================================
-- Migration: 003_profiles_members.sql
-- Description: Creates `profiles` (all users) and `members`
--              (co-working members — extends profiles).
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── PROFILES ────────────────────────────────────────────────
-- One row per authenticated user, linked to auth.users.
-- Created automatically on sign-up via trigger (see bottom).

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  role        text NOT NULL DEFAULT 'student'
              CHECK (role IN ('owner', 'admin', 'teacher', 'student', 'member')),

  full_name   text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  phone       text,
  avatar_url  text,

  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_own_read"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_own_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Authenticated users (admin/owner) can read all profiles
-- Full role-based policies added in 007_rls_policies.sql
CREATE POLICY "profiles_auth_read_all"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');


-- ── AUTO-CREATE PROFILE ON SIGN-UP ──────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── MEMBERS ─────────────────────────────────────────────────
-- Extends profiles for co-working space members.
-- A member row is created by admin when a member is added.

CREATE TABLE IF NOT EXISTS members (
  id                  uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  slug                text UNIQUE NOT NULL,  -- e.g. "jane-kamau"

  profession          text,
  bio                 text,
  portfolio_url       text,
  linkedin_url        text,
  twitter_url         text,

  -- Visibility
  is_public           boolean NOT NULL DEFAULT true,

  -- Subscription
  subscription_start  date,
  subscription_end    date,
  is_active           boolean NOT NULL DEFAULT true,

  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Public can read members who are public AND active
CREATE POLICY "members_public_read"
  ON members FOR SELECT
  USING (is_public = true AND is_active = true);

-- Authenticated users can read all members
CREATE POLICY "members_auth_read_all"
  ON members FOR SELECT
  USING (auth.role() = 'authenticated');

-- Members can update their own row
CREATE POLICY "members_own_update"
  ON members FOR UPDATE
  USING (auth.uid() = id);


-- ── VERIFY ──────────────────────────────────────────────────
-- SELECT id, slug, profession, is_public, is_active, subscription_end FROM members;
