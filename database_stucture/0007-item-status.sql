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

CREATE POLICY "Allow insert items_status if user in group"
  ON items_status FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM group_members
      JOIN lists_groups ON lists_groups.group_id = group_members.group_id
      JOIN items_lists ON items_lists.list_id = lists_groups.list_id
      WHERE 
        group_members.user_id = auth.uid() 
        AND items_lists.item_id = items_status.item_id
    )
  );
  
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
