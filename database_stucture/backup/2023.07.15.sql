--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1 (Ubuntu 15.1-1.pgdg20.04+1)
-- Dumped by pg_dump version 15.3

-- Started on 2023-07-15 16:24:18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 17 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3932 (class 0 OID 0)
-- Dependencies: 17
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 561 (class 1255 OID 17828)
-- Name: get_groups_without_coowner(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_groups_without_coowner(owner_id character varying) RETURNS TABLE(id uuid, name text, owner_count integer)
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


ALTER FUNCTION public.get_groups_without_coowner(owner_id character varying) OWNER TO postgres;

--
-- TOC entry 563 (class 1255 OID 18363)
-- Name: get_name_from_json(json, text, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_name_from_json(some_json json, outer_key text, fail_key text, split_index integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (some_json->outer_key) IS NOT NULL THEN
  	RETURN (some_json ->> outer_key);
  ELSE
  	RETURN SPLIT_PART((some_json ->> fail_key), ' ', split_index);
  END IF;
END;
$$;


ALTER FUNCTION public.get_name_from_json(some_json json, outer_key text, fail_key text, split_index integer) OWNER TO postgres;

--
-- TOC entry 566 (class 1255 OID 18619)
-- Name: handle_group_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_group_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update public.group_members set updated_at = NOW() where group_id = new.id;
  return new;
end;
$$;


ALTER FUNCTION public.handle_group_update() OWNER TO postgres;

--
-- TOC entry 513 (class 1255 OID 17646)
-- Name: handle_new_group(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_group() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.group_members (group_id, user_id, owner, invite)
  values (new.id, auth.uid(), true, false);
  return new;
end;
$$;


ALTER FUNCTION public.handle_new_group() OWNER TO postgres;

--
-- TOC entry 553 (class 1255 OID 18215)
-- Name: handle_new_group_member(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_group_member() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  IF (SELECT count(*) FROM group_members where group_id = new.group_id) > 1 THEN
    insert into public.notifications (user_id, title, body, action, icon)
    values (new.user_id, 'New Group Invite!', 'You''ve been invited to join ' || (SELECT name FROM public.groups WHERE id = new.group_id) || '!', 'openInvite', 'GroupAdd');
  END IF;
  return new;
end;
$$;


ALTER FUNCTION public.handle_new_group_member() OWNER TO postgres;

--
-- TOC entry 562 (class 1255 OID 18361)
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (user_id, email, first_name, last_name, created_at)
  values (new.id, new.email, 
		  (select get_name_from_json(cast(new.raw_user_meta_data as json), cast('first_name' as text), cast('name' as text), 1)), 
		  (select get_name_from_json(cast(new.raw_user_meta_data as json), cast('last_name' as text), cast('name' as text), 2)), 
		  new.created_at);
  return new;
end;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- TOC entry 559 (class 1255 OID 17611)
-- Name: is_group_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$
SELECT(
  exists(
   SELECT 1 FROM group_members WHERE group_members.group_id = _group_id AND group_members.user_id = _user_id
  )
)
$$;


ALTER FUNCTION public.is_group_member(_group_id uuid, _user_id uuid) OWNER TO postgres;

--
-- TOC entry 558 (class 1255 OID 17610)
-- Name: is_group_owner(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$
SELECT(
   SELECT owner FROM group_members WHERE group_members.group_id = _group_id AND group_members.user_id = _user_id
)
$$;


ALTER FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid) OWNER TO postgres;

--
-- TOC entry 560 (class 1255 OID 17612)
-- Name: is_not_updating_owner_field(uuid, uuid, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$
WITH original_row AS (
    SELECT owner
    FROM group_members
    WHERE group_members.group_id = _group_id AND group_members.user_id = _user_id AND owner = true
)
SELECT(
    (SELECT owner FROM group_members WHERE group_members.group_id = _group_id AND group_members.user_id = _user_id) = _restricted_owner_field
)
$$;


ALTER FUNCTION public.is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean) OWNER TO postgres;

--
-- TOC entry 564 (class 1255 OID 18500)
-- Name: search_profiles(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_profiles(user_search character varying) RETURNS TABLE(user_id uuid, email text, first_name text, last_name text)
    LANGUAGE plpgsql
    AS $$
	begin
		return query
			SELECT cast(p.user_id as uuid), cast(p.email as text), cast(p.first_name as text), cast(p.last_name as text)
			FROM profiles p 
			WHERE to_tsvector(concat(p.first_name, ' ', p.last_name)) @@ to_tsquery(user_search) OR p.email = user_search;
	end;
$$;


ALTER FUNCTION public.search_profiles(user_search character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 307 (class 1259 OID 18501)
-- Name: external_invites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.external_invites (
    group_id uuid NOT NULL,
    email character varying NOT NULL,
    invite_id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    owner boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.external_invites OWNER TO postgres;

--
-- TOC entry 301 (class 1259 OID 17587)
-- Name: group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_members (
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    owner boolean DEFAULT false NOT NULL,
    invite boolean DEFAULT true NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.group_members OWNER TO postgres;

--
-- TOC entry 300 (class 1259 OID 17576)
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    image_token numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- TOC entry 303 (class 1259 OID 18041)
-- Name: items; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    description text,
    url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.items OWNER TO supabase_admin;

--
-- TOC entry 305 (class 1259 OID 18071)
-- Name: items_lists; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.items_lists (
    item_id uuid NOT NULL,
    list_id uuid NOT NULL
);


ALTER TABLE public.items_lists OWNER TO supabase_admin;

--
-- TOC entry 304 (class 1259 OID 18056)
-- Name: lists; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.lists (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    child_list boolean DEFAULT false NOT NULL
);


ALTER TABLE public.lists OWNER TO supabase_admin;

--
-- TOC entry 306 (class 1259 OID 18086)
-- Name: lists_groups; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.lists_groups (
    list_id uuid NOT NULL,
    group_id uuid NOT NULL
);


ALTER TABLE public.lists_groups OWNER TO supabase_admin;

--
-- TOC entry 302 (class 1259 OID 17655)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    seen boolean DEFAULT false NOT NULL,
    icon text,
    action text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 17538)
-- Name: profiles; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    email character varying NOT NULL,
    first_name character varying(255) NOT NULL,
    bio text DEFAULT ''::text NOT NULL,
    avatar_token numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_name character varying,
    enable_lists boolean DEFAULT false NOT NULL
);


ALTER TABLE public.profiles OWNER TO supabase_admin;

--
-- TOC entry 3710 (class 2606 OID 18510)
-- Name: external_invites external_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_invites
    ADD CONSTRAINT external_invites_pkey PRIMARY KEY (group_id, email);


--
-- TOC entry 3698 (class 2606 OID 17598)
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id);


--
-- TOC entry 3696 (class 2606 OID 17585)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3706 (class 2606 OID 18075)
-- Name: items_lists items_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.items_lists
    ADD CONSTRAINT items_lists_pkey PRIMARY KEY (item_id, list_id);


--
-- TOC entry 3702 (class 2606 OID 18050)
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- TOC entry 3708 (class 2606 OID 18090)
-- Name: lists_groups lists_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.lists_groups
    ADD CONSTRAINT lists_groups_pkey PRIMARY KEY (list_id, group_id);


--
-- TOC entry 3704 (class 2606 OID 18065)
-- Name: lists lists_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_pkey PRIMARY KEY (id);


--
-- TOC entry 3700 (class 2606 OID 17664)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3694 (class 2606 OID 17547)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3726 (class 2620 OID 17609)
-- Name: group_members handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.group_members FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


--
-- TOC entry 3723 (class 2620 OID 17586)
-- Name: groups handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


--
-- TOC entry 3722 (class 2620 OID 17558)
-- Name: profiles handle_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


--
-- TOC entry 3727 (class 2620 OID 18216)
-- Name: group_members on_group_members_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_group_members_insert AFTER INSERT ON public.group_members FOR EACH ROW EXECUTE FUNCTION public.handle_new_group_member();


--
-- TOC entry 3724 (class 2620 OID 18620)
-- Name: groups on_group_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_group_update AFTER UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.handle_group_update();


--
-- TOC entry 3725 (class 2620 OID 17647)
-- Name: groups on_publish_group_created; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_publish_group_created AFTER INSERT ON public.groups FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();


--
-- TOC entry 3721 (class 2606 OID 18538)
-- Name: external_invites external_invites_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.external_invites
    ADD CONSTRAINT external_invites_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3713 (class 2606 OID 18589)
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3714 (class 2606 OID 18606)
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- TOC entry 3717 (class 2606 OID 18076)
-- Name: items_lists items_lists_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.items_lists
    ADD CONSTRAINT items_lists_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- TOC entry 3718 (class 2606 OID 18081)
-- Name: items_lists items_lists_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.items_lists
    ADD CONSTRAINT items_lists_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- TOC entry 3715 (class 2606 OID 18051)
-- Name: items items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- TOC entry 3719 (class 2606 OID 18096)
-- Name: lists_groups lists_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.lists_groups
    ADD CONSTRAINT lists_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3720 (class 2606 OID 18091)
-- Name: lists_groups lists_groups_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.lists_groups
    ADD CONSTRAINT lists_groups_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- TOC entry 3716 (class 2606 OID 18172)
-- Name: lists lists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- TOC entry 3711 (class 2606 OID 18396)
-- Name: profiles profiles_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_fkey FOREIGN KEY (email) REFERENCES auth.users(email) ON DELETE CASCADE;


--
-- TOC entry 3712 (class 2606 OID 18292)
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 3913 (class 3256 OID 18516)
-- Name: external_invites Any can view invites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Any can view invites" ON public.external_invites FOR SELECT USING (true);


--
-- TOC entry 3885 (class 3256 OID 17565)
-- Name: profiles Any one can view profiles; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Any one can view profiles" ON public.profiles FOR SELECT USING (true);


--
-- TOC entry 3888 (class 3256 OID 17615)
-- Name: groups Anyone can create groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (true);


--
-- TOC entry 3891 (class 3256 OID 17619)
-- Name: group_members Anyone can view memberships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view memberships" ON public.group_members FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));


--
-- TOC entry 3897 (class 3256 OID 18107)
-- Name: items Group members can select items; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Group members can select items" ON public.items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM ((public.items_lists
     JOIN public.lists_groups ON ((items_lists.list_id = lists_groups.list_id)))
     JOIN public.group_members ON ((group_members.group_id = lists_groups.group_id)))
  WHERE ((items_lists.item_id = items.id) AND (group_members.user_id = auth.uid())))));


--
-- TOC entry 3912 (class 3256 OID 18415)
-- Name: groups Members can view; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can view" ON public.groups FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.group_members
  WHERE ((group_members.user_id = auth.uid()) AND (group_members.group_id = groups.id)))) OR (NOT (EXISTS ( SELECT 1
   FROM public.group_members
  WHERE (group_members.group_id = groups.id))))));


