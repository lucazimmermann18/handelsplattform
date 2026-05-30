-- Migration 013: Team Workspace — meetings, notes, action items, updates, profiles

-- ─── PROFILES (mirrors auth.users for assignment UI) ─────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY,  -- = auth.users.id
  email         TEXT        UNIQUE NOT NULL,
  display_name  TEXT        NOT NULL DEFAULT '',
  role          TEXT        NOT NULL DEFAULT 'member',
  avatar_color  TEXT        NOT NULL DEFAULT '#2d6a4f',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create/update profile on auth user sign-in
CREATE OR REPLACE FUNCTION handle_auth_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_color)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    '#' || lpad(to_hex(floor(random() * 16777215)::int), 6, '0')
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    updated_at   = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_profile();

-- ─── TEAM MEETINGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_meetings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  meeting_type     TEXT        NOT NULL DEFAULT 'other',
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER     NOT NULL DEFAULT 60,
  location         TEXT,
  attendee_ids     UUID[]      NOT NULL DEFAULT '{}',
  agenda           TEXT,
  status           TEXT        NOT NULL DEFAULT 'planned',
  created_by       UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS team_meetings_scheduled_idx ON team_meetings(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS team_meetings_status_idx    ON team_meetings(status);

-- ─── MEETING NOTES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID        NOT NULL REFERENCES team_meetings(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL DEFAULT '',
  decisions   TEXT[]      NOT NULL DEFAULT '{}',
  updated_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meeting_notes_meeting_idx ON meeting_notes(meeting_id);

-- ─── ACTION ITEMS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS action_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID        REFERENCES team_meetings(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  assignee_id UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  due_date    DATE,
  priority    TEXT        NOT NULL DEFAULT 'medium',
  status      TEXT        NOT NULL DEFAULT 'open',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS action_items_status_idx   ON action_items(status);
CREATE INDEX IF NOT EXISTS action_items_assignee_idx ON action_items(assignee_id);
CREATE INDEX IF NOT EXISTS action_items_meeting_idx  ON action_items(meeting_id);

-- ─── ACTION ITEM UPDATES (documentation thread) ───────────────────────────────
CREATE TABLE IF NOT EXISTS action_item_updates (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id UUID        NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  content        TEXT        NOT NULL,
  author_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  author_name    TEXT        NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS action_item_updates_item_idx ON action_item_updates(action_item_id);

-- ─── RLS (allow all for now — same as rest of app) ────────────────────────────
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_meetings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_item_updates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles'            AND policyname='profiles_all')            THEN CREATE POLICY profiles_all            ON profiles            FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_meetings'       AND policyname='team_meetings_all')       THEN CREATE POLICY team_meetings_all       ON team_meetings       FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meeting_notes'       AND policyname='meeting_notes_all')       THEN CREATE POLICY meeting_notes_all       ON meeting_notes       FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='action_items'        AND policyname='action_items_all')        THEN CREATE POLICY action_items_all        ON action_items        FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='action_item_updates' AND policyname='action_item_updates_all') THEN CREATE POLICY action_item_updates_all ON action_item_updates FOR ALL USING (true); END IF;
END $$;

COMMENT ON TABLE profiles            IS 'User profiles synced from auth.users — used for meeting attendees and task assignment.';
COMMENT ON TABLE team_meetings       IS 'Team meeting appointments with agenda and attendees.';
COMMENT ON TABLE meeting_notes       IS 'One set of notes + decisions per meeting (upserted).';
COMMENT ON TABLE action_items        IS 'Tasks/action items — linked to meetings or standalone — with Kanban status.';
COMMENT ON TABLE action_item_updates IS 'Documentation thread per action item — each update is a timestamped comment.';
