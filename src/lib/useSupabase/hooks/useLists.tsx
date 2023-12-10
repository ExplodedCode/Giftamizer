import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { ItemType, ListType } from '../types';
import { dataUrlToFile } from '../../../components/ImageCropper';
import { ITEMS_QUERY_KEY } from './useItems';
import { FakeDelay } from '.';

export const DEFAULT_LIST_ID = 'default';

export const LISTS_QUERY_KEY = ['lists'];

export const useGetLists = () => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: LISTS_QUERY_KEY,
		queryFn: async (): Promise<ListType[]> => {
			const { data, error } = await client.from('lists').select('*, groups( id, name )').eq('user_id', user.id).order('name', { ascending: true });
			if (error) throw error;

			return data.map((l) => {
				// @ts-ignore
				return { ...l, image: l.avatar_token && `${client.supabaseUrl}/storage/v1/object/public/lists/${l.id}?${l.avatar_token}` };
			}) as ListType[];
		},
	});
};

export const useCreateList = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (list: Omit<ListType, 'id' | 'created_at' | 'updated_at'>): Promise<ListType> => {
			const { data, error } = await client
				.from('lists')
				.insert({
					user_id: user.id,
					name: list.name,
					child_list: list.child_list,
					bio: list.bio,
					avatar_token: list.image ? Date.now() : null,
				})
				.select('*, groups( id, name )')
				.single();
			if (error) throw error;
			var newlist = data as Omit<ListType, 'id' | 'created_at' | 'updated_at'>;

			// upload image if exists
			if (list.image?.startsWith('data:')) {
				const { error: imageError } = await client.storage.from('lists').upload(`${data.id}`, await dataUrlToFile(list.image, 'avatar'), {
					cacheControl: '3600',
					upsert: true,
				});
				if (imageError) throw imageError;

				// @ts-ignore
				newlist.image = `${client.supabaseUrl}/storage/v1/object/public/lists/${data.id}?${data.avatar_token}`;
			}

			// Add list-group relationships
			for (let group of list.groups) {
				const { data: listGroupData, error: listGroupError } = await client
					.from('lists_groups')
					.insert({
						list_id: data.id,
						group_id: group.id,
						user_id: user.id,
					})
					.select('*, group:groups( id, name )')
					.single();
				if (listGroupError) throw listGroupError;

				newlist.groups.push(listGroupData.group);
			}

			return newlist as ListType;
		},
		{
			onSuccess: (list: ListType) => {
				queryClient.setQueryData(LISTS_QUERY_KEY, (prevLists: ListType[] | undefined) => (prevLists ? [...prevLists, list] : [list]));
			},
		}
	);
};

export const useUpdateLists = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (list: Omit<ListType, 'user_id' | 'created_at' | 'updated_at'>): Promise<ListType> => {
			const { data, error } = await client
				.from('lists')
				.update({
					name: list.name,
					child_list: list.child_list,
					bio: list.bio,
					avatar_token: list.image ? Date.now() : null,
				})
				.eq('id', list.id)
				.select()
				.single();
			if (error) throw error;

			// upload image if exists
			if (list.image?.startsWith('data:') && data) {
				const { error: imageError } = await client.storage.from('lists').upload(`${list.id}`, await dataUrlToFile(list.image, 'avatar'), {
					cacheControl: '3600',
					upsert: true,
				});
				if (imageError) throw imageError;

				// @ts-ignore
				list.image = `${client.supabaseUrl}/storage/v1/object/public/lists/${data.id}?${data.avatar_token}`;
			} else if (data.avatar_token === null) {
				list.image = undefined;
			}

			// update list-group relationships
			const { data: listsData, error: ListsError } = await client.from('lists_groups').select('*').eq('list_id', list.id).eq('user_id', user.id);
			if (ListsError) throw ListsError;
			for (let group of list.groups) {
				if (!listsData?.find((l) => l.group_id === group.id)) {
					const { error } = await client.from('lists_groups').upsert({
						list_id: list.id,
						group_id: group.id,
						user_id: user.id,
					});
					if (error) throw error;
				}
			}

			for (let group of listsData as any) {
				if (!list.groups.find((g) => g.id === group.group_id)) {
					const { error } = await client.from('lists_groups').delete().eq('list_id', group.list_id).eq('group_id', group.group_id);
					if (error) throw error;
				}
			}

			return list as ListType;
		},
		{
			onSuccess: (list_updated: ListType) => {
				queryClient.setQueryData(LISTS_QUERY_KEY, (prevLists: ListType[] | undefined) => {
					if (prevLists) {
						const updatedLists = prevLists.map((list) => {
							return list.id === list_updated.id ? { ...list, ...list_updated } : list;
						});
						return updatedLists;
					}
					return prevLists;
				});

				// update item list names
				queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => {
					if (prevItems) {
						const updatedItems = prevItems.map((item) => {
							item.lists = item.lists?.map((l) => {
								return l.list_id === list_updated.id
									? {
											...l,
											list: {
												name: list_updated.name,
												child_list: list_updated.child_list,
											},
									  }
									: l;
							});
							return item;
						});
						return updatedItems;
					}
					return prevItems;
				});
			},
		}
	);
};

export const useDeleteList = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	return useMutation(
		async (id: string): Promise<string> => {
			const { error } = await client.from('lists').delete().eq('id', id);
			if (error) throw error;

			return id;
		},
		{
			onSuccess: (id) => {
				queryClient.setQueryData(LISTS_QUERY_KEY, (prevLists: ListType[] | undefined) => (prevLists ? prevLists.filter((list) => list.id !== id) : prevLists));

				// update item list names
				queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => {
					if (prevItems) {
						const updatedItems = prevItems.map((item) => {
							item.lists = item.lists?.filter((l) => l.list_id !== id);
							return item;
						});
						return updatedItems;
					}
					return prevItems;
				});
			},
		}
	);
};

export const useSetListPin = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	interface PinUpdate {
		id: string;
		pinned: boolean;
	}

	return useMutation(
		async (pinUpdate: PinUpdate): Promise<PinUpdate> => {
			await FakeDelay(); // fake delay

			const { error } = await client.from('lists').update({ pinned: pinUpdate.pinned }).eq('id', pinUpdate.id).eq('user_id', user.id);
			if (error) throw error;

			return pinUpdate;
		},
		{
			onSuccess: (pinUpdate: PinUpdate) => {
				queryClient.setQueryData(LISTS_QUERY_KEY, (prevLists: ListType[] | undefined) => {
					if (prevLists) {
						const updatedLists = prevLists.map((list) => {
							return list.id === pinUpdate.id
								? {
										...list,
										pinned: pinUpdate.pinned,
								  }
								: list;
						});
						return updatedLists;
					}
					return prevLists;
				});
			},
		}
	);
};
