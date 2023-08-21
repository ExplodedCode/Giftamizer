import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { ProfileType } from '../types';
import { dataUrlToFile } from '../../../components/ImageCropper';

const QUERY_KEY = ['profile'];

export const useGetProfile = () => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: async (): Promise<ProfileType> => {
			const { data, error } = await client.from('profiles').select('*').eq('user_id', user.id).single();
			if (error) throw error;
			var profile = data as unknown as ProfileType;

			//#region Download avatar for social provider logins
			await client.auth.getSession().then(async ({ data: sessionData, error }) => {
				if (!profile.avatar_token && profile.avatar_token !== -1) {
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

			// @ts-ignore
			profile.image = profile.avatar_token && profile.avatar_token !== -1 && `${client.supabaseUrl}/storage/v1/object/public/avatars/${user.id}?${profile.avatar_token}`;

			return profile as ProfileType;
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
				.update({
					first_name: update.first_name,
					last_name: update.last_name,
					bio: update.bio,
					enable_lists: update.enable_lists,
					avatar_token: update.image ? Date.now() : -1,
				})
				.eq('user_id', user.id)
				.select('*')
				.single();
			if (error) throw error;
			var profile = data as unknown as ProfileType;

			// upload image if exists
			if (update.image?.startsWith('data:') && data) {
				const { error: imageError } = await client.storage.from('avatars').upload(`${user.id}`, await dataUrlToFile(update.image, 'avatar'), {
					cacheControl: '3600',
					upsert: true,
				});
				if (imageError) throw imageError;

				profile.image = update.image;
			} else if (profile.avatar_token === null || profile.avatar_token === -1) {
				const { error: imageDelError } = await client.storage.from('avatars').remove([`${user.id}`]);
				if (imageDelError) throw imageDelError;

				profile.image = undefined;
			} else {
				profile.image = update.image;
			}

			return profile as ProfileType;
		},
		{
			onSuccess: (update: ProfileType) => {
				queryClient.setQueryData(QUERY_KEY, () => update);
			},
		}
	);
};
