-- Strategy: OKR tables
CREATE TABLE IF NOT EXISTS okrs (
  id        text PRIMARY KEY DEFAULT 'O-' || upper(substring(gen_random_uuid()::text, 1, 6)),
  title     text NOT NULL,
  why       text NOT NULL DEFAULT '',
  owner     text NOT NULL DEFAULT '',
  quarter   text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS key_results (
  id         text PRIMARY KEY DEFAULT 'KR-' || upper(substring(gen_random_uuid()::text, 1, 6)),
  okr_id     text NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  text       text NOT NULL,
  cur        numeric NOT NULL DEFAULT 0,
  target     numeric NOT NULL DEFAULT 100,
  unit       text NOT NULL DEFAULT '%',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Compliance Roadmap: certifications
CREATE TABLE IF NOT EXISTS certifications (
  id               serial PRIMARY KEY,
  name             text NOT NULL,
  scope            text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'planned',
  valid_until      text,
  start_date       text,
  completion_date  text,
  cost             text,
  progress         int,
  priority         text NOT NULL DEFAULT 'medium',
  rationale        text NOT NULL DEFAULT '',
  blocker          text,
  sort_order       int DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- Regulations watch
CREATE TABLE IF NOT EXISTS regulations (
  id         serial PRIMARY KEY,
  code       text NOT NULL,
  title      text NOT NULL,
  products   text NOT NULL DEFAULT '',
  deadline   text NOT NULL DEFAULT '',
  phase      text NOT NULL DEFAULT 'future',
  impact     text NOT NULL DEFAULT 'medium',
  readiness  int NOT NULL DEFAULT 0,
  action     text NOT NULL DEFAULT '',
  cost       text NOT NULL DEFAULT '',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='okrs' AND policyname='auth users') THEN
    CREATE POLICY "auth users" ON okrs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='key_results' AND policyname='auth users') THEN
    CREATE POLICY "auth users" ON key_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certifications' AND policyname='auth users') THEN
    CREATE POLICY "auth users" ON certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='regulations' AND policyname='auth users') THEN
    CREATE POLICY "auth users" ON regulations FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