--
-- TOC entry 3916 (class 3256 OID 18519)
-- Name: external_invites Owner can delete invites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owner can delete invites" ON public.external_invites FOR DELETE TO authenticated USING (public.is_group_owner(group_id, auth.uid()));


--
-- TOC entry 3894 (class 3256 OID 17622)
-- Name: group_members Owner can delete members or user can leave group; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owner can delete members or user can leave group" ON public.group_members FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR (group_id IN ( SELECT group_members_1.group_id
   FROM public.group_members group_members_1
  WHERE ((group_members_1.group_id = group_members_1.group_id) AND (group_members_1.user_id = auth.uid()) AND (group_members_1.owner = true))))));


--
-- TOC entry 3914 (class 3256 OID 18517)
-- Name: external_invites Owners can add invites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can add invites" ON public.external_invites FOR INSERT TO authenticated WITH CHECK (public.is_group_owner(group_id, auth.uid()));


--
-- TOC entry 3892 (class 3256 OID 17620)
-- Name: group_members Owners can add members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can add members" ON public.group_members FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.group_members group_members_1
  WHERE ((group_members_1.user_id = auth.uid()) AND (group_members_1.group_id = group_members_1.group_id) AND (group_members_1.owner = true)))));


--
-- TOC entry 3890 (class 3256 OID 17618)
-- Name: groups Owners can delete groups.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can delete groups." ON public.groups FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.group_members
  WHERE ((group_members.user_id = auth.uid()) AND (group_members.group_id = groups.id) AND (group_members.owner = true)))));


