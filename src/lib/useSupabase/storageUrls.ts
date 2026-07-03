import { SupabaseClient } from '@supabase/supabase-js';

// Buckets are private - RLS on storage.objects decides who can actually get a
// signed URL for a given file (see Giftamizer-Supabase's
// 0011-private-storage-policies.sql). A signed URL is just a normal URL for
// its lifetime, so it drops straight into an <img src> like the old public
// URLs did.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

export async function getSignedUrl(client: SupabaseClient, bucket: string, path: string): Promise<string | undefined> {
	const { data, error } = await client.storage.from(bucket).createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
	if (error) return undefined;
	return data.signedUrl;
}

export async function getSignedUrls(client: SupabaseClient, bucket: string, paths: string[]): Promise<Record<string, string | undefined>> {
	if (paths.length === 0) return {};
	const { data, error } = await client.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);
	if (error) return {};

	const map: Record<string, string | undefined> = {};
	data.forEach((entry) => {
		if (entry.path) map[entry.path] = entry.error ? undefined : entry.signedUrl;
	});
	return map;
}
