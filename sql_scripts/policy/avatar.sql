CREATE POLICY "allow user select"
    ON storage.objects
    AS PERMISSIVE
    FOR SELECT
    TO "anon, authenticated"
    USING (((bucket_id = 'avatar'::text) AND (storage.filename(name) = (auth.uid())::text)));

CREATE POLICY "allow user insert"
    ON storage.objects
    AS PERMISSIVE
    FOR INSERT
    TO "anon, authenticated"
    WITH CHECK (((bucket_id = 'avatar'::text) AND (storage.filename(name) = (auth.uid())::text)));

CREATE POLICY "allow user update"
    ON storage.objects
    AS PERMISSIVE
    FOR UPDATE
    TO "anon, authenticated"
    USING (((bucket_id = 'avatar'::text) AND (storage.filename(name) = (auth.uid())::text)));

CREATE POLICY "allow user delete"
    ON storage.objects
    AS PERMISSIVE
    FOR DELETE
    TO "anon, authenticated"
    USING (((bucket_id = 'avatar'::text) AND (storage.filename(name) = (auth.uid())::text)));