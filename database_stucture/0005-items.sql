CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  links array null,
  custom_fields jsonb null,
  archived boolean not null default false,
  deleted boolean not null default false,
  image_token numeric,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  fbid text null,
);
create trigger handle_updated_at before update on items
  for each row execute procedure moddatetime (updated_at);

CREATE TABLE lists (
  id TEXT DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  child_list boolean NOT NULL DEFAULT false,
  bio text,
  avatar_token numeric,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fbid text null,
  
  PRIMARY KEY (id, user_id)
);
CREATE TABLE items_lists (
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  list_id TEXT,
  user_id UUID,
  
  PRIMARY KEY (item_id, list_id, user_id),
  
  FOREIGN KEY (list_id, user_id) 
    REFERENCES lists(id, user_id)
    ON DELETE CASCADE
);
CREATE TABLE lists_groups (
  list_id TEXT,
  group_id UUID,
  user_id UUID,
  
  PRIMARY KEY (list_id, group_id, user_id),

  FOREIGN KEY (list_id, user_id) 
    REFERENCES lists(id, user_id)
    ON DELETE CASCADE,

  FOREIGN KEY (group_id)
    REFERENCES groups(id) 
    ON DELETE CASCADE
);

--
-- items
alter table items enable row level security;
alter publication supabase_realtime add table items;

create policy "Users can view own items"
  ON items for select
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can add own items"
  ON items for insert
  TO authenticated 
  with check (user_id = auth.uid());
create policy "Users can update own items"
  ON items for update
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can delete own items"
  ON items for delete
  TO authenticated 
  using (user_id = auth.uid());
-- Allow group members to select items
CREATE POLICY "Group members can select items"
  ON items for select
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE
        profiles.user_id = items.user_id
        AND profiles.enable_lists = false
    ) OR (
      EXISTS (
        SELECT 1 
        FROM group_members
        JOIN lists_groups ON lists_groups.group_id = group_members.group_id
        JOIN items_lists ON items_lists.list_id = lists_groups.list_id
        WHERE 
          group_members.user_id = auth.uid() 
          AND items_lists.item_id = items.id
      )
    )
  );


--
-- lists
alter table lists enable row level security;
alter publication supabase_realtime add table lists;

create policy "Users can view own lists"
  ON lists for select
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can add own lists"
  ON lists for insert
  TO authenticated 
  with check (user_id = auth.uid());
create policy "Users can update own lists"
  ON lists for update
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can delete own lists"
  ON lists for delete
  TO authenticated 
  using (user_id = auth.uid());
-- Allow group members to select lists
CREATE POLICY "Group members can select lists"
  ON lists for select
  USING (
    EXISTS (
      SELECT 1
      FROM group_members
      JOIN lists_groups ON lists_groups.group_id = group_members.group_id 
      WHERE 
        group_members.user_id = auth.uid()
        AND lists_groups.list_id = lists.id
    )
  );


--
-- items_lists
alter table items_lists enable row level security;
alter publication supabase_realtime add table items_lists;

create policy "Users can view own items_lists"
  on items_lists for select
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can add own items_lists"
  on items_lists for insert
  TO authenticated 
  with check (user_id = auth.uid());
create policy "Users can update own items_lists"
  on items_lists for update
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can delete own items_lists"
  on items_lists for delete
  TO authenticated 
  using (user_id = auth.uid());
-- Allow group members to select items_lists
CREATE POLICY "Group members can select items_lists"
  ON items_lists for select
  USING (
    EXISTS (
      SELECT 1 
      FROM group_members
      JOIN lists_groups ON lists_groups.group_id = group_members.group_id
      WHERE 
        group_members.user_id = auth.uid() 
        AND lists_groups.list_id = items_lists.list_id
    )
  );


--
-- lists_groups
alter table lists_groups enable row level security;
alter publication supabase_realtime add table lists_groups;

create policy "Users can view own lists_groups"
  on lists_groups for select
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can add own lists_groups"
  on lists_groups for insert
  TO authenticated 
  with check (user_id = auth.uid()); 
create policy "Users can update own lists_groups"
  on lists_groups for update
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can delete own lists_groups"
  on lists_groups for delete
  TO authenticated 
  using (user_id = auth.uid());
-- Allow group members to select lists_groups
CREATE POLICY "Group members can select lists_groups"
  ON lists_groups for select
  USING (
    EXISTS (
      SELECT 1 
      FROM group_members
      WHERE 
        group_members.user_id = auth.uid() 
        AND group_members.group_id = lists_groups.group_id
    )
  );