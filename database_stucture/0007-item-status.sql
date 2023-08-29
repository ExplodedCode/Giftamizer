-- Item status table DROP TABLE items_status
CREATE TABLE items_status (
  item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL,
  
  PRIMARY KEY (item_id),
  
  FOREIGN KEY (item_id) 
    REFERENCES items(id)
    ON DELETE CASCADE,
    
  FOREIGN KEY (user_id)
    REFERENCES profiles(user_id)
    ON DELETE CASCADE  
);
ALTER TABLE items_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert if can claim item"
  ON items_status FOR INSERT
  WITH CHECK (can_claim_item(auth.uid(), item_id));

CREATE POLICY "Allow update items_status row"
  ON items_status FOR UPDATE
  USING (user_id = auth.uid());
  
CREATE POLICY "Allow delete items_status row"
  ON items_status FOR DELETE
  USING (user_id = auth.uid() OR auth.uid() <> (SELECT user_id FROM items WHERE id = item_id));

CREATE POLICY "Do not allow item owner to view items_status"
  ON items_status FOR SELECT
  USING (auth.uid() <> (
    SELECT user_id 
    FROM items
    WHERE id = item_id
  ) AND (EXISTS (
      SELECT 1 
      FROM group_members
      JOIN lists_groups ON lists_groups.group_id = group_members.group_id
      JOIN items_lists ON items_lists.list_id = lists_groups.list_id
      WHERE 
        group_members.user_id = auth.uid() 
        AND items_lists.item_id = items_status.item_id
    ))
  );


CREATE OR REPLACE FUNCTION can_claim_item (userid UUID, itemid UUID)
RETURNS BOOL AS $$
DECLARE 
  item_row record;
  enable_lists boolean;
BEGIN
  SELECT * INTO item_row FROM items WHERE items.id = itemid;
  SELECT profiles.enable_lists INTO enable_lists FROM profiles WHERE profiles.user_id = item_row.user_id;
  
  IF item_row IS NULL OR item_row.user_id = userid THEN
    RETURN false;
  END IF;

  IF enable_lists = true THEN
    RETURN EXISTS (
      SELECT 1
      FROM group_members gm
      JOIN lists_groups lg ON lg.group_id = gm.group_id 
      JOIN items_lists il ON il.list_id = lg.list_id
      WHERE 
        gm.user_id = userid
        AND il.item_id = itemid
        AND lg.user_id = (SELECT user_id FROM items WHERE id = itemid)
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE 
        gm1.user_id = userid
        AND gm2.user_id = (SELECT user_id FROM items WHERE id = itemid) AND gm2.invite = false
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- update item updated_at
CREATE OR REPLACE FUNCTION public.handle_items_status_change() 
RETURNS trigger
SECURITY DEFINER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE items SET updated_at = NOW() WHERE id = NEW.item_id;
    RETURN NEW;
  ELSE
    UPDATE items SET updated_at = NOW() WHERE id = OLD.item_id;
    RETURN NEW;
  END IF;

END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_items_status_change
AFTER INSERT OR UPDATE OR DELETE ON items_status
FOR EACH ROW EXECUTE PROCEDURE public.handle_items_status_change();