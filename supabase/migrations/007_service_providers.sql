-- Migration 007: Service Providers & Partners table
-- Stores external service providers: forwarders, customs agents, labs, insurers,
-- warehouses, packers, banks, certifiers, consultants, quality inspectors, etc.

CREATE TABLE IF NOT EXISTS service_providers (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        TEXT        NOT NULL,
  display_name        TEXT,
  category            TEXT        NOT NULL DEFAULT 'Sonstige',
  subcategory         TEXT,
  country             TEXT        NOT NULL DEFAULT '',
  city                TEXT,
  region              TEXT,
  status              TEXT        NOT NULL DEFAULT 'lead',
  risk_level          TEXT        NOT NULL DEFAULT 'niedrig',
  criticality         TEXT        NOT NULL DEFAULT 'mittel',
  website             TEXT,
  tax_id              TEXT,
  registration_number TEXT,
  overall_rating      NUMERIC(3,1),
  notes               TEXT,
  provider_master     JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sp_category_idx   ON service_providers(category);
CREATE INDEX IF NOT EXISTS sp_status_idx     ON service_providers(status);
CREATE INDEX IF NOT EXISTS sp_risk_idx       ON service_providers(risk_level);
CREATE INDEX IF NOT EXISTS sp_country_idx    ON service_providers(country);

COMMENT ON TABLE service_providers IS
  'External service providers and operational partners in the export process.';

COMMENT ON COLUMN service_providers.provider_master IS
  'Extended provider profile: contacts, pricing, contracts, documents, risk, performance, communications, tasks — stored as JSONB';
