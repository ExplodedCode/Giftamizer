import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { ItemStatuses, ItemType, MemberItemType } from '../types';
import { dataUrlToFile } from '../../../components/ImageCropper';
import { useGetProfile } from './useProfile';
import { CLAIMED_ITEMS_QUERY_KEY } from './useMember';

export const ITEMS_QUERY_KEY = ['items'];

export const useGetItems = () => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: ITEMS_QUERY_KEY,
		queryFn: async (): Promise<ItemType[]> => {
			const { data, error } = await client
				.from('items')
				.select(
					`*,
					lists:items_lists( 
						list_id,
						list:lists!inner(
							name,
							child_list
						)
					)`
				)
				.eq('user_id', user.id)
				.is('shopping_item', null);
			if (error) throw error;

			return data.map((i) => {
				// @ts-ignore
				return { ...i, image: i.image_token && `${client.supabaseUrl}/storage/v1/object/public/items/${i.id}?${i.image_token}` };
			}) as ItemType[];
		},
	});
};

export const useCreateItem = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (item: Omit<ItemType, 'id' | 'user_id' | 'archived' | 'deleted' | 'created_at' | 'updated_at'>): Promise<ItemType> => {
			console.log({
				user_id: user.id,
				name: item.name,
				description: item.description,
				links: item.links,
				custom_fields: item.custom_fields,
				image_token: item.image ? Date.now() : null,
				shopping_item: item.shopping_item,
			});

			const { data, error } = await client
				.from('items')
				.insert({
					user_id: user.id,
					name: item.name,
					description: item.description,
					links: item.links,
					custom_fields: item.custom_fields,
					image_token: item.image ? Date.now() : null,
					shopping_item: item.shopping_item,
				})
				.select('*')
				.single();
			if (error) throw error;

			var newItem = data as Omit<ItemType, 'created_at' | 'updated_at'>;
			newItem.lists = [];

			// upload image if exists
			if (item.image?.startsWith('data:')) {
				const { error: imageError } = await client.storage.from('items').upload(`${data.id}`, await dataUrlToFile(item.image, 'avatar'), {
					cacheControl: '3600',
					upsert: true,
				});
				if (imageError) throw imageError;

				// @ts-ignore
				newItem.image = `${client.supabaseUrl}/storage/v1/object/public/items/${data.id}?${data.image_token}`;
			}

			// Add list-group relationships
			for (let list of item.newLists!) {
				const { data: itemListData, error: listGroupError } = await client
					.from('items_lists')
					.insert({
						item_id: newItem.id,
						list_id: list.id,
						user_id: user.id,
					})
					.select('*, list:lists( id, name, child_list )')
					.single();
				if (listGroupError) throw listGroupError;

				var itemList = itemListData as any;

				newItem.lists.push({
					list_id: list.id,
					list: {
						name: itemList.list.name,
						child_list: itemList.list.child_list,
					},
				});
			}

			return newItem as ItemType;
		},
		{
			onSuccess: async (item: ItemType) => {
				if (item.shopping_item) {
					const { data: profile } = await client.from('profiles').select(`*`).eq('user_id', item.shopping_item).single();
					const { data: itemStatus } = await client.from('items_status').upsert({ item_id: item.id, user_id: user.id, status: ItemStatuses.planned }).select().single();

					let shoppingItem: MemberItemType = {
						...item,
						status: itemStatus,
						profile: {
							...profile,
							// @ts-ignore
							image: profile.avatar_token && `${client.supabaseUrl}/storage/v1/object/public/avatars/${profile.user_id}?${profile.avatar_token}`,
						},
					};
					queryClient.setQueryData(CLAIMED_ITEMS_QUERY_KEY, (prevItems: MemberItemType[] | undefined) => (prevItems ? [shoppingItem, ...prevItems] : [shoppingItem]));
				} else {
					queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => (prevItems ? [item, ...prevItems] : [item]));
				}
			},
		}
	);
};

