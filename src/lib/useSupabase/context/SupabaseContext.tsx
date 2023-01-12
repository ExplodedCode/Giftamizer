import React from 'react';

import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { GroupType, ProfileType, SupabaseContextType } from '../types';

export const SupabaseContext = React.createContext<SupabaseContextType>({
	sb: null,
	user: undefined,
	profile: null,
	groups: [],
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
	const [groups, setGroups] = React.useState<GroupType[]>([]);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const getGroups = async () => {
			const { data, error } = await client.from('groups').select('*');
			if (error) setError(error.message);
			setGroups(data!);
		};

		const getProfile = async (session: Session | null) => {
			if (session) {
				const { data: profileData, error: profileError } = await client.from('profiles').select().filter('user_id', 'eq', session.user.id).single();
				await getGroups();

				//#region Download avatar for social provider logins
				if (!profileData.avatar_token && profileData.avatar_token !== -1) {
					session.user.app_metadata.providers.every(async (provider: string) => {
						if (provider === 'facebook') {
							const url = `https://graph.facebook.com/me/picture?height=512&width=512&access_token=${session.provider_token}`;
							const { error } = await client.functions.invoke('socialavatar/download', {
								body: {
									user_id: session.user.id,
									url: url,
								},
							});
							if (error) console.log(error);
							return false;
						} else if (provider === 'google') {
							const url = `${session.user.identities?.find((i) => i.provider === 'google')?.identity_data.avatar_url.split('=')[0]}=s512`;
							const { error } = await client.functions.invoke('socialavatar/download', {
								body: {
									user_id: session.user.id,
									url: url,
								},
							});
							if (error) console.log(error);
							return false;
						}
						return true;
					});
				}
				//#endregion

				if (profileError) {
					setError(profileError.message);
				} else {
					setProfile(profileData);

					client
						.channel(`public:profiles:user_id=eq.${session.user.id}`)
						.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${session.user.id}` }, (payload) => {
							setProfile(payload.new as ProfileType);
						})
						.subscribe();

					client
						.channel(`public`)
						.on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
							getGroups();
						})
						.on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, (payload) => {
							getGroups();
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
					await getProfile(data.session);
					setUser(data.session?.user || null);
				}
			});

			client.auth.onAuthStateChange(async (event, session) => {
				if (event === 'SIGNED_IN') {
					await getProfile(session);
					setUser(session?.user);
				}
				if (event === 'SIGNED_OUT') {
					client.removeAllChannels();
					setUser(null);
				}
			});
		};

		getUser();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <SupabaseContext.Provider value={{ user, sb: client, profile: profile, groups: groups, error: error }}>{children}</SupabaseContext.Provider>;
};
