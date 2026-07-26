import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { useGetProfile } from './useProfile';
import { useGetGroups } from './useGroup';
import { TourSteps } from '../types';
import { useMediaQuery } from '../../utils';

const TOUR_QUERY_KEY = ['tour'];

export const useGetTour = () => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: TOUR_QUERY_KEY,
		queryFn: async (): Promise<TourSteps> => {
			const { data, error } = await client
				.from('profiles')
				.select(
					`user_id,
					tour`
				)
				.eq('user_id', user.id)
				.single();
			if (error) throw error;

			const tourData = data?.tour as TourSteps;

			return tourData;
		},
	});
};

export const useUpdateTour = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (tour: TourSteps): Promise<TourSteps> => {
			// Merge into the cache before awaiting the write. Steps then advance
			// immediately, and a second write that starts while this one is still in
			// flight reads the updated keys instead of silently dropping them - two
			// tour writes land close together whenever one click both advances a step
			// and opens a dialog.
			const nextTour: TourSteps = { ...(queryClient.getQueryData<TourSteps>(TOUR_QUERY_KEY) ?? {}), ...tour };
			queryClient.setQueryData(TOUR_QUERY_KEY, nextTour);

			const { data, error } = await client
				.from('profiles')
				.update({
					tour: nextTour,
				})
				.eq('user_id', user.id)
				.select(
					`user_id,
					tour`
				)
				.single();
			if (error) throw error;

			const tourData = data?.tour as TourSteps;
			return tourData;
		},
		{
			onSuccess: (tour: TourSteps) => {
				// Merge rather than replace - a concurrent write may already have
				// advanced the cache past what this response reflects.
				queryClient.setQueryData<TourSteps>(TOUR_QUERY_KEY, (previous) => ({ ...previous, ...tour }));
			},
		}
	);
};

/** Every step of the item tour marked done - backs the welcome callout's "Skip tour" button. */
export const SKIP_ITEM_TOUR: TourSteps = {
	item_create_fab: true,
	item_image: true,
	item_url: true,
	item_custom_fields: true,
	item_list_assign: true,
	item_create_btn: true,
};

/**
 * Steps follow the create-item form top to bottom. `item_list_assign` is skipped
 * when the Lists feature is off, since the selector it points at isn't rendered.
 */
export function itemTourProgress(tour: TourSteps, enableLists: boolean = false) {
	if (!tour.item_create_fab) return 'item_create_fab';
	if (!tour.item_image) return 'item_image';
	if (!tour.item_url) return 'item_url';
	if (!tour.item_custom_fields) return 'item_custom_fields';
	if (!tour.item_list_assign && enableLists) return 'item_list_assign';
	if (!tour.item_create_btn) return 'item_create_btn';

	return null;
}

export function groupInviteTourProgress(tour: TourSteps) {
	if (!tour.group_invite_nav) return 'group_invite_nav';
	if (!tour.group_invite_button) return 'group_invite_button';

	return null;
}

/** Every step of the group tour - including its group-settings leg - marked done. */
export const SKIP_GROUP_TOUR: TourSteps = {
	group_nav: true,
	group_create_fab: true,
	group_create_image: true,
	group_card: true,
	group_settings: true,
	group_pin: true,
	group_member_card: true,
	group_member_item_status: true,
	group_member_item_status_taken: true,
	group_member_item_filter: true,
	group_settings_add_people: true,
	group_settings_permissions: true,
	group_settings_secret_santa: true,
};

export function groupTourProgress(tour: TourSteps, isMobile: boolean) {
	if (!tour.item_create_fab) return 'item_create_fab';
	if (!tour.group_nav) return 'group_nav';
	if (!tour.group_create_fab) return 'group_create_fab';
	if (!tour.group_create_image) return 'group_create_image';
	if (!tour.group_card) return 'group_card';
	if (!tour.group_settings) return 'group_settings';
	if (!tour.group_pin && !isMobile) return 'group_pin';
	if (!tour.group_member_card) return 'group_member_card';
	if (!tour.group_member_item_status) return 'group_member_item_status';
	if (!tour.group_member_item_status_taken) return 'group_member_item_status_taken';
	if (!tour.group_member_item_filter) return 'group_member_item_filter';

	return null;
}

