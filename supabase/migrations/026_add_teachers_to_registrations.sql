-- Add teachers JSONB column to student_registrations
-- Stores an array of { name: string, subject: string }

ALTER TABLE student_registrations
  ADD COLUMN IF NOT EXISTS teachers JSONB DEFAULT NULL;
