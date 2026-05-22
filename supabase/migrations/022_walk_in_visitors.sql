-- ============================================================
-- 022_walk_in_visitors.sql
-- Walk-in visitor / lead log for receptionist CRM tracking.
-- ============================================================

CREATE TABLE IF NOT EXISTS walk_in_visitors (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  name        text        NOT NULL,
  phone       text        NOT NULL,
  email       text,

  interest    text        NOT NULL DEFAULT 'general'
              CHECK (interest IN ('membership', 'space_rental', 'course', 'general')),

  notes       text,

  follow_up   text        NOT NULL DEFAULT 'pending'
              CHECK (follow_up IN ('pending', 'contacted', 'converted', 'not_interested')),

  recorded_by uuid        REFERENCES profiles(id) ON DELETE SET NULL,

  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS walk_in_visitors_follow_up_idx  ON walk_in_visitors (follow_up);
CREATE INDEX IF NOT EXISTS walk_in_visitors_created_at_idx ON walk_in_visitors (created_at DESC);

-- RLS
ALTER TABLE walk_in_visitors ENABLE ROW LEVEL SECURITY;

-- Receptionist: full access to all visitors (shared reception log)
CREATE POLICY "receptionist_all_visitors"
  ON walk_in_visitors FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('receptionist', 'admin', 'owner', 'manager'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('receptionist', 'admin', 'owner', 'manager'))
  );