/**
 * Group-settings leg, reached by opening a group's Manage dialog. Every step
 * anchors to an owner-only control, so closing the dialog marks the whole leg
 * done rather than stalling members on controls they can't see.
 */
export function groupSettingsTourProgress(tour: TourSteps) {
	if (!tour.group_settings_add_people) return 'group_settings_add_people';
	if (!tour.group_settings_permissions) return 'group_settings_permissions';
	if (!tour.group_settings_secret_santa) return 'group_settings_secret_santa';

	return null;
}

/** Every step of the list tour marked done. `list_tour_start` stays set so the tour reads as begun-then-finished, not un-started. */
export const SKIP_LIST_TOUR: TourSteps = {
	list_tour_start: true,
	list_nav: true,
	list_intro: true,
	list_menu: true,
	list_group_assign: true,
};

export function listTourProgress(tour: TourSteps) {
	if (!tour.list_tour_start && !tour.list_nav) return 'list_tour_not_started';
	if (tour.list_tour_start && !tour.list_nav) return 'list_tour_start';
	if (!tour.list_nav) return 'list_nav';
	if (!tour.list_intro) return 'list_intro';
	if (!tour.list_menu) return 'list_menu';
	if (!tour.list_group_assign) return 'list_group_assign';

	return null;
}

/** Every step of the shopping tour marked done - backs the callouts' "Skip tour" buttons. */
export const SKIP_SHOPPING_TOUR: TourSteps = {
	shopping_nav: true,
	shopping_filter: true,
	shopping_item: true,
};

export function shoppingTourProgress(tour: TourSteps) {
	if (!tour.group_member_item_filter) return 'group_member_item_filter';
	if (!tour.shopping_nav) return 'shopping_nav';
	if (!tour.shopping_filter) return 'shopping_filter';
	if (!tour.shopping_item) return 'shopping_item';

	return null;
}

export type TourLeg = 'item' | 'group_invite' | 'group' | 'list' | 'shopping';

/**
 * Which tour leg currently owns the screen, highest priority first.
 *
 * The legs advance independently - Lists can be switched on halfway through the
 * group tour, and the shopping leg unlocks the instant the group leg ends - so
 * without a single arbiter two or three callouts fire at once. Every callout that
 * renders at `location.hash === ''` checks this before opening.
 *
 * Callouts scoped to a dialog hash (`#create-item`, `#new-group`, `#list-edit`,
 * `#group-settings`) don't need the check: nothing else renders over a dialog.
 */
export function useActiveTourLeg(): TourLeg | null {
	const { data: tour } = useGetTour();
	const { data: profile } = useGetProfile();
	const { data: groups } = useGetGroups();
	const isMobile = !useMediaQuery('(min-width: 900px)');

	if (!tour) return null;

	// The item leg only competes for the screen while its welcome callout is up -
	// every step after it lives behind the #create-item hash.
	if (!tour.item_create_fab) return 'item';

	// A pending invite outranks the rest: it's two steps, and the group tour has
	// little to say until the user has actually joined a group.
	if (groups?.some((g) => g.my_membership[0].invite) && groupInviteTourProgress(tour) !== null) return 'group_invite';

	if (groupTourProgress(tour, isMobile) !== null) return 'group';

	// `list_tour_not_started` means Lists was never switched on, which is not the
	// same as the leg being in progress.
	const listProgress = listTourProgress(tour);
	if (profile?.enable_lists && listProgress !== null && listProgress !== 'list_tour_not_started') return 'list';

	if (shoppingTourProgress(tour) !== null) return 'shopping';

	return null;
}
