import React from 'react';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { ProfileType, SupabaseContextType } from '../types';

export const SupabaseContext = React.createContext<SupabaseContextType>({
	sb: null,
	user: undefined,
	profile: null,
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
	const [profile, setProfile] = React.useState<ProfileType | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const getProfile = async (user: User | undefined) => {
			if (user) {
				const { data, error } = await client.from('profiles').select().filter('user_id', 'eq', user.id).single();

				if (error) {
					setError(error.message);
				} else {
					setProfile(data);

					client
						.channel(`public:profiles:user_id=eq.${user.id}`)
						.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload) => {
							setProfile(payload.new as ProfileType);
						})
						.subscribe();
				}
			}
		};

		const getUser = async () => {
			await client.auth.getSession().then(async ({ data, error }) => {
				if (error) {
					client.removeAllChannels();
					setUser(null);
				} else {
					await getProfile(data.session?.user);
					setUser(data.session?.user || null);
				}
			});

			client.auth.onAuthStateChange(async (event, session) => {
				if (event === 'SIGNED_IN') {
					await getProfile(session?.user);
					setUser(session?.user);
				}
				if (event === 'SIGNED_OUT') {
					client.removeAllChannels();
					setUser(null);
				}
			});
		};

		getUser();
	}, [client]);

	return <SupabaseContext.Provider value={{ user, sb: client, profile: profile, error: error }}>{children}</SupabaseContext.Provider>;
};
