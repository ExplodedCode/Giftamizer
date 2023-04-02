--
-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications
(
	id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
	user_id uuid NOT NULL,
	title text NOT NULL,
	body text NOT NULL,
  seen boolean NOT NULL DEFAULT false,
	icon text,
	action text,
	created_at timestamp with time zone DEFAULT now(),
	
	
	CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles (user_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
)

-- Set up Realtime
alter publication supabase_realtime add table notifications;


-- Set up Security
alter table notifications enable row level security;

-- create policy "Any one can view profiles"
--   on profiles for select
--   using ( true );

-- create policy "Users can insert their own profile."
--   on profiles for insert
--   with check ( auth.uid() = user_id );

-- create policy "Users can update own profile."
--   on profiles for update
--   using ( auth.uid() = user_id );


-- Set up Storage

-- CREATE POLICY "allow user select"
--   ON storage.objects
--   AS PERMISSIVE
--   FOR SELECT
--   USING (((bucket_id = 'avatars'::text) AND (storage.filename(name) = (auth.uid())::text)));

-- CREATE POLICY "allow user insert"
--   ON storage.objects
--   AS PERMISSIVE
--   FOR INSERT
--   WITH CHECK (((bucket_id = 'avatars'::text) AND (storage.filename(name) = (auth.uid())::text)));

-- CREATE POLICY "allow user update"
--   ON storage.objects
--   AS PERMISSIVE
--   FOR UPDATE
--   USING (((bucket_id = 'avatars'::text) AND (storage.filename(name) = (auth.uid())::text)));

-- CREATE POLICY "allow user delete"
--   ON storage.objects
--   AS PERMISSIVE
--   FOR DELETE
--   USING (((bucket_id = 'avatars'::text) AND (storage.filename(name) = (auth.uid())::text)));

