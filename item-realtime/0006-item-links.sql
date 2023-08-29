-- Item links table DROP TABLE item_links
CREATE TABLE item_links (
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  group_id UUID NOT NULL,
  list_id TEXT,
  realtime TEXT GENERATED ALWAYS AS ((group_id::TEXT || '.' || user_id::TEXT || (CASE WHEN list_id IS NOT NULL THEN ( '_' || list_id) else '' end) )) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (user_id, item_id, realtime),
  
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
alter publication supabase_realtime add table item_links;
alter table item_links replica identity full;




-- Function to insert into item_links on insert to items
CREATE OR REPLACE FUNCTION insert_item_links_on_items_insert() 
RETURNS TRIGGER AS $$
DECLARE 
  enable_lists boolean;
BEGIN
  SELECT profiles.enable_lists INTO enable_lists FROM profiles WHERE profiles.user_id = NEW.user_id;
  
  IF enable_lists = false THEN
	INSERT INTO item_links (user_id, item_id, list_id, group_id) 
	SELECT NEW.user_id, items.id, NULL, groups.id FROM groups
	INNER JOIN group_members ON group_members.group_id = groups.id AND group_members.user_id = NEW.user_id
	LEFT JOIN items ON items.user_id = NEW.user_id 
	WHERE items.id = NEW.id ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert to items_lists
CREATE TRIGGER insert_item_links_on_items_insert
AFTER INSERT ON items
FOR EACH ROW EXECUTE PROCEDURE insert_item_links_on_items_insert();




-- Function to insert into item_links on insert to items_lists
CREATE OR REPLACE FUNCTION insert_item_links_on_items_lists_insert() 
RETURNS TRIGGER AS $$
DECLARE 
  enable_lists boolean;
  child_list boolean;
BEGIN
  SELECT profiles.enable_lists INTO enable_lists FROM profiles WHERE profiles.user_id = NEW.user_id;

  SELECT lists.child_list INTO child_list FROM lists WHERE lists.id = NEW.list_id AND lists.user_id = NEW.user_id;
  IF child_list = true THEN
    DELETE FROM item_links WHERE item_id = NEW.item_id;
  ELSE 
    DELETE FROM item_links WHERE list_id IS NOT NULL;
  END IF;
  
  IF enable_lists = true THEN
    INSERT INTO item_links (user_id, item_id, list_id, group_id)
    SELECT NEW.user_id, NEW.item_id, (CASE WHEN lists.child_list = true THEN NEW.list_id else NULL end), lists_groups.group_id
    FROM lists_groups
    INNER JOIN lists on lists_groups.list_id = lists.id and lists.user_id = NEW.user_id
    WHERE lists_groups.list_id = NEW.list_id ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert to items_lists
CREATE TRIGGER insert_item_links_on_items_lists_insert
AFTER INSERT ON items_lists
FOR EACH ROW EXECUTE PROCEDURE insert_item_links_on_items_lists_insert();





-- Function to insert into item_links on insert to lists_groups
CREATE OR REPLACE FUNCTION insert_item_links_on_lists_groups_insert()
RETURNS TRIGGER AS $$
DECLARE 
  enable_lists boolean;
BEGIN
  SELECT profiles.enable_lists INTO enable_lists FROM profiles WHERE profiles.user_id = NEW.user_id;

  IF enable_lists = true THEN
    INSERT INTO item_links (user_id, item_id, list_id, group_id) 
    SELECT NEW.user_id, items_lists.item_id, (CASE WHEN lists.child_list = true THEN NEW.list_id else NULL end), NEW.group_id
    FROM items_lists
    INNER JOIN lists on items_lists.list_id = lists.id and lists.user_id = NEW.user_id
    WHERE items_lists.list_id = NEW.list_id ON CONFLICT DO NOTHING;
  END IF;
	
  RETURN NEW;  
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert to lists_groups
CREATE TRIGGER insert_item_links_on_lists_groups_insert
AFTER INSERT ON lists_groups
FOR EACH ROW EXECUTE PROCEDURE insert_item_links_on_lists_groups_insert();






-- Function to delete from item_links on delete from items_lists
CREATE OR REPLACE FUNCTION delete_item_links_on_items_lists_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM items_lists il
    JOIN lists_groups lg ON lg.list_id = il.list_id
    WHERE il.item_id = OLD.item_id
    AND lg.group_id = (
      SELECT lg.group_id 
      FROM lists_groups lg
      WHERE lg.list_id = OLD.list_id
    )
  ) THEN
    DELETE FROM item_links 
    WHERE item_id = OLD.item_id
    AND group_id = (
      SELECT lg.group_id
      FROM lists_groups lg 
      WHERE lg.list_id = OLD.list_id
    );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger on delete from items_lists
