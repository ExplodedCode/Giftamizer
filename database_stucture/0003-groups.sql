--
-- Group table
CREATE TABLE IF NOT EXISTS public.groups
(
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  image_token numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
create trigger handle_updated_at before update on groups
  for each row execute procedure moddatetime (updated_at);

--
-- Group membership table
CREATE TABLE IF NOT EXISTS public.group_members
(
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  owner boolean NOT NULL DEFAULT false,
  invite boolean NOT NULL DEFAULT true,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  update_token timestamp with time zone,
	
  PRIMARY KEY (group_id, user_id),

	CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id)
    REFERENCES public.groups (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE,
	CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles (user_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
);
create trigger handle_updated_at before update on group_members
  for each row execute procedure moddatetime (updated_at);


-- functions
CREATE OR REPLACE FUNCTION is_group_owner(
    _group_id UUID,
    _user_id UUID
) RETURNS BOOLEAN AS
$$
SELECT(
   SELECT owner FROM group_members WHERE group_members.group_id = _group_id AND group_members.user_id = _user_id
)
$$ LANGUAGE SQL SECURITY DEFINER;
CREATE OR REPLACE FUNCTION is_group_member(
    _group_id UUID,
    _user_id UUID
) RETURNS BOOLEAN AS
$$
SELECT(
  exists(
   SELECT 1 FROM group_members WHERE group_members.group_id = _group_id AND group_members.user_id = _user_id
  )
)
$$ LANGUAGE SQL SECURITY DEFINER;
-- prevent member from updating owner column
CREATE OR REPLACE FUNCTION is_not_updating_owner_field(
    _group_id UUID,
    _user_id UUID,
    _restricted_owner_field BOOLEAN
) RETURNS BOOLEAN AS
$$
WITH original_row AS (
    SELECT owner
    FROM group_members
    WHERE group_members.group_id = _group_id AND group_members.user_id = _user_id AND owner = true
)
SELECT(
    (SELECT owner FROM group_members WHERE group_members.group_id = _group_id AND group_members.user_id = _user_id) = _restricted_owner_field
)
$$ LANGUAGE SQL SECURITY DEFINER;

-- Set up Realtime
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table group_members;

--
-- Set up row level security
-- Groups
alter table groups enable row level security;
create policy "Anyone can create groups"
  on groups for insert
  TO authenticated 
  with check (true);
create policy "Members can view"
  on groups for select
  TO authenticated 
  using (
    exists (
      select 1 from group_members
      where group_members.user_id = auth.uid() AND group_members.group_id = groups.id
    )
  );
create policy "Owners can update groups."
  on groups for update
  TO authenticated 
  using (
    exists (
      select 1 from group_members
      where group_members.user_id = auth.uid() AND group_members.group_id = groups.id and group_members.owner = true
    )
  );
create policy "Owners can delete groups."
  on groups for delete
  TO authenticated 
  using (
    exists (
      select 1 from group_members
      where group_members.user_id = auth.uid() AND group_members.group_id = groups.id and group_members.owner = true
    )
  );

-- group_members
alter table group_members enable row level security;
create policy "Anyone can view memberships"
  on group_members for select
  TO authenticated 
  using ( is_group_member(group_id, auth.uid()) );
create policy "Owners can add members"
  on group_members for insert
  TO authenticated 
  WITH CHECK (
    exists (
      select 1 from group_members
      where group_members.user_id = auth.uid() AND group_members.group_id = group_id and group_members.owner = true
    )
  );
create policy "Owners can modify members & permissions / allow user to pin group"
  on group_members for update
  TO authenticated 
  using (
    exists (
      select 1 from group_members
      where group_members.user_id = auth.uid() AND group_members.group_id = group_id
    )
  )
  WITH CHECK (
	  is_not_updating_owner_field(
		  group_id,
		  user_id,
		  owner
	  ) OR is_group_owner(group_id, auth.uid())
  );
create policy "Owner can delete members or user can leave group"
  on group_members for delete
  TO authenticated 
  USING (
	  user_id = auth.uid()
	  OR
	  group_id IN (SELECT group_id FROM group_members WHERE group_members.group_id = group_id AND group_members.user_id = auth.uid() AND group_members.owner = true)
  )

-- Set up Storage
insert into storage.buckets (id, name)
values ('groups', 'groups');

CREATE POLICY "allow group image select"
  ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  USING (((bucket_id = 'groups'::text)
    AND 
    exists (
      select 1 from group_members
      where group_members.user_id = auth.uid() AND group_members.group_id = Cast(storage.filename(name) as uuid) AND group_members.owner = true
    )
   ));
CREATE POLICY "allow group image insert"
  ON storage.objects
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (((bucket_id = 'groups'::text) AND is_group_owner(Cast(storage.filename(name) as uuid), auth.uid()) ));
CREATE POLICY "allow group image update"
  ON storage.objects
  AS PERMISSIVE
  FOR UPDATE
  USING (((bucket_id = 'groups'::text)
    AND 
    exists (
      select 1 from group_members
      where group_members.user_id = auth.uid() AND group_members.group_id = Cast(storage.filename(name) as uuid) AND group_members.owner = true
    )
   ));
CREATE POLICY "allow group image delete"
  ON storage.objects
  AS PERMISSIVE
  FOR DELETE
  USING (((bucket_id = 'groups'::text)
    AND 
    exists (
      select 1 from group_members
      where group_members.user_id = auth.uid() AND group_members.group_id = Cast(storage.filename(name) as uuid) AND group_members.owner = true
    )
   ));

-- inserts a row into public.group_members when public.groups is created
create function public.handle_new_group()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, owner, invite)
  values (new.id, auth.uid(), true, false);
  return new;
end;
$$;
create trigger on_publish_group_created
  after insert on public.groups
  for each row execute procedure public.handle_new_group();

-- updates update_token when a row into public.group_members when public.groups is created
create function public.handle_group_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.group_members set update_token = NOW() where group_id = new.id;
  return new;
end;
$$;
create trigger on_group_update
  after update on public.groups
  for each row execute procedure public.handle_group_update();

-- send notification when user is added to group_members
create function public.handle_new_group_member()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  IF (SELECT count(*) FROM group_members where group_id = new.group_id) > 1 THEN
    insert into public.notifications (user_id, title, body, action, icon)
    values (new.user_id, 'New Group Invite!', 'You''ve been invited to join ' || (SELECT name FROM public.groups WHERE id = new.group_id) || '!', 'openInvite', 'GroupAdd');
  END IF;
  return new;
end;
$$;
create trigger on_group_members_insert
  after insert on public.group_members
  for each row execute procedure public.handle_new_group_member();

-- get groups that users is owner of without co-owners
CREATE FUNCTION public.get_groups_without_coowner(owner_id varchar)
RETURNS table(id uuid, name text, owner_count int)
LANGUAGE plpgsql
AS $$
	begin
		return query
      select cast(groups.id as uuid) as id, cast(groups.name as text),
        cast((select count(*) from group_members g where g.group_id = groups.id and g.owner = true AND g.user_id <> cast(owner_id as uuid)) as int) as owner_count
      from group_members inner join groups on groups.id = group_members.group_id
      where user_id = cast(owner_id as uuid) AND owner = true AND 
        (select count(*) from group_members g where g.group_id= groups.id and g.owner = true AND g.user_id <> cast(owner_id as uuid)) = 0;
	end;
$$;