--
-- TOC entry 3915 (class 3256 OID 18518)
-- Name: external_invites Owners can modify invites & permissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can modify invites & permissions" ON public.external_invites FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.group_members
  WHERE ((group_members.user_id = auth.uid()) AND (group_members.group_id = group_members.group_id))))) WITH CHECK (public.is_group_owner(group_id, auth.uid()));


--
-- TOC entry 3893 (class 3256 OID 17621)
-- Name: group_members Owners can modify members & permissions / allow user to pin gro; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can modify members & permissions / allow user to pin gro" ON public.group_members FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.group_members group_members_1
  WHERE ((group_members_1.user_id = auth.uid()) AND (group_members_1.group_id = group_members_1.group_id))))) WITH CHECK ((public.is_not_updating_owner_field(group_id, user_id, owner) OR public.is_group_owner(group_id, auth.uid())));


--
-- TOC entry 3889 (class 3256 OID 17617)
-- Name: groups Owners can update groups.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can update groups." ON public.groups FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.group_members
  WHERE ((group_members.user_id = auth.uid()) AND (group_members.group_id = groups.id) AND (group_members.owner = true)))));


--
-- TOC entry 3899 (class 3256 OID 18116)
-- Name: items Users can add own items; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can add own items" ON public.items FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 3896 (class 3256 OID 18138)
-- Name: items_lists Users can add own items_lists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can add own items_lists" ON public.items_lists FOR INSERT TO authenticated WITH CHECK ((list_id IN ( SELECT lists.id
   FROM public.lists
  WHERE (lists.user_id = auth.uid()))));


