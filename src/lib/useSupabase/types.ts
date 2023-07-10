import type { SupabaseClient, User } from '@supabase/supabase-js';

export type SupabaseContextType = {
	sb: SupabaseClient | null;
	user: User | null | undefined;
	error?: string | null;
};

export type SelectArg =
	| string
	| {
			str: string;
			head?: boolean;
			count?: null | 'exact' | 'planned' | 'estimated';
	  };

export type ProfileType = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
	bio: string;
	avatar_token: number | null;
	created_at?: string;
};

export interface MemberType {
	owner: boolean;
	profile: {
		user_id: string;
		first_name: string;
		last_name: string;
		avatar_token: number;
	};
}

export interface ItemType {
	id: string;
	user_id: string;
	name: string;
	description: string;
	url: string;
	created_at?: Date;
	updated_at?: Date;
}

export interface ListType {
	id: string;
	user_id: string;
	name: string;
	child_list: boolean;

	groups: Omit<GroupType, 'image_token' | 'my_membership'>[];

	created_at?: Date;
	updated_at?: Date;
}

export interface GroupType {
	id: string;
	name: string;
	image_token: number | null;
	my_membership: MyMembership[];
}

export interface Member {
	user_id: string;
	owner: boolean;
	invite: boolean;
	profile: Profile;

	deleted?: boolean;
	external?: boolean;
}

export interface ExternalInvite {
	invite_id: string;
	group_id: string;
	email: string;
	owner: boolean;

	created_at?: Date;
}

export interface MyMembership {
	group_id: string;
	user_id: string;
	owner: boolean;
	invite: boolean;
	pinned: boolean;
	created_at?: Date;
}

export interface Profile {
	email: string;
	first_name: string;
	last_name: string;
	bio: string;
	avatar_token: number | null;
}

export interface NotificationType {
	id: string;
	user_id: string;
	title: string;
	body: string;
	seen: boolean;
	icon?: string;
	action?: string;
	created_at?: Date;
}
