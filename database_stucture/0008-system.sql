-- User roles table DROP TABLE user_roles
CREATE TABLE user_roles (
  user_id UUID NOT NULL,
  roles TEXT[] NOT NULL,
  
  PRIMARY KEY (user_id),
    
  FOREIGN KEY (user_id)
    REFERENCES profiles(user_id)
    ON DELETE CASCADE  
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;


CREATE OR REPLACE FUNCTION is_admin (userid UUID)
RETURNS BOOL AS $$
BEGIN
  PERFORM FROM user_roles where user_id = userid AND array_to_string(roles, ',') like '%admin%';
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY definer;

CREATE POLICY "Users can view own user role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_user_roles_change() 
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
	UPDATE profiles SET updated_at = NOW() WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSE
	UPDATE profiles SET updated_at = NOW() WHERE user_id = OLD.user_id;
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_roles_change
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW EXECUTE PROCEDURE public.handle_user_roles_change();


-- System table DROP TABLE system
CREATE TABLE system (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  maintenance boolean DEFAULT false NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,

  PRIMARY KEY (id),
  
  FOREIGN KEY (updated_by) REFERENCES profiles(user_id)
);

create policy "Any one can view system"
  on system for select
  using ( true );

create policy "Admins can insert system"
  ON system FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
  );

create policy "Admins can modify system"
  on system for update
  TO authenticated 
  using (
    is_admin(auth.uid())
  );

CREATE OR REPLACE FUNCTION system_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_updated
BEFORE UPDATE ON system
FOR EACH ROW EXECUTE PROCEDURE system_updated();