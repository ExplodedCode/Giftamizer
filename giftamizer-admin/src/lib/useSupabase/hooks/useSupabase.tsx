import type { SupabaseClient } from '@supabase/supabase-js';
import * as React from 'react';
import { SupabaseContext } from '../context';

/**
 * useSupabase returns the Supabase client
 * ```typescript
 * // get full client instance
 * const supabase = useSupabase();
 * // or specific members of the SupabaseClient class
 * const { client } = useSupabase();
 * ```
 */
export const useSupabase = () => {
	const context = React.useContext(SupabaseContext);

	if (context === undefined) {
		throw new Error('useSupabase must be used within a SupabaseContext.Provider');
	}

	return {
		client: context.sb as SupabaseClient,
	};
};
