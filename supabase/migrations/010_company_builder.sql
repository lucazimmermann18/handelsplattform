-- Migration 010: Company Builder — Gründungs- und Aufbaunavigation

CREATE TABLE IF NOT EXISTS company_profile (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name                  TEXT,
  trade_name                  TEXT,
  legal_form                  TEXT,
  business_model              TEXT,
  business_purpose            TEXT,
  current_phase               TEXT        NOT NULL DEFAULT 'idee',
  eori_number                 TEXT,
  tax_number                  TEXT,
  vat_id                      TEXT,
  commercial_register_number  TEXT,
  founding_date               DATE,
  managing_directors          TEXT,
  website                     TEXT,
  notes                       TEXT,
  profile_data                JSONB,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS setup_tasks (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section           TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  description       TEXT,
  why_important     TEXT,
  required          BOOLEAN     NOT NULL DEFAULT true,
  priority          TEXT        NOT NULL DEFAULT 'mittel',
  phase             TEXT        NOT NULL DEFAULT 'gruendung',
  status            TEXT        NOT NULL DEFAULT 'open',
  owner             TEXT,
  due_date          DATE,
  blocker_go_live   BOOLEAN     NOT NULL DEFAULT false,
  blocker_first_deal BOOLEAN    NOT NULL DEFAULT false,
  evidence_required TEXT,
  evidence_notes    TEXT,
  doc_quality       TEXT        NOT NULL DEFAULT 'ungeprüft',
  external_advisor  TEXT,
  notes             TEXT,
  sort_order        INTEGER     DEFAULT 0,
  task_data         JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS setup_tasks_section_idx  ON setup_tasks(section);
CREATE INDEX IF NOT EXISTS setup_tasks_status_idx   ON setup_tasks(status);
CREATE INDEX IF NOT EXISTS setup_tasks_priority_idx ON setup_tasks(priority);

COMMENT ON TABLE company_profile IS 'Single-row company configuration and founding status.';
COMMENT ON TABLE setup_tasks     IS 'Company Builder aufbau checklist — each task covers one founding/operational step.';
