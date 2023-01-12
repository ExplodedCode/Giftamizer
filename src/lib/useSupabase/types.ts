import type { SupabaseClient, User } from '@supabase/supabase-js';

export type SupabaseContextType = {
	sb: SupabaseClient | null;
	user: User | null | undefined;
	profile: ProfileType | null;
	groups: GroupType[];
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
	avatar_token: number;
	created_at: string;
};

export type GroupType = {
	id: string;
	name: string;
	avatar_token: number;
};
