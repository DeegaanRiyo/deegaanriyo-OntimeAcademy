-- Migration 028: Allow walk-in profiles without auth.users account
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Problem: profiles.id REFERENCES auth.users(id) — walk-in members/students
-- who don't have an email can't get a profile row because there's no auth account.
--
-- Fix: Drop the FK so profiles can exist independently of auth.users.
-- The on_auth_user_created trigger still auto-creates profiles for real signups.
-- Add DEFAULT gen_random_uuid() so walk-in inserts don't need to supply an id.

-- ── 1. Drop the FK constraint from profiles.id → auth.users(id) ─────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Also try the common auto-generated name
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_pkey_fkey;

-- ── 2. Add a default UUID so walk-in inserts work without providing id ───────
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
