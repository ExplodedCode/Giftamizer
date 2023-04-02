import type { SupabaseClient, User } from '@supabase/supabase-js';

export type SupabaseContextType = {
	sb: SupabaseClient | null;
	user: User | null | undefined;
	profile: ProfileType | null;
	// groups: GroupType[];
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
	name: string;
	bio: string;
	avatar_token: number;
	created_at: string;
};

export interface MemberType {
	owner: boolean;
	profile: {
		user_id: string;
		name: string;
		avatar_token: number;
	};
}

export interface GroupType {
	id: string;
	name: string;
	image_token: number;
	my_membership: MyMembership[];
}

export interface Member {
	user_id: string;
	owner: boolean;
	invite: boolean;
	profile: Profile;
}

export interface MyMembership {
	group_id: string;
	user_id: string;
	owner: boolean;
	invite: boolean;
	pinned: boolean;
	created_at: Date;
}

export interface Profile {
	email: string;
	name: string;
	bio: string;
	avatar_token: number;
}

export interface NotificationType {
	id: string;
	user_id: string;
	title: string;
	body: string;
	seen: boolean;
	icon?: string;
	action?: string;
	created_at: Date;
}
