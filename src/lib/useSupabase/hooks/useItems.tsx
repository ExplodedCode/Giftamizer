import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { ItemType } from '../types';

const QUERY_KEY = ['items'];

export const useGetItems = () => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: async (): Promise<ItemType[]> => {
			const { data, error } = await client
				.from('items')
				.select(
					`*,
					lists:items_lists( 
						list_id,
						list:lists!inner(
							name
						)
					)`
				)
				.eq('user_id', user.id);
			if (error) throw error;

			console.log(data);

			return data as ItemType[];
		},
	});
};

export const useCreateItem = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (item: Omit<ItemType, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ItemType> => {
			const { data, error } = await client
				.from('items')
				.insert({
					user_id: user.id,
					name: item.name,
					description: item.description,
				})
				.select('*')
				.single();
			if (error) throw error;

			var newItem = data as Omit<ItemType, 'created_at' | 'updated_at'>;
			newItem.lists = [];

			// Add list-group relationships
			for (let list of item.newLists!) {
				const { data: itemListData, error: listGroupError } = await client
					.from('items_lists')
					.insert({
						item_id: newItem.id,
						list_id: list.id,
						user_id: user.id,
					})
					.select('*, list:lists( id, name )')
					.single();
				if (listGroupError) throw listGroupError;

				var itemList = itemListData as any;

				newItem.lists.push({
					list_id: list.id,
					list: {
						name: itemList.list.name,
					},
				});

				console.log({
					list_id: list.id,
					list: {
						name: itemList.list.name,
					},
				});
			}

			console.log(newItem);

			return newItem as ItemType;
		},
		{
			onSuccess: (item: ItemType) => {
				queryClient.setQueryData(QUERY_KEY, (prevItems: ItemType[] | undefined) => (prevItems ? [...prevItems, item] : [item]));
			},
		}
	);
};

export const useDeleteItem = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	return useMutation(
		async (id: string): Promise<string> => {
			const { error } = await client.from('items').delete().eq('id', id);
			if (error) throw error;
			return id;
		},
		{
			onSuccess: (id) => {
				queryClient.setQueryData(QUERY_KEY, (prevItems: ItemType[] | undefined) => (prevItems ? prevItems.filter((item) => item.id !== id) : prevItems));
			},
		}
	);
};
