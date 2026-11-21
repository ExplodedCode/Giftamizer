import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

// Google Analytics
import ReactGA from 'react-ga4';

import { useSupabase } from './useSupabase';
import { ItemImage, ItemImageDraft, ItemStatuses, ItemType, MemberItemType } from '../types';
import { dataUrlToFile } from '../utils';
import { useGetProfile } from './useProfile';
import { CLAIMED_ITEMS_QUERY_KEY } from './useMember';
import { getSignedUrl, getSignedUrls, collectItemImagePaths, resolveItemImages } from '../storageUrls';

const MAX_ITEM_IMAGES = 6;

// Diffs the dialog's draft images[] against what's persisted (`existing`,
// pass [] for a brand-new item) and applies storage uploads/item_images
// inserts/deletes/position updates to bring the DB in line. Shared by
// useCreateItem and useUpdateItems.
async function syncItemImages(client: SupabaseClient, itemId: string, userId: string, draft: ItemImageDraft[], existing: ItemImage[]): Promise<ItemImage[]> {
	// A draft with no id is a brand-new image, which only has bytes to upload if
	// it's a data: URL. Anything else (e.g. a bare remote URL) would insert an
	// item_images row with no storage object behind it, so never persist those.
	const draftImages = draft.filter((img) => img.id || img.url?.startsWith('data:')).slice(0, MAX_ITEM_IMAGES);

	// Persisted images are only deleted when the user removed them from the
	// draft. Ones whose signed URL failed to load stay in the draft with url ''
	// and are left untouched here (no upload, same row, position updated only).
	const keepIds = new Set(draftImages.filter((img) => img.id).map((img) => img.id));
	const removed = existing.filter((img) => !keepIds.has(img.id));
	const existingPositionById = new Map(existing.map((img) => [img.id, img.position]));

	const planned = draftImages.map((img, position) => ({
		img,
		position,
		isNew: !img.id,
		id: img.id ?? crypto.randomUUID(),
		hasUpload: !!img.url?.startsWith('data:'),
	}));
	const newRows = planned.filter((p) => p.isNew).map((p) => ({ id: p.id, item_id: itemId, user_id: userId, position: p.position }));

	// Ordered so that a failure part-way leaves the existing data intact:
	//   1. upload files (nothing in the DB changes yet),
	//   2. insert new rows / update positions,
	//   3. delete removed rows LAST (this is the irreversible step - the
	//      on_item_image_delete trigger also removes their files).
	// If anything throws, the new images this call created are cleaned up so a
	// retry doesn't leave orphaned files/rows behind or duplicate images.
	const uploadedNewPaths: string[] = [];
	let insertedNewRows = false;

	try {
		// Freshly picked, or an existing image the user re-cropped - either way
		// (re)upload to this id's path (upsert covers the re-crop case).
		const uploads = await Promise.allSettled(
			planned
				.filter((p) => p.hasUpload)
				.map(async (p) => {
					const path = `${itemId}/${p.id}`;
					const { error } = await client.storage.from('items').upload(path, await dataUrlToFile(p.img.url, 'image'), {
						cacheControl: '3600',
						upsert: true,
					});
					if (error) throw error;
					if (p.isNew) uploadedNewPaths.push(path);
				})
		);
		const failedUpload = uploads.find((u): u is PromiseRejectedResult => u.status === 'rejected');
		if (failedUpload) throw failedUpload.reason;

		if (newRows.length > 0) {
			const { error } = await client.from('item_images').insert(newRows);
			if (error) throw error;
			insertedNewRows = true;
		}

		const positionUpdates = await Promise.all(
			planned
				.filter((p) => !p.isNew && existingPositionById.get(p.id) !== p.position)
				.map((p) => client.from('item_images').update({ position: p.position }).eq('id', p.id))
		);
		const positionError = positionUpdates.find((r: { error: unknown }) => r.error)?.error;
		if (positionError) throw positionError;

		if (removed.length > 0) {
			const { error } = await client
				.from('item_images')
				.delete()
				.in(
					'id',
					removed.map((img) => img.id)
				);
			if (error) throw error;
		}
	} catch (err) {
		// Best-effort cleanup of what this call created; never mask the real error.
		if (insertedNewRows) await client.from('item_images').delete().in('id', newRows.map((r) => r.id));
		if (uploadedNewPaths.length > 0) await client.storage.from('items').remove(uploadedNewPaths);
		throw err;
	}

	// One batched call for every freshly uploaded image's signed URL.
	const signedUrls = await getSignedUrls(
		client,
		'items',
		planned.filter((p) => p.hasUpload).map((p) => `${itemId}/${p.id}`)
	);

	return planned.map((p) => ({
		id: p.id,
		position: p.position,
		url: p.hasUpload ? signedUrls[`${itemId}/${p.id}`] : p.img.url || undefined,
	}));
}

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
					),
					item_images(id, position)`
				)
				.eq('user_id', user.id)
				.is('shopping_item', null)
				.order('position', { foreignTable: 'item_images' });
			if (error) throw error;

			const signedUrls = await getSignedUrls(client, 'items', collectItemImagePaths(data as any));

			return data.map((i: any) => {
				return { ...i, images: resolveItemImages(i, signedUrls) };
			}) as ItemType[];
		},
	});
};

export const useCreateItem = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (item: Omit<ItemType, 'id' | 'user_id' | 'archived' | 'deleted' | 'created_at' | 'updated_at' | 'images'> & { images?: ItemImageDraft[] }): Promise<ItemType> => {
			const { data, error } = await client
				.from('items')
				.insert({
					user_id: user.id,
					name: item.name,
					description: item.description,
					links: item.links,
					custom_fields: item.custom_fields,
					shopping_item: item.shopping_item,
				})
				.select('*')
				.single();
			if (error) throw error;

			var newItem = data as Omit<ItemType, 'created_at' | 'updated_at'>;
			newItem.lists = [];

			try {
				newItem.images = await syncItemImages(client, newItem.id, user.id, item.images ?? [], []);
			} catch (err) {
				// Don't leave a half-created item behind: the dialog stays open on error, so a
				// retry would otherwise create a duplicate. (Cascades to any item_images rows.)
				await client.from('items').delete().eq('id', newItem.id);
				throw err;
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
				// Google Analytics
				ReactGA.event({
					category: 'item',
					action: 'Create Item',
				});

				if (item.shopping_item) {
					const { data: profile } = await client.from('profiles').select(`*`).eq('user_id', item.shopping_item).single();
					const { data: itemStatus } = await client.from('items_status').upsert({ item_id: item.id, user_id: user.id, status: ItemStatuses.planned }).select().single();
					const avatarImage = profile.avatar_token ? await getSignedUrl(client, 'avatars', `${profile.user_id}`) : undefined;

					let shoppingItem: MemberItemType = {
						...item,
						status: itemStatus,
						profile: {
							...profile,
							// @ts-ignore
							image: avatarImage,
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
		async (item: Omit<ItemType, 'archived' | 'deleted' | 'created_at' | 'updated_at' | 'images'> & { images?: ItemImageDraft[] }): Promise<ItemType> => {
			const { data, error } = await client
				.from('items')
				.update({
					user_id: item.user_id,
					name: item.name,
					description: item.description,
					links: item.links,
					custom_fields: item.custom_fields,
					shopping_item: item.shopping_item,
				})
				.eq('id', item.id)
				.select()
				.single();
			if (error) throw error;

			const { data: existingImagesData, error: existingImagesError } = await client.from('item_images').select('id, position').eq('item_id', item.id);
			if (existingImagesError) throw existingImagesError;
			const existingImages: ItemImage[] = (existingImagesData ?? []).map((img: any) => ({ id: img.id, position: img.position }));

			const images = await syncItemImages(client, item.id, item.user_id, item.images ?? [], existingImages);

			// update list-group relationships
			const { data: listsData, error: ListsError } = await client.from('items_lists').select('*').eq('item_id', item.id);
			if (ListsError) throw ListsError;
			for (let list of item.newLists!) {
				if (!listsData?.find((l: any) => l.item_id === list.id)) {
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

			return { ...item, images } as ItemType;
		},
		{
			onSuccess: async (item_updated: ItemType) => {
				// Google Analytics
				ReactGA.event({
					category: 'item',
					action: 'Update Item',
				});

				if (item_updated.shopping_item) {
					const { data: profile } = await client.from('profiles').select(`*`).eq('user_id', item_updated.shopping_item).single();
					const avatarImage = profile.avatar_token ? await getSignedUrl(client, 'avatars', `${profile.user_id}`) : undefined;

					let shoppingItem: MemberItemType = {
						...item_updated,
						profile: {
							...profile,
							// @ts-ignore
							image: avatarImage,
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
				// Google Analytics
				ReactGA.event({
					category: 'item',
					action: 'Archive Item',
				});

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
				// Google Analytics
				ReactGA.event({
					category: 'item',
					action: 'Delete Item',
				});

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
				// Google Analytics
				ReactGA.event({
					category: 'item',
					action: 'Restore Item',
				});

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
				// Google Analytics
				ReactGA.event({
					category: 'item',
					action: 'Empty Trash',
				});

				queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => (prevItems ? prevItems.filter((item) => !items.includes(item.id)) : prevItems));
			},
		}
	);
};