export const useUpdateItems = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (item: Omit<ItemType, 'archived' | 'deleted' | 'created_at' | 'updated_at'>): Promise<ItemType> => {
			const { data, error } = await client
				.from('items')
				.update({
					user_id: item.user_id,
					name: item.name,
					description: item.description,
					links: item.links,
					custom_fields: item.custom_fields,
					image_token: item.image ? Date.now() : null,
					shopping_item: item.shopping_item,
				})
				.eq('id', item.id)
				.select()
				.single();
			if (error) throw error;

			// upload image if exists
			if (item.image?.startsWith('data:') && data) {
				const { error: imageError } = await client.storage.from('items').upload(`${item.id}`, await dataUrlToFile(item.image, 'avatar'), {
					cacheControl: '3600',
					upsert: true,
				});
				if (imageError) throw imageError;

				// @ts-ignore
				item.image = `${client.supabaseUrl}/storage/v1/object/public/items/${data.id}?${data.image_token}`;
			} else if (data.image_token === null) {
				item.image = undefined;
			}

			// update list-group relationships
			const { data: listsData, error: ListsError } = await client.from('items_lists').select('*').eq('item_id', item.id);
			if (ListsError) throw ListsError;
			for (let list of item.newLists!) {
				if (!listsData?.find((l) => l.item_id === list.id)) {
					const { error } = await client.from('items_lists').upsert({
						item_id: item.id,
						list_id: list.id,
						user_id: user.id,
					});
					if (error) throw error;
				}
			}

			for (let list of listsData as any) {
				if (!item.newLists?.find((l) => l.id === list.list_id)) {
					const { error } = await client.from('items_lists').delete().eq('item_id', item.id).eq('list_id', list.list_id);
					if (error) throw error;
				}
			}

			// update list state
			item.lists = item.newLists?.map((l) => {
				return {
					list_id: l.id,
					list: {
						name: l.name,
						child_list: l.child_list,
					},
				};
			});

			// restore domains from DB
			item.domains = data.domains;

			return item as ItemType;
		},
		{
			onSuccess: async (item_updated: ItemType) => {
				if (item_updated.shopping_item) {
					const { data: profile } = await client.from('profiles').select(`*`).eq('user_id', item_updated.shopping_item).single();

					let shoppingItem: MemberItemType = {
						...item_updated,
						profile: {
							...profile,
							// @ts-ignore
							image: profile.avatar_token && `${client.supabaseUrl}/storage/v1/object/public/avatars/${profile.user_id}?${profile.avatar_token}`,
						},
					};

					queryClient.setQueryData(CLAIMED_ITEMS_QUERY_KEY, (prevItems: MemberItemType[] | undefined) => {
						if (prevItems) {
							const updatedItems = prevItems.map((item) => {
								return item.id === item_updated.id ? shoppingItem : item;
							});
							return updatedItems;
						}
						return prevItems;
					});
				} else {
					queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => {
						if (prevItems) {
							const updatedItems = prevItems.map((item) => {
								return item.id === item_updated.id ? item_updated : item;
							});
							return updatedItems;
						}
						return prevItems;
					});
				}
			},
		}
	);
};

export const useArchiveItem = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	interface ArchiveItem {
		id: string;
		archive: boolean;
	}

	return useMutation(
		async (a: ArchiveItem): Promise<ArchiveItem> => {
			const { error } = await client
				.from('items')
				.update({
					archived: a.archive,
				})
				.eq('id', a.id);
			if (error) throw error;

			return a;
		},
		{
			onSuccess: (a) => {
				queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => {
					if (prevItems) {
						const updatedItems = prevItems.map((item) => {
							return item.id === a.id ? { ...item, archived: a.archive } : item;
						});
						return updatedItems;
					}
					return prevItems;
				});
			},
		}
	);
};

export const useDeleteItem = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	const { data: profile } = useGetProfile();

	interface DeleteItem {
		id: string;
		deleted: boolean;
		shopping_item: boolean;
	}

	return useMutation(
		async (d: DeleteItem): Promise<DeleteItem> => {
			if (profile?.enable_trash && !d.deleted && !d.shopping_item) {
				const { error } = await client
					.from('items')
					.update({
						deleted: true,
						archived: false,
					})
					.eq('id', d.id);
				if (error) throw error;
			} else {
				const { error } = await client.from('items').delete().eq('id', d.id);
				if (error) throw error;
			}

			return d;
		},
		{
			onSuccess: (d) => {
				if (d.shopping_item) {
					queryClient.setQueryData(CLAIMED_ITEMS_QUERY_KEY, (prevItems: MemberItemType[] | undefined) => (prevItems ? prevItems.filter((item) => item.id !== d.id) : prevItems));
				} else {
					if (profile?.enable_trash && !d.deleted) {
						queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => {
							if (prevItems) {
								const updatedItems = prevItems.map((item) => {
									return item.id === d.id ? { ...item, deleted: true, archived: false } : item;
								});
								return updatedItems;
							}
							return prevItems;
						});
					} else {
						queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => (prevItems ? prevItems.filter((item) => item.id !== d.id) : prevItems));
					}
				}
			},
		}
	);
};

export const useRestoreItem = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	return useMutation(
		async (id: string): Promise<string> => {
			const { error } = await client
				.from('items')
				.update({
					deleted: false,
				})
				.eq('id', id);
			if (error) throw error;

			return id;
		},
		{
			onSuccess: (id) => {
				queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => {
					if (prevItems) {
						const updatedItems = prevItems.map((item) => {
							return item.id === id ? { ...item, deleted: false } : item;
						});
						return updatedItems;
					}
					return prevItems;
				});
			},
		}
	);
};

export const useEmptyTrash = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	return useMutation(
		async (items: string[]): Promise<string[]> => {
			for (let item of items) {
				const { error } = await client.from('items').delete().eq('id', item);
				if (error) throw error;
			}

			return items;
		},
		{
			onSuccess: (items) => {
				queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => (prevItems ? prevItems.filter((item) => !items.includes(item.id)) : prevItems));
			},
		}
	);
};
