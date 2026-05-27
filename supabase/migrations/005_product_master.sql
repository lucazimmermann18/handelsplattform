-- Product Master: extend products with type, status, and full JSONB master data block
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type   TEXT,
  ADD COLUMN IF NOT EXISTS product_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS product_master JSONB;

COMMENT ON COLUMN products.product_type   IS 'Produktart: Kaffee, Rohstoff, Lebensmittel, Textil, Industrieprodukt, etc.';
COMMENT ON COLUMN products.product_status IS 'draft | active | blocked | discontinued';
COMMENT ON COLUMN products.product_master IS 'Full PIM data: all 10 sections as a single JSONB object';