--
-- TOC entry 3903 (class 3256 OID 18127)
-- Name: lists Users can add own lists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can add own lists" ON public.lists FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 3909 (class 3256 OID 18149)
-- Name: lists_groups Users can add own lists_groups; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can add own lists_groups" ON public.lists_groups FOR INSERT TO authenticated WITH CHECK ((list_id IN ( SELECT lists.id
   FROM public.lists
  WHERE (lists.user_id = auth.uid()))));


--
-- TOC entry 3901 (class 3256 OID 18118)
-- Name: items Users can delete own items; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete own items" ON public.items FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 3907 (class 3256 OID 18140)
-- Name: items_lists Users can delete own items_lists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete own items_lists" ON public.items_lists FOR DELETE TO authenticated USING ((list_id IN ( SELECT lists.id
   FROM public.lists
  WHERE (lists.user_id = auth.uid()))));


--
-- TOC entry 3905 (class 3256 OID 18129)
-- Name: lists Users can delete own lists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete own lists" ON public.lists FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 3911 (class 3256 OID 18151)
-- Name: lists_groups Users can delete own lists_groups; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete own lists_groups" ON public.lists_groups FOR DELETE TO authenticated USING ((list_id IN ( SELECT lists.id
   FROM public.lists
  WHERE (lists.user_id = auth.uid()))));


--
-- TOC entry 3886 (class 3256 OID 17566)
-- Name: profiles Users can insert their own profile.; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 3900 (class 3256 OID 18117)
-- Name: items Users can update own items; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update own items" ON public.items FOR UPDATE TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 3906 (class 3256 OID 18139)
-- Name: items_lists Users can update own items_lists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update own items_lists" ON public.items_lists FOR UPDATE TO authenticated USING ((list_id IN ( SELECT lists.id
   FROM public.lists
  WHERE (lists.user_id = auth.uid()))));


