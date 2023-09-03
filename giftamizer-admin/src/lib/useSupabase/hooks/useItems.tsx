import { useQuery } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { FakeDelay } from '.';

export type ItemData = {
	items: Item[];
	count: number;
};

type Item = {
	id: string;
	email: string;
	full_name: string;
	raw_app_meta_data: any;
	created_at: string;
	signed_in: string;
	user: ItemProfile;
};
type ItemProfile = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
};

export const useGetItems = (page: number, pageSize: number, sorting: { field: string | undefined; sort: string | undefined }, search: string, match?: any) => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: ['items', page, pageSize, JSON.stringify(sorting), search],
		queryFn: async (): Promise<ItemData> => {
			await FakeDelay();

			let res;
			const query = client
				.from('items')
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
				items: res.data as unknown as Item[],
				count: res.count as number,
			};
		},
		keepPreviousData: true,
	});
};
