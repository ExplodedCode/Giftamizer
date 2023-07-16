import React from 'react';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseContextType } from '../types';
import { useQueryClient } from '@tanstack/react-query';

export const SupabaseContext = React.createContext<SupabaseContextType>({
	sb: null,
	user: undefined,
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
	const [user, setUser] = React.useState<User | null | undefined>();
	const queryClient = useQueryClient();

	React.useEffect(() => {
		const getUser = async () => {
			await client.auth.getSession().then(async ({ data, error }) => {
				if (error) {
					client.removeAllChannels();
					setUser(null);
				} else {
					setUser(data.session?.user || null);
				}
			});

			client.auth.onAuthStateChange(async (event, session) => {
				if (event === 'SIGNED_IN') {
					setUser(session?.user);
				}
				if (event === 'SIGNED_OUT') {
					client.removeAllChannels();
					queryClient.removeQueries(); // invalidate cache
					setUser(null);
				}
			});
		};

		getUser();
	}, [client, queryClient]);

	return (
		<SupabaseContext.Provider
			value={{
				user,
				sb: client,
			}}
		>
			{children}
		</SupabaseContext.Provider>
	);
};
