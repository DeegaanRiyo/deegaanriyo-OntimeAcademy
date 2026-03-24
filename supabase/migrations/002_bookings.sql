-- ============================================================
-- Migration: 002_bookings.sql
-- Description: Creates the `bookings` table for space booking
--              submissions from the public website.
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which space was booked
  space_id        uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,

  -- Guest info (not linked to auth — public booking form)
  visitor_name    text NOT NULL,
  visitor_email   text,                    -- optional
  visitor_phone   text NOT NULL,

  -- Booking details
  booking_date    date NOT NULL,
  start_time      time NOT NULL,
  hours           integer NOT NULL CHECK (hours BETWEEN 1 AND 9),

  -- Estimated cost (KES, NULL if rate unknown)
  estimated_cost  integer,

  -- Admin workflow
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),

  notes           text,  -- optional message from the booker

  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (public booking form)
CREATE POLICY "bookings_public_insert"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Only authenticated users (admin/owner) can read/update bookings
-- Full role-based policies added in 007_rls_policies.sql
CREATE POLICY "bookings_auth_read"
  ON bookings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "bookings_auth_update"
  ON bookings FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ── VERIFY ──────────────────────────────────────────────────
-- SELECT id, visitor_name, visitor_phone, space_id, booking_date, status FROM bookings;
