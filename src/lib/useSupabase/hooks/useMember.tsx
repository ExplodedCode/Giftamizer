import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { GROUPS_QUERY_KEY } from './useGroup';
import { ItemType } from '../types';

const MEMBER_ITEMS_QUERY_KEY = ['items'];

export const useGetMemberItems = (group_id: string, user_id: string) => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: [...GROUPS_QUERY_KEY, group_id, 'members', ...MEMBER_ITEMS_QUERY_KEY],
		queryFn: async (): Promise<ItemType[]> => {
			const { data, error } = await client.from('items').select(`*`).eq('user_id', user_id);
			if (error) throw error;

			console.log(data);

			return data as ItemType[];
		},
	});
};