--
-- TOC entry 3904 (class 3256 OID 18128)
-- Name: lists Users can update own lists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update own lists" ON public.lists FOR UPDATE TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 3910 (class 3256 OID 18150)
-- Name: lists_groups Users can update own lists_groups; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update own lists_groups" ON public.lists_groups FOR UPDATE TO authenticated USING ((list_id IN ( SELECT lists.id
   FROM public.lists
  WHERE (lists.user_id = auth.uid()))));


--
-- TOC entry 3887 (class 3256 OID 17567)
-- Name: profiles Users can update own profile.; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- TOC entry 3898 (class 3256 OID 18115)
-- Name: items Users can view own items; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view own items" ON public.items FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 3895 (class 3256 OID 18137)
-- Name: items_lists Users can view own items_lists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view own items_lists" ON public.items_lists FOR SELECT TO authenticated USING ((list_id IN ( SELECT lists.id
   FROM public.lists
  WHERE (lists.user_id = auth.uid()))));


--
-- TOC entry 3902 (class 3256 OID 18126)
-- Name: lists Users can view own lists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view own lists" ON public.lists FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 3908 (class 3256 OID 18148)
-- Name: lists_groups Users can view own lists_groups; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view own lists_groups" ON public.lists_groups FOR SELECT TO authenticated USING ((list_id IN ( SELECT lists.id
   FROM public.lists
  WHERE (lists.user_id = auth.uid()))));


