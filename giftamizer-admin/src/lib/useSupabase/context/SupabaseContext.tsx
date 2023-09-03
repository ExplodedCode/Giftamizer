import React from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseContextType } from '../types';

export const SupabaseContext = React.createContext<SupabaseContextType>({
	sb: null,
});

/**
 * SupabaseContextProvider is a context provider giving access to the supabase client to child along the React tree
 *  You should pass to it an authenticated supabase client see https://supabase.io/docs/client/initializing for details
 * ```typescript
 * <SupabaseContextProvider client={supabase}>
 *    <App />
 * </SupabaseContextProvider>
 * ```
 */

export const SupabaseContextProvider: React.FC<{ client: SupabaseClient; children: JSX.Element }> = ({ client, children }) => {
	return (
		<SupabaseContext.Provider
			value={{
				sb: client,
			}}
		>
			{children}
		</SupabaseContext.Provider>
	);
};
