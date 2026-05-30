-- Migration 014: Remove auth.users trigger that caused "Database error granting user" on login
-- The trigger is replaced by app-level profile upsert in TeamWorkspace on first open.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_auth_user_profile();
