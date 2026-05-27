ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS supplier_master JSONB;

COMMENT ON COLUMN suppliers.supplier_master IS
  'Extended supplier profile: Farm/Betrieb, Geo/EUDR, Compliance, Trust, Risk — stored as JSONB';
