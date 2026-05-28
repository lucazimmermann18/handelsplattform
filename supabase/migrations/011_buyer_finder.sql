-- ── Buyer Finder: extend buyers table + new sub-tables ────────────────────────
-- Run without RLS in Supabase SQL Editor

-- Extend buyers with acquisition / pipeline fields
ALTER TABLE buyers
  ADD COLUMN IF NOT EXISTS pipeline_stage   text        DEFAULT 'recherchiert',
  ADD COLUMN IF NOT EXISTS priority         text        DEFAULT 'mittel',
  ADD COLUMN IF NOT EXISTS source           text,
  ADD COLUMN IF NOT EXISTS buyer_type       text,
  ADD COLUMN IF NOT EXISTS company_size     text,
  ADD COLUMN IF NOT EXISTS next_follow_up   date,
  ADD COLUMN IF NOT EXISTS next_action      text,
  ADD COLUMN IF NOT EXISTS fit_score        int         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commercial_score int         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_score int         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_score       int         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_volume text,
  ADD COLUMN IF NOT EXISTS buyer_master     jsonb       DEFAULT '{}';

-- Index on pipeline stage for fast kanban queries
CREATE INDEX IF NOT EXISTS buyers_pipeline_stage_idx ON buyers(pipeline_stage);
CREATE INDEX IF NOT EXISTS buyers_next_follow_up_idx ON buyers(next_follow_up);

-- ── Buyer Contacts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buyer_contacts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id          text        REFERENCES buyers(id) ON DELETE CASCADE,
  first_name        text,
  last_name         text        NOT NULL,
  role              text,
  department        text,
  email             text,
  phone             text,
  linkedin          text,
  language          text,
  decision_power    text        DEFAULT 'niedrig',
  preferred_channel text        DEFAULT 'email',
  contact_quality   text        DEFAULT 'unbekannt',
  last_contacted_at date,
  notes             text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS buyer_contacts_buyer_idx ON buyer_contacts(buyer_id);

-- ── Buyer Requirements ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buyer_requirements (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id          text        REFERENCES buyers(id) ON DELETE CASCADE,
  product_category  text,
  product_id        text,
  quality_notes     text,
  quantity_sample   text,
  quantity_first    text,
  quantity_monthly  text,
  target_price_min  numeric,
  target_price_max  numeric,
  currency          text        DEFAULT 'EUR',
  incoterm_pref     text,
  delivery_location text,
  payment_terms     text,
  cert_requirements jsonb       DEFAULT '[]',
  doc_requirements  jsonb       DEFAULT '[]',
  packaging_notes   text,
  other_notes       text,
  status            text        DEFAULT 'offen',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS buyer_requirements_buyer_idx ON buyer_requirements(buyer_id);

-- RLS (open — same policy as other tables)
ALTER TABLE buyer_contacts    DISABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_requirements DISABLE ROW LEVEL SECURITY;
