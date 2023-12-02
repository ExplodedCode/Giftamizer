import { useQuery } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { SystemType } from '../types';

const SYSTEM_QUERY_KEY = ['system'];

export const useGetSystem = () => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: SYSTEM_QUERY_KEY,
		queryFn: async (): Promise<SystemType> => {
			const { data, error } = await client
				.from('system')
				.select(
					`*,
					user:profiles(
						user_id,
						email,
						first_name,
						last_name
					)`
				)
				.single();
			if (error) throw error;

			return data;
		},
		retry: 0,
	});
};
