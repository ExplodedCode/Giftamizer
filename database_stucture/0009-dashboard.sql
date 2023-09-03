CREATE OR REPLACE VIEW admin_users as
SELECT id::text, profiles.email::text, profiles.first_name || ' ' || profiles.last_name as full_name, u.created_at, u.last_sign_in_at as signed_in, u.raw_app_meta_data from profiles
INNER JOIN auth.users u ON u.id = profiles.user_id