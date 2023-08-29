import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { SystemType } from '../types';
import { FakeDelay } from '.';

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

export const useSetMaintenance = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (system: SystemType): Promise<SystemType> => {
			await FakeDelay(500); // fake delay

			const { data, error } = await client
				.from('system')
				.upsert({
					id: system.id!,
					maintenance: system.maintenance,
					updated_by: user.id,
				})
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
		{
			onSuccess: (system: SystemType) => {
				queryClient.setQueryData(SYSTEM_QUERY_KEY, system);
			},
		}
	);
};