--
-- TOC entry 3884 (class 0 OID 18501)
-- Dependencies: 307
-- Name: external_invites; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.external_invites ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3879 (class 0 OID 17587)
-- Dependencies: 301
-- Name: group_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3878 (class 0 OID 17576)
-- Dependencies: 300
-- Name: groups; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3880 (class 0 OID 18041)
-- Dependencies: 303
-- Name: items; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3882 (class 0 OID 18071)
-- Dependencies: 305
-- Name: items_lists; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.items_lists ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3881 (class 0 OID 18056)
-- Dependencies: 304
-- Name: lists; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3883 (class 0 OID 18086)
-- Dependencies: 306
-- Name: lists_groups; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.lists_groups ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3877 (class 0 OID 17538)
-- Dependencies: 299
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3933 (class 0 OID 0)
-- Dependencies: 17
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- TOC entry 3934 (class 0 OID 0)
-- Dependencies: 561
-- Name: FUNCTION get_groups_without_coowner(owner_id character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_groups_without_coowner(owner_id character varying) TO anon;
GRANT ALL ON FUNCTION public.get_groups_without_coowner(owner_id character varying) TO authenticated;
GRANT ALL ON FUNCTION public.get_groups_without_coowner(owner_id character varying) TO service_role;


--
-- TOC entry 3935 (class 0 OID 0)
-- Dependencies: 563
-- Name: FUNCTION get_name_from_json(some_json json, outer_key text, fail_key text, split_index integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_name_from_json(some_json json, outer_key text, fail_key text, split_index integer) TO anon;
GRANT ALL ON FUNCTION public.get_name_from_json(some_json json, outer_key text, fail_key text, split_index integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_name_from_json(some_json json, outer_key text, fail_key text, split_index integer) TO service_role;


--
-- TOC entry 3936 (class 0 OID 0)
-- Dependencies: 566
-- Name: FUNCTION handle_group_update(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_group_update() TO anon;
GRANT ALL ON FUNCTION public.handle_group_update() TO authenticated;
GRANT ALL ON FUNCTION public.handle_group_update() TO service_role;


--
-- TOC entry 3937 (class 0 OID 0)
-- Dependencies: 513
-- Name: FUNCTION handle_new_group(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_group() TO anon;
GRANT ALL ON FUNCTION public.handle_new_group() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_group() TO service_role;


--
-- TOC entry 3938 (class 0 OID 0)
-- Dependencies: 553
-- Name: FUNCTION handle_new_group_member(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_group_member() TO anon;
GRANT ALL ON FUNCTION public.handle_new_group_member() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_group_member() TO service_role;


--
-- TOC entry 3939 (class 0 OID 0)
-- Dependencies: 562
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- TOC entry 3940 (class 0 OID 0)
-- Dependencies: 559
-- Name: FUNCTION is_group_member(_group_id uuid, _user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_group_member(_group_id uuid, _user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_group_member(_group_id uuid, _user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_group_member(_group_id uuid, _user_id uuid) TO service_role;


--
-- TOC entry 3941 (class 0 OID 0)
-- Dependencies: 558
-- Name: FUNCTION is_group_owner(_group_id uuid, _user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid) TO service_role;


--
-- TOC entry 3942 (class 0 OID 0)
-- Dependencies: 560
-- Name: FUNCTION is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean) TO anon;
GRANT ALL ON FUNCTION public.is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean) TO authenticated;
GRANT ALL ON FUNCTION public.is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean) TO service_role;


--
-- TOC entry 3943 (class 0 OID 0)
-- Dependencies: 564
-- Name: FUNCTION search_profiles(user_search character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.search_profiles(user_search character varying) TO anon;
GRANT ALL ON FUNCTION public.search_profiles(user_search character varying) TO authenticated;
GRANT ALL ON FUNCTION public.search_profiles(user_search character varying) TO service_role;


--
-- TOC entry 3944 (class 0 OID 0)
-- Dependencies: 307
-- Name: TABLE external_invites; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.external_invites TO anon;
GRANT ALL ON TABLE public.external_invites TO authenticated;
GRANT ALL ON TABLE public.external_invites TO service_role;


--
-- TOC entry 3945 (class 0 OID 0)
-- Dependencies: 301
-- Name: TABLE group_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.group_members TO anon;
GRANT ALL ON TABLE public.group_members TO authenticated;
GRANT ALL ON TABLE public.group_members TO service_role;


--
-- TOC entry 3946 (class 0 OID 0)
-- Dependencies: 300
-- Name: TABLE groups; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.groups TO anon;
GRANT ALL ON TABLE public.groups TO authenticated;
GRANT ALL ON TABLE public.groups TO service_role;


--
-- TOC entry 3947 (class 0 OID 0)
-- Dependencies: 303
-- Name: TABLE items; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.items TO postgres;
GRANT ALL ON TABLE public.items TO anon;
GRANT ALL ON TABLE public.items TO authenticated;
GRANT ALL ON TABLE public.items TO service_role;


--
-- TOC entry 3948 (class 0 OID 0)
-- Dependencies: 305
-- Name: TABLE items_lists; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.items_lists TO postgres;
GRANT ALL ON TABLE public.items_lists TO anon;
GRANT ALL ON TABLE public.items_lists TO authenticated;
GRANT ALL ON TABLE public.items_lists TO service_role;


--
-- TOC entry 3949 (class 0 OID 0)
-- Dependencies: 304
-- Name: TABLE lists; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.lists TO postgres;
GRANT ALL ON TABLE public.lists TO anon;
GRANT ALL ON TABLE public.lists TO authenticated;
GRANT ALL ON TABLE public.lists TO service_role;


--
-- TOC entry 3950 (class 0 OID 0)
-- Dependencies: 306
-- Name: TABLE lists_groups; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.lists_groups TO postgres;
GRANT ALL ON TABLE public.lists_groups TO anon;
GRANT ALL ON TABLE public.lists_groups TO authenticated;
GRANT ALL ON TABLE public.lists_groups TO service_role;


--
-- TOC entry 3951 (class 0 OID 0)
-- Dependencies: 302
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- TOC entry 3952 (class 0 OID 0)
-- Dependencies: 299
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- TOC entry 2519 (class 826 OID 16453)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- TOC entry 2520 (class 826 OID 16454)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- TOC entry 2518 (class 826 OID 16452)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- TOC entry 2522 (class 826 OID 16456)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- TOC entry 2517 (class 826 OID 16451)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- TOC entry 2521 (class 826 OID 16455)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


-- Completed on 2023-07-15 16:24:18

--
-- PostgreSQL database dump complete
--

