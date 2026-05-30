-- Migration 012: harvest_calendar — per-product-origin harvest & availability data

CREATE TABLE IF NOT EXISTS harvest_calendar (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         TEXT         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  origin_country     TEXT         NOT NULL,         -- 'ET','KE','UG','TZ','RW','OTHER'
  harvest_months     INTEGER[]    NOT NULL DEFAULT '{}',  -- e.g. ARRAY[11,12,1,2]
  processing_weeks   INTEGER      NOT NULL DEFAULT 4,
  export_start_month INTEGER      NOT NULL DEFAULT 1,   -- 1-12
  export_end_month   INTEGER      NOT NULL DEFAULT 3,   -- 1-12
  processing_types   TEXT[]       NOT NULL DEFAULT '{}', -- 'washed','natural','honey'
  typical_qty_mt     NUMERIC,
  price_index        JSONB,       -- {"1":100,"2":105,...} monthly price index vs base
  notes              TEXT,
  status             TEXT         NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ  DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS harvest_calendar_product_idx ON harvest_calendar(product_id);
CREATE INDEX IF NOT EXISTS harvest_calendar_origin_idx  ON harvest_calendar(origin_country);

-- RLS: all authenticated users can read; anyone can write (same as other tables in app)
ALTER TABLE harvest_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "harvest_calendar_select" ON harvest_calendar FOR SELECT USING (true);
CREATE POLICY "harvest_calendar_insert" ON harvest_calendar FOR INSERT WITH CHECK (true);
CREATE POLICY "harvest_calendar_update" ON harvest_calendar FOR UPDATE USING (true);
CREATE POLICY "harvest_calendar_delete" ON harvest_calendar FOR DELETE USING (true);

COMMENT ON TABLE harvest_calendar IS
  'Harvest windows, processing lead times and export availability per product and origin country.';
