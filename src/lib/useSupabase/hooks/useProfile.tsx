import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { ProfileType } from '../types';

const QUERY_KEY = ['profile'];

export const useGetProfile = () => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: async (): Promise<ProfileType> => {
			const { data, error } = await client.from('profiles').select('*').eq('user_id', user.id).single();
			if (error) throw error;

			//#region Download avatar for social provider logins
			await client.auth.getSession().then(async ({ data: sessionData, error }) => {
				if (!data.avatar_token && data.avatar_token !== -1) {
					user.app_metadata.providers.every(async (provider: string) => {
						if (provider === 'facebook') {
							const url = `https://graph.facebook.com/me/picture?height=512&width=512&access_token=${sessionData.session?.provider_token}`;
							const { error } = await client.functions.invoke('socialavatar/download', {
								body: {
									user_id: user.id,
									url: url,
								},
							});
							if (error) console.log(error);
						} else if (provider === 'google') {
							const url = `${user.identities?.find((i) => i.provider === 'google')?.identity_data.avatar_url.split('=')[0]}=s512`;
							const { error } = await client.functions.invoke('socialavatar/download', {
								body: {
									user_id: user.id,
									url: url,
								},
							});
							if (error) console.log(error);
						}
					});
				}
			});
			//#endregion

			return data as ProfileType;
		},
		onError: () => {
			client.auth.signOut();
		},
	});
};

export const useUpdateProfile = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (update: Omit<ProfileType, 'user_id' | 'email'>): Promise<ProfileType> => {
			const { error, data } = await client
				.from('profiles')
				.update({ ...update })
				.eq('user_id', user.id)
				.select('*')
				.single();
			if (error) throw error;

			return data as ProfileType;
		},
		{
			onSuccess: (update: ProfileType) => {
				queryClient.setQueryData(QUERY_KEY, () => update);
			},
		}
	);
};
