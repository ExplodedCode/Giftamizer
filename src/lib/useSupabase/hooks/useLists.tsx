import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { ListType } from '../types';

const QUERY_KEY = ['lists'];

export const useGetLists = () => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: async (): Promise<ListType[]> => {
			const { data, error } = await client.from('lists').select('*, groups( id, name )');
			if (error) throw error;

			return data as ListType[];
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
				})
				.select('*, groups( id, name )')
				.single();
			if (error) throw error;

			var newlist = data as Omit<ListType, 'id' | 'created_at' | 'updated_at'>;

			// Add list-group relationships
			for (let group of list.groups) {
				const { data: listGroupData, error: listGroupError } = await client
					.from('lists_groups')
					.insert({
						list_id: data.id,
						group_id: group.id,
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
				queryClient.setQueryData(QUERY_KEY, (prevLists: ListType[] | undefined) => (prevLists ? [list, ...prevLists] : [list]));
			},
		}
	);
};

export const useUpdateLists = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	return useMutation(
		async (list: Omit<ListType, 'user_id' | 'created_at' | 'updated_at'>): Promise<ListType> => {
			const { error } = await client
				.from('lists')
				.update({
					name: list.name,
					child_list: list.child_list,
				})
				.eq('id', list.id);
			if (error) throw error;

			// update list-group relationships
			const { data: listsData, error: ListsError } = await client.from('lists_groups').select('*').eq('list_id', list.id);
			if (ListsError) throw ListsError;
			for (let group of list.groups) {
				if (!listsData?.find((l) => l.group_id === group.id)) {
					const { error } = await client.from('lists_groups').upsert({
						list_id: list.id,
						group_id: group.id,
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
				queryClient.setQueryData(QUERY_KEY, (prevLists: ListType[] | undefined) => {
					if (prevLists) {
						const updatedLists = prevLists.map((list) => {
							return list.id == list_updated.id ? list_updated : list;
						});
						return updatedLists;
					}
					return prevLists;
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
				queryClient.setQueryData(QUERY_KEY, (prevLists: ListType[] | undefined) => (prevLists ? prevLists.filter((list) => list.id !== id) : prevLists));
			},
		}
	);
};
