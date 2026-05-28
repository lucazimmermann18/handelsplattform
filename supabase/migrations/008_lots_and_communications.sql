-- Migration 008: lots & communications tables

-- lots: Chargen- und Lot-Verwaltung (Rückverfolgbarkeit)
CREATE TABLE IF NOT EXISTS lots (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        TEXT        NOT NULL DEFAULT '',
  product_name      TEXT        NOT NULL DEFAULT '',
  supplier_id       TEXT        NOT NULL DEFAULT '',
  harvest_date      DATE,
  processing_date   DATE,
  qty               NUMERIC     NOT NULL DEFAULT 0,
  unit              TEXT        NOT NULL DEFAULT 'MT',
  grade             TEXT        NOT NULL DEFAULT 'A',
  moisture          TEXT,
  status            TEXT        NOT NULL DEFAULT 'available',
  cert_ref          TEXT,
  linked_order_ids  JSONB       NOT NULL DEFAULT '[]',
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lots_product_id_idx   ON lots(product_id);
CREATE INDEX IF NOT EXISTS lots_supplier_id_idx  ON lots(supplier_id);
CREATE INDEX IF NOT EXISTS lots_status_idx        ON lots(status);

-- communications: Kommunikationshistorie (Käufer & Lieferanten)
CREATE TABLE IF NOT EXISTS communications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   TEXT        NOT NULL DEFAULT '',
  contact_type TEXT        NOT NULL DEFAULT 'buyer',
  type         TEXT        NOT NULL DEFAULT 'note',
  direction    TEXT        NOT NULL DEFAULT 'internal',
  date         DATE        NOT NULL DEFAULT CURRENT_DATE,
  subject      TEXT        NOT NULL DEFAULT '',
  body         TEXT        NOT NULL DEFAULT '',
  author       TEXT        NOT NULL DEFAULT 'Admin',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comms_contact_id_idx ON communications(contact_id);
CREATE INDEX IF NOT EXISTS comms_date_idx        ON communications(date DESC);
