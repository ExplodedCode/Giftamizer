import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { GROUPS_QUERY_KEY } from './useGroup';
import { ItemStatus, ItemStatuses, MemberItemType } from '../types';
import { FakeDelay } from '.';

const MEMBER_ITEMS_QUERY_KEY = ['items'];
const CLAIMED_ITEMS_QUERY_KEY = ['claimed_items'];

export const useGetMemberItems = (group_id: string, user_id: string, list_id?: string) => {
	const { client } = useSupabase();

	return useQuery({
		// disable data cacheing
		staleTime: 0,
		cacheTime: 0,

		queryKey: [...GROUPS_QUERY_KEY, group_id, user_id, ...MEMBER_ITEMS_QUERY_KEY, list_id],
		queryFn: async (): Promise<MemberItemType[]> => {
			if (list_id === undefined) {
				const { data: profile, error: profileError } = await client.from('profiles').select(`enable_lists`).eq('user_id', user_id).single();
				if (profileError) throw profileError;

				let res;
				if (profile.enable_lists) {
					res = await client
						.from('items')
						.select(
							`*,
							items_lists!inner( 
								lists!inner(
									lists_groups!inner(
										group_id
									)
								)
							),
							status:items_status(
								item_id,
								user_id,
								status
							)`
						)
						.eq('user_id', user_id)
						.eq('archived', false)
						.eq('deleted', false)
						.eq('user_id', user_id)
						.eq('items_lists.lists.child_list', false)
						.eq('items_lists.lists.lists_groups.group_id', group_id);
				} else {
					res = await client.from('items').select(`*`).eq('user_id', user_id);
				}
				if (res.error) throw res.error;

				return res.data.map((i) => {
					// @ts-ignore
					return { ...i, image: i.image_token && `${client.supabaseUrl}/storage/v1/object/public/items/${i.id}?${i.image_token}` };
				}) as MemberItemType[];
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
					),
					status:items_status(
						item_id,
						user_id,
						status
					)`
					)
					.eq('user_id', user_id)
					.eq('archived', false)
					.eq('deleted', false)
					.eq('items_lists.lists.id', list_id)
					.eq('items_lists.lists.lists_groups.group_id', group_id);
				if (res.error) throw res.error;

				return res.data.map((i) => {
					// @ts-ignore
					return { ...i, image: i.image_token && `${client.supabaseUrl}/storage/v1/object/public/items/${i.id}?${i.image_token}` };
				}) as MemberItemType[];
			}
		},
	});
};

export const useRefreshItem = (group_id: string, user_id: string, list_id?: string) => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	return useMutation(
		async (item_id: string): Promise<MemberItemType> => {
			const { data } = await client
				.from('items')
				.select(
					`*,
					items_lists( 
						lists(
							lists_groups(
								group_id
							)
						)
					),
					status:items_status(
						item_id,
						user_id,
						status
					)`
				)
				.eq('id', item_id)
				.eq('archived', false)
				.eq('deleted', false)
				.eq('items_lists.lists.id', list_id)
				.eq('items_lists.lists.lists_groups.group_id', group_id)
				.single();

			// @ts-ignore
			return { ...data, image: data.image_token && `${client.supabaseUrl}/storage/v1/object/public/items/${data.id}?${data.image_token}` } as MemberItemType;
		},
		{
			onSuccess: (update: MemberItemType) => {
				queryClient.setQueryData([...GROUPS_QUERY_KEY, group_id, user_id, ...MEMBER_ITEMS_QUERY_KEY, list_id], (prevItems: MemberItemType[] | undefined) => {
					if (prevItems) {
						var updatedItems: MemberItemType[];
						if (prevItems.find((i) => i.id === update.id)) {
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

export const useUpdateItemStatus = (group_id?: string, user_id?: string, list_id?: string) => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	return useMutation(
		async (status: ItemStatus): Promise<ItemStatus> => {
			await FakeDelay(500); // fake delay

			if (status.status === ItemStatuses.available) {
				// delete row
				const { error } = await client.from('items_status').delete().eq('item_id', status.item_id);
				if (error) throw error;
			} else {
				// upsert
				const { error } = await client.from('items_status').upsert({ item_id: status.item_id, user_id: status.user_id, status: status.status }).select();
				if (error) throw error;
			}

			return status;
		},
		{
			onSuccess: (status: ItemStatus) => {
				queryClient.setQueryData(
					group_id ? [...GROUPS_QUERY_KEY, group_id, user_id, ...MEMBER_ITEMS_QUERY_KEY, list_id] : CLAIMED_ITEMS_QUERY_KEY,
					(prevItems: MemberItemType[] | undefined) => {
						if (prevItems) {
							var updatedItems: MemberItemType[];
							if (prevItems.find((i) => i.id === status.item_id)) {
								updatedItems = prevItems.map((item) => {
									return item.id === status.item_id
										? {
												...item,
												status: status.status === ItemStatuses.available ? undefined : status,
										  }
										: item;
								});
							} else {
								updatedItems = prevItems;
							}
							return updatedItems;
						}
						return prevItems;
					}
				);
			},
		}
	);
};

export const useClaimedItems = () => {
	const { client, user } = useSupabase();

	return useQuery({
		// disable data cacheing
		staleTime: 0,
		cacheTime: 0,

		queryKey: CLAIMED_ITEMS_QUERY_KEY,
		queryFn: async (): Promise<MemberItemType[]> => {
			const { data, error } = await client
				.from('items')
				.select(
					`*,
					items_lists( 
						lists(
							lists_groups(
								group_id
							)
						)
					),
					status:items_status!inner(
						item_id,
						user_id,
						status
					)`
				)
				.eq('status.user_id', user.id);
			if (error) throw error;

			return data.map((i) => {
				// @ts-ignore
				return { ...i, image: i.image_token && `${client.supabaseUrl}/storage/v1/object/public/items/${i.id}?${i.image_token}` };
			}) as MemberItemType[];
		},
	});
};
