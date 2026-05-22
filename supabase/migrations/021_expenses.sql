-- Expenses: manager-recorded business expenses, with optional owner approval flow

CREATE TABLE IF NOT EXISTS expenses (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title            text        NOT NULL,
  category         text        NOT NULL DEFAULT 'other',
  amount           numeric     NOT NULL CHECK (amount > 0),
  payment_method   text,
  reference        text,
  notes            text,
  recorded_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  recorded_at      timestamptz DEFAULT now(),
  status           text        NOT NULL DEFAULT 'issued',  -- 'pending' | 'approved' | 'rejected' | 'issued'
  requires_approval boolean    NOT NULL DEFAULT false,
  approved_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at      timestamptz,
  issued_at        timestamptz,
  rejection_reason text
);

-- Expenses >= KES 5,000 go through approval (requires_approval = true, status = 'pending')
-- Expenses < KES 5,000 are auto-issued (requires_approval = false, status = 'issued')

CREATE INDEX IF NOT EXISTS expenses_status_idx     ON expenses(status);
CREATE INDEX IF NOT EXISTS expenses_recorded_at_idx ON expenses(recorded_at DESC);
CREATE INDEX IF NOT EXISTS expenses_recorded_by_idx ON expenses(recorded_by);
