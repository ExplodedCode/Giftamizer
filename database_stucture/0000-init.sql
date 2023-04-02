-- Set auth.users.email unique
ALTER TABLE auth.users ADD UNIQUE (email);
