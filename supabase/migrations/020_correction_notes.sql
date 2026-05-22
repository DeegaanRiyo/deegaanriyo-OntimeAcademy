-- Correction Notes: formal correction requests submitted by receptionist/manager
-- reviewed and resolved by owner/admin

CREATE TABLE IF NOT EXISTS correction_notes (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  record_type      text        NOT NULL,          -- 'booking' | 'student' | 'member' | 'payment'
  record_id        text        NOT NULL,
  record_label     text,
  note             text        NOT NULL,
  submitted_by     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  submitted_at     timestamptz DEFAULT now(),
  status           text        DEFAULT 'pending',  -- 'pending' | 'reviewed' | 'resolved'
  owner_response   text,
  reviewed_at      timestamptz,
  recorded_amount  numeric,
  correct_amount   numeric
);

-- Index for fast status filtering
CREATE INDEX IF NOT EXISTS correction_notes_status_idx ON correction_notes(status);
CREATE INDEX IF NOT EXISTS correction_notes_submitted_at_idx ON correction_notes(submitted_at DESC);
