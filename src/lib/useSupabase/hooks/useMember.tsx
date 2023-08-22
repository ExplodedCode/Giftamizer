import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { GROUPS_QUERY_KEY } from './useGroup';
import { ItemType } from '../types';

const MEMBER_ITEMS_QUERY_KEY = ['items'];

export const useGetMemberItems = (group_id: string, user_id: string, list_id?: string) => {
	const { client } = useSupabase();

	const refreshItem = useRefreshItem([...GROUPS_QUERY_KEY, group_id, user_id, ...MEMBER_ITEMS_QUERY_KEY, list_id!]);
	const queryClient = useQueryClient();
	client
		.channel(`public:item_links:realtime=eq.${group_id}.${user_id}${list_id ? `_${list_id}` : ''}`)
		.on('postgres_changes', { event: '*', schema: 'public', table: 'item_links', filter: `realtime=eq.${group_id}.${user_id}${list_id ? `_${list_id}` : ''}` }, async (payload) => {
			switch (payload.eventType) {
				case 'INSERT':
					if (payload.new.group_id === group_id) {
						console.log(payload);
						await refreshItem.mutateAsync(payload.new.item_id);
					}
					break;
				case 'UPDATE':
					if (payload.new.group_id === group_id) {
						console.log(payload);
						await refreshItem.mutateAsync(payload.new.item_id);
					}
					break;
				case 'DELETE':
					if (payload.old.group_id === group_id) {
						console.log(payload);
						queryClient.setQueryData([...GROUPS_QUERY_KEY, group_id, user_id, ...MEMBER_ITEMS_QUERY_KEY, list_id], (prevItems: ItemType[] | undefined) =>
							prevItems ? prevItems.filter((item) => item.id !== payload.old.item_id) : prevItems
						);
					}
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

export const useRefreshItem = (QUERY_KEY: string[]) => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (item_id: string): Promise<ItemType> => {
			const { data, error } = await client
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
				.eq('id', item_id)
				.single();

			// @ts-ignore
			return { ...data, image: data.image_token && `${client.supabaseUrl}/storage/v1/object/public/items/${data.id}?${data.image_token}` } as ItemType;
		},
		{
			onSuccess: (update: ItemType) => {
				queryClient.setQueryData(QUERY_KEY, (prevItems: ItemType[] | undefined) => {
					if (prevItems) {
						var updatedItems: ItemType[];
						if (prevItems.find((g) => g.id === update.id)) {
							updatedItems = prevItems.map((item) => {
								return item.id === update.id ? update : item;
							});
						} else {
							updatedItems = [...prevItems, update];
						}
						return updatedItems;
					}
					return prevItems;
				});
			},
		}
	);
};
