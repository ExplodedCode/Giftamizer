--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1 (Debian 15.1-1.pgdg110+1)
-- Dumped by pg_dump version 15.1

-- Started on 2023-03-28 13:39:22

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
-- TOC entry 14 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3840 (class 0 OID 0)
-- Dependencies: 14
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 534 (class 1255 OID 17481)
-- Name: handle_group_member_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_group_member_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update public.group_members set update_token = NOW() where group_id = new.id;
  return new;
end;
$$;


ALTER FUNCTION public.handle_group_member_change() OWNER TO postgres;

--
-- TOC entry 535 (class 1255 OID 17486)
-- Name: handle_group_member_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_group_member_delete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update public.group_members set update_token = NOW() where group_id = old.id;
  return old;
end;
$$;


ALTER FUNCTION public.handle_group_member_delete() OWNER TO postgres;

--
-- TOC entry 531 (class 1255 OID 17455)
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
-- TOC entry 533 (class 1255 OID 17412)
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$begin
  insert into public.profiles (user_id, email, name, created_at)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name', new.created_at);
  return new;
end;$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- TOC entry 537 (class 1255 OID 17517)
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
-- TOC entry 538 (class 1255 OID 17514)
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
-- TOC entry 536 (class 1255 OID 17501)
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
-- TOC entry 530 (class 1255 OID 17414)
-- Name: search_profiles(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_profiles(user_search character varying) RETURNS TABLE(user_id uuid, email text, name text)
    LANGUAGE plpgsql
    AS $$
	begin
		return query
			SELECT cast(p.user_id as uuid), cast(p.email as text), cast(p.name as text)
			FROM profiles p 
			WHERE to_tsvector(p.name) @@ to_tsquery(user_search) OR p.email = user_search;
	end;
$$;


ALTER FUNCTION public.search_profiles(user_search character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 287 (class 1259 OID 17428)
-- Name: group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_members (
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    owner boolean DEFAULT false NOT NULL,
    invite boolean DEFAULT false NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    update_token timestamp with time zone
);


ALTER TABLE public.group_members OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 17420)
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    image_token numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 17391)
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    email character varying NOT NULL,
    name character varying(255) NOT NULL,
    avatar_token character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- TOC entry 3660 (class 2606 OID 17434)
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id);


--
-- TOC entry 3658 (class 2606 OID 17427)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3656 (class 2606 OID 17398)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3668 (class 2620 OID 17470)
-- Name: group_members handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.group_members FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


--
-- TOC entry 3666 (class 2620 OID 17467)
-- Name: groups handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


--
-- TOC entry 3665 (class 2620 OID 17472)
-- Name: profiles handle_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


--
-- TOC entry 3667 (class 2620 OID 17456)
-- Name: groups on_publish_group_created; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_publish_group_created AFTER INSERT ON public.groups FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();


--
-- TOC entry 3663 (class 2606 OID 17435)
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3664 (class 2606 OID 17440)
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- TOC entry 3661 (class 2606 OID 17399)
-- Name: profiles profiles_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_fkey FOREIGN KEY (email) REFERENCES auth.users(email) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3662 (class 2606 OID 17404)
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 3820 (class 3256 OID 17409)
-- Name: profiles Any one can view profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Any one can view profiles" ON public.profiles FOR SELECT USING (true);


--
-- TOC entry 3823 (class 3256 OID 17447)
-- Name: groups Anyone can create groups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (true);


--
-- TOC entry 3830 (class 3256 OID 17518)
-- Name: group_members Anyone can view memberships; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view memberships" ON public.group_members FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));


--
-- TOC entry 3824 (class 3256 OID 17448)
-- Name: groups Members can view; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can view" ON public.groups FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.group_members
  WHERE ((group_members.user_id = auth.uid()) AND (group_members.group_id = groups.id)))));


--
-- TOC entry 3828 (class 3256 OID 17512)
-- Name: group_members Owner can delete members or user leave; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owner can delete members or user leave" ON public.group_members FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR (group_id IN ( SELECT group_members_1.group_id
   FROM public.group_members group_members_1
  WHERE ((group_members_1.group_id = group_members_1.group_id) AND (group_members_1.user_id = auth.uid()) AND (group_members_1.owner = true))))));


--
-- TOC entry 3827 (class 3256 OID 17492)
-- Name: group_members Owners can add members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can add members" ON public.group_members FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.group_members group_members_1
  WHERE ((group_members_1.user_id = auth.uid()) AND (group_members_1.group_id = group_members_1.group_id) AND (group_members_1.owner = true)))));


--
-- TOC entry 3826 (class 3256 OID 17450)
-- Name: groups Owners can delete groups.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can delete groups." ON public.groups FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.group_members
  WHERE ((group_members.user_id = auth.uid()) AND (group_members.group_id = groups.id) AND (group_members.owner = true)))));


