import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

import { useSupabase } from './useSupabase';
import { FakeDelay } from '.';

export const useGetCount = (table: string, match?: any) => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: [`${table}_count`],
		queryFn: async (): Promise<number | null> => {
			await FakeDelay();

			const { count, error } = await client
				.from(table)
				.select('*', { count: 'exact', head: true })
				.match(match ?? {});

			if (error) throw error;

			return count;
		},
	});
};

export type UserCreatedAtChartData = {
	time: Date;
	prettyTime: string;
	Users: number | null;
};

export const useGetUserCreatedAtData = () => {
	const { client } = useSupabase();

	type UserCreatedAt = {
		user_id: string;
		created_at: Date;
	};

	const generateChartData = (userData: UserCreatedAt[]) => {
		const data: UserCreatedAtChartData[] = [];

		const startTime = userData[0].created_at;

		let time = new Date(startTime);
		let now = new Date();

		while (time < now) {
			const Users = userData.filter((u) => new Date(u.created_at) < time).length;

			data.push({
				time: time,
				prettyTime: moment(time).format('L'),
				Users,
			});

			time.setDate(time.getDate() + 1);
		}

		return data;
	};

	return useQuery({
		queryKey: [`users_created_at_graph`],
		queryFn: async (): Promise<UserCreatedAtChartData[]> => {
			await FakeDelay();

			const { data, error } = await client.from('profiles').select('user_id, created_at').order('created_at', { ascending: true });

			if (error) throw error;

			return generateChartData(data as unknown as UserCreatedAt[]);
		},
	});
};

type RecentItem = {
	id: string;
	user_id: string;
	name: string;
	description: string;
	user: ItemProfile;
	created_at: Date;
};
type ItemProfile = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
};
export const useGetRecentItems = () => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: [`recent_items`],
		queryFn: async (): Promise<RecentItem[]> => {
			await FakeDelay();

			const { data, error } = await client
				.from('items')
				.select(
					`id,
					user_id,
					name,
					description,
					created_at,
					user:profiles!inner(
						user_id,
						email,
						first_name,
						last_name
					)`
				)
				.order('created_at', { ascending: false })
				.limit(5);
			if (error) throw error;

			return data as unknown as RecentItem[];
		},
	});
};
