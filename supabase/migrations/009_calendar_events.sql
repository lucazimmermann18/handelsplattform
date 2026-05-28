-- Migration 009: calendar_events table for custom team appointments

CREATE TABLE IF NOT EXISTS calendar_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  date         DATE        NOT NULL,
  end_date     DATE,
  type         TEXT        NOT NULL DEFAULT 'termin',
  color        TEXT,
  description  TEXT,
  owner        TEXT        NOT NULL DEFAULT 'Admin',
  linked_id    TEXT,
  linked_type  TEXT,
  all_day      BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON calendar_events(date);
CREATE INDEX IF NOT EXISTS calendar_events_type_idx ON calendar_events(type);

COMMENT ON TABLE calendar_events IS
  'Custom team appointments and deadlines visible to all users.';
