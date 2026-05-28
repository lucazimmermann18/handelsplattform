-- ─────────────────────────────────────────────────────────────────────────────
-- EastAfrica Export OS — Initial Database Schema
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── REFERENCE / LOOKUP TABLES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ports (
  key     text PRIMARY KEY,     -- 'DAR', 'HAM', etc.
  code    text NOT NULL,        -- 'TZDAR', 'DEHAM', etc.
  name    text NOT NULL,
  country char(2) NOT NULL,
  lat     numeric,
  lng     numeric
);

CREATE TABLE IF NOT EXISTS vessels (
  idx       int PRIMARY KEY,    -- 0-based index (used by orders.vessel_idx)
  name      text NOT NULL,
  voyage    text,
  imo       text,
  operator  text
);

-- ─── CORE BUSINESS ENTITIES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS suppliers (
  id            text PRIMARY KEY,   -- 'SUP-018'
  name          text NOT NULL,
  type          text,
  country       char(2),
  region        text,
  city          text,
  contact       text,
  phone         text,
  email         text,
  whatsapp      text,
  language      text,
  capacity      text,
  tier          char(1),             -- 'A', 'B', 'C'
  score         numeric,
  rel           int,
  qual          int,
  comm          int,
  price         int,
  docs          int,
  risk          text,                -- 'niedrig', 'mittel', 'hoch'
  certs         jsonb DEFAULT '[]',
  products      jsonb DEFAULT '[]',  -- string array of product names
  last_delivery date,
  status        text DEFAULT 'aktiv',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyers (
  id        text PRIMARY KEY,   -- 'BUY-002'
  name      text NOT NULL,
  country   char(2),
  city      text,
  industry  text,
  contact   text,
  position  text,
  email     text,
  phone     text,
  website   text,
  interests jsonb DEFAULT '[]',
  moq       text,
  certs     jsonb DEFAULT '[]',
  terms     text,
  incoterm  text,
  rating    int,
  status    text DEFAULT 'aktiv',
  revenue   numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id              text PRIMARY KEY,   -- 'PRD-001'
  name            text NOT NULL,
  cat             text,
  origin          text,
  hs              text,
  unit            text,
  packaging       text,
  moq             text,
  buy_price       numeric,
  sell_price      numeric,
  margin          numeric,
  export_ready    boolean DEFAULT false,
  variants        jsonb DEFAULT '[]',
  certs           jsonb DEFAULT '[]',
  buyers_count    int DEFAULT 0,
  suppliers_count int DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id              text PRIMARY KEY,   -- 'ORD-2026-0144'
  buyer_id        text REFERENCES buyers(id),
  product_id      text REFERENCES products(id),
  supplier_id     text REFERENCES suppliers(id),
  product_variant text,
  qty             numeric NOT NULL,
  unit            text,
  batch           text,
  buy_price       numeric,
  sell_price      numeric,
  revenue         numeric,
  cost_goods      numeric,
  cost_logistics  numeric,
  cost_docs       numeric,
  profit          numeric,
  incoterm        text,
  port_load       text,              -- key like 'DAR'
  port_dest       text,              -- key like 'HAM'
  status          text,
  status_key      text,
  etd             date,
  eta             date,
  paid            numeric DEFAULT 0,
  progress_pct    int,
  problem         text,
  vessel_idx      int DEFAULT 0,
  responsible     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id           text PRIMARY KEY,   -- 'D-2026-0211'
  buyer_id     text REFERENCES buyers(id),
  product_id   text REFERENCES products(id),
  qty          numeric,
  target_price numeric,
  our_price    numeric,
  value        numeric,
  stage        text,
  prob         int,
  next_follow  date,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id          text PRIMARY KEY,   -- 'Q-2026-0094'
  buyer_id    text REFERENCES buyers(id),
  product_id  text REFERENCES products(id),
  qty         numeric,
  price       numeric,
  value       numeric,
  status      text DEFAULT 'draft',
  valid_until date,
  sent_at     date,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quality_checks (
  id             text PRIMARY KEY,   -- 'QC-2026-0078'
  batch          text,
  product        text,               -- product name for display
  supplier_id    text REFERENCES suppliers(id),
  check_date     date,
  moisture       text,
  purity         text,
  foreign_matter text,
  oil            text,
  cup            numeric,
  dry_matter     text,
  firmness       text,
  defects        text,
  temp           text,
  ph             text,
  microb         text,
  lab            text,
  inspector      text,
  status         text,
  grade          text,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id         text PRIMARY KEY,   -- 'DOC-04412'
  name       text NOT NULL,
  type       text,
  order_id   text REFERENCES orders(id),
  status     text,
  issued_at  date,
  expires_at date,
  file_size  text,
  file_url   text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id         text PRIMARY KEY,   -- 'T-9921'
  title      text NOT NULL,
  order_id   text REFERENCES orders(id),
  owner      text,
  priority   text,               -- 'hoch', 'mittel', 'niedrig'
  due_date   date,
  status     text DEFAULT 'offen',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaints (
  id         text PRIMARY KEY,   -- 'C-2026-0014'
  order_id   text REFERENCES orders(id),
  buyer_id   text REFERENCES buyers(id),
  category   text,
  severity   text,
  title      text,
  owner      text,
  status     text,
  opened_at  date,
  impact     text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product     text NOT NULL,
  product_id  text REFERENCES products(id),
  qty         numeric,
  unit        text,
  location    text,
  status      text,
  batch       text,
  received_at date,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sev        text,              -- 'r', 'w', 'i'
  title      text,
  message    text,
  kind       text,
  order_id   text REFERENCES orders(id),
  resolved   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rev_trend (
  id       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  month    text NOT NULL,       -- 'Jun', 'Jul', etc.
  expected numeric,
  actual   numeric,
  margin   numeric
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
-- All authenticated users have full access to all tables (team of 5)

ALTER TABLE ports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rev_trend      ENABLE ROW LEVEL SECURITY;

-- Read-only reference tables
DROP POLICY IF EXISTS "auth_read" ON ports;
DROP POLICY IF EXISTS "auth_read" ON vessels;
DROP POLICY IF EXISTS "auth_read" ON rev_trend;
CREATE POLICY "auth_read" ON ports     FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON vessels   FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON rev_trend FOR SELECT TO authenticated USING (true);

-- Full CRUD for all business tables
DROP POLICY IF EXISTS "auth_all" ON suppliers;
DROP POLICY IF EXISTS "auth_all" ON buyers;
DROP POLICY IF EXISTS "auth_all" ON products;
DROP POLICY IF EXISTS "auth_all" ON orders;
DROP POLICY IF EXISTS "auth_all" ON deals;
DROP POLICY IF EXISTS "auth_all" ON offers;
DROP POLICY IF EXISTS "auth_all" ON quality_checks;
DROP POLICY IF EXISTS "auth_all" ON documents;
DROP POLICY IF EXISTS "auth_all" ON tasks;
DROP POLICY IF EXISTS "auth_all" ON complaints;
DROP POLICY IF EXISTS "auth_all" ON inventory;
DROP POLICY IF EXISTS "auth_all" ON alerts;
DROP POLICY IF EXISTS "auth_all" ON rev_trend;
CREATE POLICY "auth_all" ON suppliers      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON buyers         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON products       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON orders         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON deals          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON offers         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON quality_checks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON documents      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON tasks          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON complaints     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON inventory      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON alerts         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON rev_trend      FOR ALL TO authenticated USING (true) WITH CHECK (true);
