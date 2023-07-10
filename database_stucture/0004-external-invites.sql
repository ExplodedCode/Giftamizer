--
-- External Invites table
CREATE TABLE IF NOT EXISTS public.external_invites
(
  invite_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL,
  email character varying NOT NULL,
  owner boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
	
  PRIMARY KEY (invite_id, group_id, email),

	CONSTRAINT external_invites_group_id_fkey FOREIGN KEY (group_id)
    REFERENCES public.groups (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
);

alter table external_invites enable row level security;

create policy "Any can view invites"
  ON external_invites
  FOR SELECT USING (
    true
  );
create policy "Owners can add invites"
  on external_invites for insert
  TO authenticated 
  WITH CHECK (
    is_group_owner(group_id, auth.uid())
  );
create policy "Owners can modify invites & permissions"
  on external_invites for update
  TO authenticated 
  using (
    exists (
      select 1 from group_members
      where group_members.user_id = auth.uid() AND group_members.group_id = group_id
    )
  )
  WITH CHECK (
	  is_group_owner(group_id, auth.uid())
  );
create policy "Owner can delete invites"
  on external_invites for delete
  TO authenticated 
  USING (
	  is_group_owner(group_id, auth.uid())
  )