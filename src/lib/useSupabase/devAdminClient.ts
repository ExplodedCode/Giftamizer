import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './api';

// DEV ONLY: a client authenticated with the service role key, which bypasses
// RLS entirely. Only used by the dev account switcher
// (components/DevAccountSwitcher.tsx) to mint sessions for other users
// without their password. Gated behind import.meta.env.PROD so Vite's
// production build dead-code eliminates this whole module -
// REACT_APP_SUPABASE_SERVICE_ROLE_KEY should never end up in a deployed
// bundle, but don't rely on that alone: never set that env var outside local
// dev.
let devAdminClient: SupabaseClient | null = null;

export function getDevAdminClient(): SupabaseClient | null {
	if (import.meta.env.PROD) return null;

	const serviceRoleKey = import.meta.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceRoleKey) return null;

	if (!devAdminClient) {
		devAdminClient = createClient(SUPABASE_URL, serviceRoleKey, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
	}
	return devAdminClient;
}
