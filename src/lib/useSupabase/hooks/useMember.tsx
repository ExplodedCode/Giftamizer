import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { GROUPS_QUERY_KEY } from './useGroup';
import { ItemType } from '../types';

const MEMBER_ITEMS_QUERY_KEY = ['items'];

export const useGetMemberItems = (group_id: string, user_id: string, list_id?: string) => {
	const { client } = useSupabase();

	console.log(`public:group_members:realtime=eq.${group_id}.${user_id}${list_id ? `_${list_id}` : ''}`);

	client
		.channel(`public:group_members:realtime=eq.${group_id}.${user_id}${list_id ? `_${list_id}` : ''}`)
		.on('postgres_changes', { event: '*', schema: 'public', table: 'item_links', filter: `realtime=eq.${group_id}.${user_id}${list_id ? `_${list_id}` : ''}` }, async (payload) => {
			switch (payload.eventType) {
				case 'INSERT':
					console.log('INSERT', payload.new);
					break;
				case 'UPDATE':
					console.log('UPDATE', payload.new);
					break;
				case 'DELETE':
					console.log('DELETE', payload.old);

					break;
			}
		})
		.subscribe();

	return useQuery({
		// disable data cacheing
		staleTime: 0,
		cacheTime: 0,

		queryKey: [...GROUPS_QUERY_KEY, group_id, user_id, ...MEMBER_ITEMS_QUERY_KEY, list_id],
		queryFn: async (): Promise<ItemType[]> => {
			if (list_id === undefined) {
				const { data: profile, error: profileError } = await client.from('profiles').select(`enable_lists`).eq('user_id', user_id).single();
				if (profileError) throw profileError;

				if (profile.enable_lists) {
					var res = await client
						.from('items')
						.select(
							`*,
							items_lists!inner( 
								lists!inner(
									lists_groups!inner(
										group_id
									)
								)
							)`
						)
						.eq('user_id', user_id)
						.eq('items_lists.lists.child_list', false)
						.eq('items_lists.lists.lists_groups.group_id', group_id);
				} else {
					var res = await client.from('items').select(`*`).eq('user_id', user_id);
				}
				if (res.error) throw res.error;

				// return res.data as ItemType[];

				return res.data.map((i) => {
					// @ts-ignore
					return { ...i, image: i.image_token && `${client.supabaseUrl}/storage/v1/object/public/items/${i.id}?${i.image_token}` };
				}) as ItemType[];
			} else {
				var res = await client
					.from('items')
					.select(
						`*,
					items_lists!inner( 
						lists!inner(
							lists_groups!inner(
								group_id
							)
						)
					)`
					)
					.eq('user_id', user_id)
					.eq('items_lists.lists.id', list_id)
					.eq('items_lists.lists.lists_groups.group_id', group_id);
				if (res.error) throw res.error;

				return res.data.map((i) => {
					// @ts-ignore
					return { ...i, image: i.image_token && `${client.supabaseUrl}/storage/v1/object/public/items/${i.id}?${i.image_token}` };
				}) as ItemType[];

				// return res.data as ItemType[];
			}
		},
	});
};
