import { useQuery } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { FakeDelay } from '.';

export type ListData = {
	lists: List[];
	count: number;
};

type List = {
	id: string;
	email: string;
	full_name: string;
	raw_app_meta_data: any;
	created_at: string;
	signed_in: string;
	user: ListProfile;
};
type ListProfile = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
};

export const useGetLists = (page: number, pageSize: number, sorting: { field: string | undefined; sort: string | undefined }, search: string, match?: any) => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: ['lists', page, pageSize, JSON.stringify(sorting), search, JSON.stringify(match)],
		queryFn: async (): Promise<ListData> => {
			await FakeDelay();

			let res;
			const query = client
				.from('lists')
				.select(
					`*,
						user:profiles!inner(
							user_id,
							email,
							first_name,
							last_name
						)`,
					{ count: 'exact' }
				)
				.range(page * pageSize, (page + 1) * pageSize)
				.order(sorting?.field ?? 'created_at', { ascending: (sorting?.sort ?? 'desc') === 'desc' })
				.match(match ?? {});

			if (search.length > 0) {
				res = await query.or(search);
			} else {
				res = await query;
			}

			if (res.error) throw res.error;

			return {
				lists: res.data as unknown as List[],
				count: res.count as number,
			};
		},
		keepPreviousData: true,
	});
};
