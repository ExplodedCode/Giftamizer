CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  child_list boolean NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

CREATE TABLE items_lists (
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, list_id)
);

CREATE TABLE lists_groups (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, group_id)
);

--
-- items
alter table items enable row level security;
alter publication supabase_realtime add table items;

create policy "Users can view own items"
  on items for select
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can add own items"
  on items for insert
  TO authenticated 
  with check (user_id = auth.uid());
create policy "Users can update own items"
  on items for update
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can delete own items"
  on items for delete
  TO authenticated 
  using (user_id = auth.uid());

-- Allow group members to select items
CREATE POLICY "Group members can select items"
  ON items 
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM items_lists 
      INNER JOIN lists_groups ON items_lists.list_id = lists_groups.list_id
      INNER JOIN group_members ON group_members.group_id = lists_groups.group_id
      WHERE items_lists.item_id = items.id
        AND group_members.user_id = auth.uid()
    )
  );

--
-- lists
alter table lists enable row level security;
alter publication supabase_realtime add table lists;

create policy "Users can view own lists"
  on lists for select
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can add own lists"
  on lists for insert
  TO authenticated 
  with check (user_id = auth.uid());
create policy "Users can update own lists"
  on lists for update
  TO authenticated 
  using (user_id = auth.uid());
create policy "Users can delete own lists"
  on lists for delete
  TO authenticated 
  using (user_id = auth.uid());

--
-- items_lists
alter table items_lists enable row level security;
alter publication supabase_realtime add table items_lists;

create policy "Users can view own items_lists"
  on items_lists for select
  TO authenticated 
  using (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
create policy "Users can add own items_lists"
  on items_lists for insert
  TO authenticated 
  with check (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
create policy "Users can update own items_lists"
  on items_lists for update
  TO authenticated 
  using (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));  
create policy "Users can delete own items_lists"
  on items_lists for delete
  TO authenticated 
  using (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())); 

--
-- lists_groups
alter table lists_groups enable row level security;
alter publication supabase_realtime add table lists_groups;

create policy "Users can view own lists_groups"
  on lists_groups for select
  TO authenticated 
  using (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
create policy "Users can add own lists_groups"
  on lists_groups for insert
  TO authenticated 
  with check (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
create policy "Users can update own lists_groups"
  on lists_groups for update
  TO authenticated 
  using (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));  
create policy "Users can delete own lists_groups"
  on lists_groups for delete
  TO authenticated 
  using (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())); 