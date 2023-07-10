--
-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles
(
  user_id uuid NOT NULL,
  email character varying NOT NULL,
  first_name character varying(255) NOT NULL,
  last_name character varying(255) NOT NULL,
  bio text NOT NULL DEFAULT ''::text,
  avatar_token numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_email_fkey FOREIGN KEY (email)
    REFERENCES auth.users (email) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
);
create trigger handle_updated_at before update on profiles
  for each row execute procedure moddatetime (updated_at);


create policy "Any one can view profiles"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = user_id );

-- get names from metadata
CREATE FUNCTION public.get_name_from_json(some_json json, outer_key text, fail_key text, split_index int)
RETURNS text AS $$
BEGIN
  IF (some_json->outer_key) IS NOT NULL THEN
  	RETURN (some_json ->> outer_key);
  ELSE
  	RETURN SPLIT_PART((some_json ->> fail_key), ' ', split_index);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- inserts a row into public.profiles when auth.users is created
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, first_name, last_name, created_at)
  values (new.id, new.email, 
		  (select get_name_from_json(cast(new.raw_user_meta_data as json), cast('first_name' as text), cast('name' as text), 1)), 
		  (select get_name_from_json(cast(new.raw_user_meta_data as json), cast('last_name' as text), cast('name' as text), 2)), 
		  new.created_at);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- user search autocomplete
CREATE FUNCTION public.search_profiles(user_search varchar)
RETURNS table(user_id uuid, email text, name text)
LANGUAGE plpgsql
AS $$
	begin
		return query
			SELECT cast(p.user_id as uuid), cast(p.email as text), cast(concat(p.first_name, p.last_name) as text)
			FROM profiles p 
			WHERE to_tsvector(concat(p.first_name, p.last_name)) @@ to_tsquery(user_search) OR p.email = user_search;
	end;
$$;

-- Set up Realtime
alter publication supabase_realtime add table profiles;

-- Set up Storage
insert into storage.buckets (id, name) values ('avatars', 'avatars');

CREATE POLICY "allow user select"
  ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  USING (((bucket_id = 'avatars'::text) AND (storage.filename(name) = (auth.uid())::text)));

CREATE POLICY "allow user insert"
  ON storage.objects
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (((bucket_id = 'avatars'::text) AND (storage.filename(name) = (auth.uid())::text)));

CREATE POLICY "allow user update"
  ON storage.objects
  AS PERMISSIVE
  FOR UPDATE
  USING (((bucket_id = 'avatars'::text) AND (storage.filename(name) = (auth.uid())::text)));

CREATE POLICY "allow user delete"
  ON storage.objects
  AS PERMISSIVE
  FOR DELETE
  USING (((bucket_id = 'avatars'::text) AND (storage.filename(name) = (auth.uid())::text)));