CREATE TRIGGER delete_item_links_on_items_lists_delete
AFTER DELETE ON items_lists
FOR EACH ROW EXECUTE PROCEDURE delete_item_links_on_items_lists_delete();






-- Function to delete from item_links on delete from lists_groups
CREATE OR REPLACE FUNCTION delete_item_links_on_lists_groups_delete()
RETURNS TRIGGER AS $$
DECLARE
  item_row record;
BEGIN

  FOR item_row IN 
    SELECT items.id, count(lists_groups.group_id) as assigned, lists.child_list FROM items
    LEFT JOIN items_lists ON items_lists.item_id = items.id
    LEFT JOIN lists_groups ON lists_groups.list_id = items_lists.list_id
    INNER JOIN lists ON lists.id = items_lists.list_id AND lists.user_id = items.user_id
    WHERE lists_groups.group_id = OLD.group_id
    GROUP BY items.id, lists_groups.group_id, lists.child_list
  LOOP
    IF item_row.child_list = true THEN
      DELETE FROM item_links WHERE list_id IS NOT NULL AND group_id = OLD.group_id;
    ELSIF item_row.assigned = 1 THEN
      DELETE FROM item_links WHERE list_id IS NULL AND group_id = OLD.group_id;
    END IF;
  END LOOP;

  RETURN OLD;

END; 
$$ LANGUAGE plpgsql;

-- Trigger on delete from lists_groups
CREATE TRIGGER delete_item_links_on_lists_groups_delete
BEFORE DELETE ON lists_groups
FOR EACH ROW EXECUTE PROCEDURE delete_item_links_on_lists_groups_delete();







-- Function to update updated_at on update to items
CREATE OR REPLACE FUNCTION update_item_links_on_items_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE item_links SET updated_at = NOW() WHERE item_id = NEW.id;
  
  RETURN NEW;  
END;
$$ LANGUAGE plpgsql;

-- Trigger on update to items
CREATE TRIGGER update_item_links_on_items_update
AFTER UPDATE ON items
FOR EACH ROW EXECUTE PROCEDURE update_item_links_on_items_update();







-- Function to replace all item_links on profiles => enable_lists change
CREATE OR REPLACE FUNCTION update_item_links_on_profiles_enable_lists_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.enable_lists <> NEW.enable_lists THEN
    DELETE FROM item_links WHERE user_id = NEW.user_id;
	
    IF NEW.enable_lists = true THEN
      INSERT INTO item_links (user_id, item_id, list_id, group_id) 
      SELECT NEW.user_id, items.id as item_id, (CASE WHEN lists.child_list = true THEN lists.id else NULL end) as list_id, groups.id as group_id FROM groups
      INNER JOIN group_members on group_members.group_id = groups.id AND group_members.user_id = NEW.user_id
      LEFT JOIN lists_groups ON lists_groups.group_id = groups.id AND lists_groups.user_id = NEW.user_id
      LEFT JOIN items_lists ON items_lists.list_id = lists_groups.list_id AND items_lists.user_id = NEW.user_id
      INNER JOIN lists ON lists.id = items_lists.list_id AND lists.user_id = NEW.user_id
      INNER JOIN items ON items.id = items_lists.item_id ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO item_links (user_id, item_id, list_id, group_id) 
      SELECT NEW.user_id, items.id, NULL, groups.id FROM groups
      INNER JOIN group_members ON group_members.group_id = groups.id AND group_members.user_id = NEW.user_id
      LEFT JOIN items ON items.user_id = NEW.user_id ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;  
END;
$$ LANGUAGE plpgsql;

-- Trigger on update to profiles
CREATE TRIGGER update_item_links_on_profiles_enable_lists_update
AFTER UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_item_links_on_profiles_enable_lists_update();


