CREATE POLICY "Enable read access for all users"
    ON public.profiles
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable update for users based on user_id"
    ON public.profiles
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((auth.uid() = user_id));