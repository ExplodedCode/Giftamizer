import { useQuery } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { FakeDelay } from '.';

export type UserData = {
	users: User[];
	count: number;
};

type User = {
	id: string;
	email: string;
	full_name: string;
	raw_app_meta_data: any;
	created_at: string;
	signed_in: string;
};

export const useGetUsers = (page: number, pageSize: number, sorting: { field: string | undefined; sort: string | undefined }, search?: string, match?: any) => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: ['users', page, pageSize, JSON.stringify(sorting), search],
		queryFn: async (): Promise<UserData> => {
			await FakeDelay();

			let res;
			const query = client
				.from('admin_users')
				.select('*', { count: 'exact' })
				.range(page * pageSize, (page + 1) * pageSize)
				.order(sorting?.field ?? 'email', { ascending: (sorting?.sort ?? 'asc') === 'asc' })
				.match(match ?? {});

			if (search) {
				res = await query.or(`id.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
			} else {
				res = await query;
			}

			if (res.error) throw res.error;

			return {
				users: res.data as unknown as User[],
				count: res.count as number,
			};
		},
		keepPreviousData: true,
	});
};

export enum RolesTypes {
	user = 'user',
	debug = 'debug',
	admin = 'admin',
}
export interface UserRole {
	roles: RolesTypes[];
}
export type UserRoles = {
	user_id: string;
	roles: UserRole;
	profile: RoleProfile;
};

export type RoleProfile = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
};
export type Profile = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
	image?: string;
	bio: string;
	enable_lists: boolean;
	enable_archive: boolean;
	enable_trash: boolean;
	avatar_token: number | null;
	created_at?: string;
	roles?: UserRoles;
};
export const useGetUser = (user_id: string) => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: ['user', user_id],
		queryFn: async (): Promise<Profile> => {
			await FakeDelay();

			const { data, error } = await client
				.from('profiles')
				.select(
					`*,
					roles:user_roles(
						roles
					)`
				)
				.eq('user_id', user_id)
				.single();
			if (error) throw error;
			var profile = data as unknown as Profile;

			// @ts-ignore
			profile.image = profile.avatar_token && profile.avatar_token !== -1 ? `${client.supabaseUrl}/storage/v1/object/public/avatars/${user_id}?${profile.avatar_token}` : undefined;

			return profile;
		},
	});
};
