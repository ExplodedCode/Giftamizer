CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA "extensions";

-- Set auth.users.email unique
ALTER TABLE auth.users ADD UNIQUE (email);