-- ============================================================
-- 016_student_flags.sql
-- Receptionist flags a student record for owner review.
-- Used when the receptionist notices a data error but
-- cannot fix it themselves (edit access will be removed).
-- ============================================================

CREATE TABLE student_flags (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which walk-in payment record (the student registration) is flagged
  payment_id   uuid        NOT NULL REFERENCES walk_in_payments(id) ON DELETE CASCADE,

  -- Who flagged it and what the issue is
  flagged_by   uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  message      text        NOT NULL,

  -- Resolution
  status       text        NOT NULL DEFAULT 'open'
               CHECK (status IN ('open', 'resolved')),
  resolved_by  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at  timestamptz,

  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON student_flags (payment_id);
CREATE INDEX ON student_flags (status);
CREATE INDEX ON student_flags (flagged_by);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE student_flags ENABLE ROW LEVEL SECURITY;

-- Receptionist: insert and read their own flags
CREATE POLICY "receptionist_insert_flag"
  ON student_flags FOR INSERT
  WITH CHECK (
    flagged_by = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'receptionist')
  );

CREATE POLICY "receptionist_read_own_flags"
  ON student_flags FOR SELECT
  USING (
    flagged_by = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'receptionist')
  );

-- Owner / admin: full access (read all, resolve)
CREATE POLICY "owner_all_flags"
  ON student_flags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );
