import type { SupabaseClient, User } from '@supabase/supabase-js';

export type SupabaseContextType = {
	sb: SupabaseClient | null;
	user: User | null | undefined;
	setUser: React.Dispatch<React.SetStateAction<User | null | undefined>> | undefined;

	error?: string | null;
};

// export type SelectArg =
// 	| string
// 	| {
// 			str: string;
// 			head?: boolean;
// 			count?: null | 'exact' | 'planned' | 'estimated';
// 	  };

export type SystemType = {
	id?: string;
	maintenance: boolean;
	updated_at: Date;
	user?: RoleProfileType;
};

export type UserRoleType = {
	user_id: string;
	roles: UserRole;
	profile: RoleProfileType;
};

export type RoleProfileType = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
};

export type ProfileType = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
	image?: string;
	bio: string;
	home: string;
	enable_lists: boolean;
	enable_archive: boolean;
	enable_trash: boolean;
	enable_snowfall: boolean;
	email_promotional: boolean;
	email_invites: boolean;
	avatar_token: number | null;
	created_at?: string;
	roles?: UserRole;
};

export interface UserRole {
	roles: UserRoles[];
}

export enum UserRoles {
	user = 'user',
	debug = 'debug',
	admin = 'admin',
}

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
	image?: string;
	name: string;
	description: string;
	links?: string[];
	domains?: string[];
	custom_fields?: CustomField[];

	archived: boolean;
	deleted: boolean;
	shopping_item: string | null;

	lists?: ItemListType[];
	newLists?: ListType[];

	created_at?: Date;
	updated_at?: Date;
}

export interface MemberItemType extends ItemType {
	status?: ItemStatus;
	profile?: Profile;

	items_lists?: any[];
}

export interface ItemStatus {
	item_id: string;
	user_id: string;
	status: ItemStatuses;
}

export enum ItemStatuses {
	available = 'A',
	planned = 'P',
	unavailable = 'U',
}

export interface CustomField {
	id: number;
	name: string;
	value: string;
}

export interface ItemListType {
	list_id: string;
	list: ItemListDetType;
}

export interface ItemListDetType {
	name: string;
	child_list: boolean;
}

export interface ListType {
	id: string;
	user_id: string;
	name: string;
	child_list: boolean;
	pinned?: boolean;
	image?: string;
	bio?: string;

	groups: Omit<GroupType, 'image_token' | 'my_membership'>[];

	created_at?: Date;
	updated_at?: Date;
}

export interface GroupType {
	id: string;
	name: string;
	invite_link: boolean;
	secret_santa: SecretSanta;
	image?: string;
	image_token: number | null;
	my_membership: MyMembership[];

	created_at?: Date;
	updated_at?: Date;
}

export interface SecretSanta {
	status: SecretSantaStatus;
	name?: string;
	date?: string;
	drawing?: SecretSantaDrawings;
}

export enum SecretSantaStatus {
	Init = 'init',
	On = 'on',
	Off = 'off',
}

export interface SecretSantaDrawings {
	[user_id: string]: string[];
}

export interface Member {
	user_id: string;
	owner: boolean;
	invite: boolean;
	profile: Profile;

	deleted?: boolean;
	child_list?: boolean;
	external?: boolean;

	created_at?: Date;
	updated_at?: Date;
}

export interface ExternalInvite {
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
	user_id?: string;
	email: string;
	first_name: string;
	last_name: string;
	bio: string;
	enable_lists: boolean;
	avatar_token: number | null;
	image?: string;
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

/**
 * Guided-tour progress. Keys are written to `profiles.tour` (jsonb) as the user
 * advances, so keys are only ever added or retired - never renamed. Retired keys
 * left over in a profile are harmless; they are simply never read again.
 *
 * Steps are listed in the order they are presented. See the `*TourProgress`
 * helpers in `hooks/useTour.tsx` for the sequencing.
 */
export interface TourSteps {
	item_create_fab?: boolean;
	item_image?: boolean;
	item_url?: boolean;
	item_custom_fields?: boolean;
	/** Only presented when the Lists feature is enabled. */
	item_list_assign?: boolean;
	item_create_btn?: boolean;

	group_invite_nav?: boolean;
	group_invite_button?: boolean;

	group_nav?: boolean;
	group_create_fab?: boolean;
	group_create_image?: boolean;
	group_card?: boolean;
	group_settings?: boolean;
	/** Desktop only - there is no sidebar to pin to on mobile. */
	group_pin?: boolean;
	group_member_card?: boolean;
	group_member_item_status?: boolean;
	group_member_item_status_taken?: boolean;
	group_member_item_filter?: boolean;

	/** Group-settings leg - only reachable by opening the group's Manage dialog. */
	group_settings_add_people?: boolean;
	group_settings_permissions?: boolean;
	group_settings_secret_santa?: boolean;

	list_tour_start?: boolean;
	list_nav?: boolean;
	list_intro?: boolean;
	list_menu?: boolean;
	list_group_assign?: boolean;

	shopping_nav?: boolean;
	shopping_filter?: boolean;
	shopping_item?: boolean;
}