--
-- TOC entry 3829 (class 3256 OID 17516)
-- Name: group_members Owners can modify members / prevent member from modifing owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can modify members / prevent member from modifing owner" ON public.group_members FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.group_members group_members_1
  WHERE ((group_members_1.user_id = auth.uid()) AND (group_members_1.group_id = group_members_1.group_id))))) WITH CHECK ((public.is_not_updating_owner_field(group_id, user_id, owner) OR public.is_group_owner(group_id, auth.uid())));


--
-- TOC entry 3825 (class 3256 OID 17449)
-- Name: groups Owners can update groups.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can update groups." ON public.groups FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.group_members
  WHERE ((group_members.user_id = auth.uid()) AND (group_members.group_id = groups.id) AND (group_members.owner = true)))));


--
-- TOC entry 3821 (class 3256 OID 17410)
-- Name: profiles Users can insert their own profile.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- TOC entry 3822 (class 3256 OID 17411)
-- Name: profiles Users can update own profile.; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- TOC entry 3819 (class 0 OID 17428)
-- Dependencies: 287
-- Name: group_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3818 (class 0 OID 17420)
-- Dependencies: 286
-- Name: groups; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3817 (class 0 OID 17391)
-- Dependencies: 285
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3841 (class 0 OID 0)
-- Dependencies: 14
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- TOC entry 3842 (class 0 OID 0)
-- Dependencies: 534
-- Name: FUNCTION handle_group_member_change(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_group_member_change() TO anon;
GRANT ALL ON FUNCTION public.handle_group_member_change() TO authenticated;
GRANT ALL ON FUNCTION public.handle_group_member_change() TO service_role;


--
-- TOC entry 3843 (class 0 OID 0)
-- Dependencies: 535
-- Name: FUNCTION handle_group_member_delete(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_group_member_delete() TO anon;
GRANT ALL ON FUNCTION public.handle_group_member_delete() TO authenticated;
GRANT ALL ON FUNCTION public.handle_group_member_delete() TO service_role;


--
-- TOC entry 3844 (class 0 OID 0)
-- Dependencies: 531
-- Name: FUNCTION handle_new_group(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_group() TO anon;
GRANT ALL ON FUNCTION public.handle_new_group() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_group() TO service_role;


--
-- TOC entry 3845 (class 0 OID 0)
-- Dependencies: 533
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- TOC entry 3846 (class 0 OID 0)
-- Dependencies: 537
-- Name: FUNCTION is_group_member(_group_id uuid, _user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_group_member(_group_id uuid, _user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_group_member(_group_id uuid, _user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_group_member(_group_id uuid, _user_id uuid) TO service_role;


--
-- TOC entry 3847 (class 0 OID 0)
-- Dependencies: 538
-- Name: FUNCTION is_group_owner(_group_id uuid, _user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid) TO service_role;


--
-- TOC entry 3848 (class 0 OID 0)
-- Dependencies: 536
-- Name: FUNCTION is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean) TO anon;
GRANT ALL ON FUNCTION public.is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean) TO authenticated;
GRANT ALL ON FUNCTION public.is_not_updating_owner_field(_group_id uuid, _user_id uuid, _restricted_owner_field boolean) TO service_role;


--
-- TOC entry 3849 (class 0 OID 0)
-- Dependencies: 530
-- Name: FUNCTION search_profiles(user_search character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.search_profiles(user_search character varying) TO anon;
GRANT ALL ON FUNCTION public.search_profiles(user_search character varying) TO authenticated;
GRANT ALL ON FUNCTION public.search_profiles(user_search character varying) TO service_role;


--
-- TOC entry 3850 (class 0 OID 0)
-- Dependencies: 287
-- Name: TABLE group_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.group_members TO anon;
GRANT ALL ON TABLE public.group_members TO authenticated;
GRANT ALL ON TABLE public.group_members TO service_role;


--
-- TOC entry 3851 (class 0 OID 0)
-- Dependencies: 286
-- Name: TABLE groups; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.groups TO anon;
GRANT ALL ON TABLE public.groups TO authenticated;
GRANT ALL ON TABLE public.groups TO service_role;


--
-- TOC entry 3852 (class 0 OID 0)
-- Dependencies: 285
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- TOC entry 2465 (class 826 OID 16452)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- TOC entry 2466 (class 826 OID 16453)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- TOC entry 2464 (class 826 OID 16451)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- TOC entry 2468 (class 826 OID 16455)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- TOC entry 2463 (class 826 OID 16450)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- TOC entry 2467 (class 826 OID 16454)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


-- Completed on 2023-03-28 13:39:22

--
-- PostgreSQL database dump complete
--

