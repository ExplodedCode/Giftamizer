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
	/** Feature switch for the Feed page and nav. On by default; only an explicit false turns it off. */
	enable_feed?: boolean;
	/** Feed categories (FeedCategory keys) the user has chosen to hide. */
	feed_hidden?: string[];
	/** When the user last opened the Feed - drives the unread badge. */
	feed_seen_at?: string;
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

export interface ItemImage {
	id: string;
	url?: string;
	position: number;
}

/** Shape of an image while it's being edited in ItemImagesInput, before being
 * saved: `id` is only present for an already-persisted image, and `url` is
 * either its signed URL (unchanged), a fresh `data:` URL (new/re-cropped), or
 * '' for a persisted image whose signed URL failed to load (kept in the draft
 * so saving other edits doesn't delete it). `source` is the scraped remote URL
 * a `data:` image was imported from, used only to mark it "already added".
 * `tempId` is a client-only identity for a not-yet-persisted image (React key,
 * drag tracking) - never sent to the DB. */
export interface ItemImageDraft {
	id?: string;
	tempId?: string;
	url: string;
	source?: string;
}

export interface ItemType {
	id: string;
	user_id: string;
	images?: ItemImage[];
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

//#region Feed

export type FeedEventType =
	| 'item_added'
	| 'item_updated'
	| 'item_removed'
	| 'member_joined'
	| 'member_left'
	| 'member_promoted'
	| 'list_shared'
	| 'secret_santa_drawn'
	| 'group_updated'
	| 'profile_updated';

/** Categories a user can hide from their feed (profiles.feed_hidden). */
export type FeedCategory = 'items_new' | 'items_updated' | 'items_claimed' | 'group_members' | 'group_lists' | 'secret_santa' | 'group_updated' | 'profile_updated';

export const FEED_CATEGORIES: { key: FeedCategory; label: string; description: string }[] = [
	{ key: 'items_new', label: 'New items', description: 'Someone adds an item to a list shared with you' },
	{ key: 'items_updated', label: 'Edited items', description: 'Someone changes an item or its photos' },
	{ key: 'items_claimed', label: 'Items you claimed', description: 'An item you claimed is edited, archived or deleted' },
	{ key: 'group_members', label: 'Group members', description: 'People joining, leaving or becoming co-owners' },
	{ key: 'group_lists', label: 'Separate lists', description: 'Someone adds a separate (child) list to a group' },
	{ key: 'secret_santa', label: 'Secret Santa', description: 'Names drawn, and upcoming exchange dates' },
	{ key: 'group_updated', label: 'Group changes', description: 'A group is renamed or gets a new photo' },
	{ key: 'profile_updated', label: 'Profile changes', description: 'Someone updates their photo or bio' },
];

export interface FeedEvent {
	id: string;
	type: FeedEventType;
	category: FeedCategory;
	created_at: string;
	payload: {
		fields?: string[];
		name?: string;
		date?: string;
		redraw?: boolean;
		removed?: boolean;
		reason?: string;
		list_id?: string;
		list_name?: string;
		child_list?: boolean;
		old_name?: string;
		new_name?: string;
	};
	/** Groups where the viewer can see the item (item events only). */
	group_ids: string[];
	/** True only when the VIEWER claimed the item. */
	claimed_by_me: boolean;
	actor: { user_id: string; first_name: string; last_name: string; avatar_token: number | null; image?: string } | null;
	group: { id: string; name: string; image_token: number | null; image?: string } | null;
	item: { id: string; name: string; user_id: string; first_image_id: string | null; child_list_id: string | null; image?: string } | null;
	subject: { user_id: string; first_name: string; last_name: string } | null;
}

export interface FeedCursor {
	before: string;
	before_id: string;
}

export interface FeedPage {
	events: FeedEvent[];
	nextCursor?: FeedCursor;
}

//#endregion
