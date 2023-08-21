-- Item links table DROP TABLE item_links
CREATE TABLE item_links (
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  list_id TEXT NOT NULL,
  group_id UUID NOT NULL,
  child_list boolean NOT NULL,
  realtime TEXT GENERATED ALWAYS AS ((group_id::TEXT || '.' || user_id::TEXT || (CASE WHEN child_list = true THEN ( '_' || list_id) else '' end) )) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (user_id, item_id, list_id, group_id),
  
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
alter publication supabase_realtime add table item_links;

-- Function to insert into item_links on insert to items_lists
CREATE OR REPLACE FUNCTION insert_item_links_on_items_lists_insert() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO item_links (user_id, item_id, list_id, group_id, child_list)
  SELECT NEW.user_id, NEW.item_id, NEW.list_id, lists_groups.group_id, lists.child_list
  FROM lists_groups
  INNER JOIN lists on lists_groups.list_id = lists.id and lists.user_id = NEW.user_id
  WHERE lists_groups.list_id = NEW.list_id;
  
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
BEGIN
  INSERT INTO item_links (user_id, item_id, list_id, group_id, child_list) 
  SELECT NEW.user_id, items_lists.item_id, NEW.list_id, NEW.group_id, lists.child_list
  FROM items_lists
  INNER JOIN lists on items_lists.list_id = lists.id and lists.user_id = NEW.user_id
  WHERE items_lists.list_id = NEW.list_id;

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
  DELETE FROM item_links 
  WHERE item_id = OLD.item_id AND list_id = OLD.list_id;
  
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
BEGIN
  DELETE FROM item_links
  WHERE list_id = OLD.list_id AND group_id = OLD.group_id;
  
  RETURN OLD;
END; 
$$ LANGUAGE plpgsql;

-- Trigger on delete from lists_groups
CREATE TRIGGER delete_item_links_on_lists_groups_delete
AFTER DELETE ON lists_groups
FOR EACH ROW EXECUTE PROCEDURE delete_item_links_on_lists_groups_delete();

-- Function to update updated_at on update to items
CREATE OR REPLACE FUNCTION update_item_links_on_items_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE item_links SET updated_at = NOW() 
  WHERE item_id = NEW.id;
  
  RETURN NEW;  
END;
$$ LANGUAGE plpgsql;

-- Trigger on update to items
CREATE TRIGGER update_item_links_on_items_update
AFTER UPDATE ON items
FOR EACH ROW EXECUTE PROCEDURE update_item_links_on_items_update();

-- Enable realtime on item_links
ALTER PUBLICATION supabase_realtime ADD TABLE item_links;
