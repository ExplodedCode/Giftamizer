import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './api';

// DEV ONLY: a client authenticated with the service role key, which bypasses
// RLS entirely. Only used by the dev account switcher
// (components/DevAccountSwitcher.tsx) to mint sessions for other users
// without their password. Gated behind NODE_ENV so react-scripts' production
// build (which always sets NODE_ENV=production) dead-code eliminates this
// whole module - REACT_APP_SUPABASE_SERVICE_ROLE_KEY should never end up in a
// deployed bundle, but don't rely on that alone: never set that env var
// outside local dev.
let devAdminClient: SupabaseClient | null = null;

export function getDevAdminClient(): SupabaseClient | null {
	if (process.env.NODE_ENV === 'production') return null;

	const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceRoleKey) return null;

	if (!devAdminClient) {
		devAdminClient = createClient(SUPABASE_URL, serviceRoleKey, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
	}
	return devAdminClient;
}
