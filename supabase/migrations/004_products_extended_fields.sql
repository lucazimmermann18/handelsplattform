-- Extend products table with fields for all 5 new product management areas
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS eudr_status          TEXT,
  ADD COLUMN IF NOT EXISTS eudr_category        TEXT,
  ADD COLUMN IF NOT EXISTS product_certs        JSONB,
  ADD COLUMN IF NOT EXISTS import_restrictions  JSONB,
  ADD COLUMN IF NOT EXISTS packaging_spec       JSONB,
  ADD COLUMN IF NOT EXISTS storage_conditions   JSONB,
  ADD COLUMN IF NOT EXISTS origin_regions       JSONB,
  ADD COLUMN IF NOT EXISTS harvest_season       TEXT,
  ADD COLUMN IF NOT EXISTS linked_supplier_ids  TEXT[],
  ADD COLUMN IF NOT EXISTS market_prices        JSONB,
  ADD COLUMN IF NOT EXISTS default_incoterms    TEXT[],
  ADD COLUMN IF NOT EXISTS required_docs        JSONB;
