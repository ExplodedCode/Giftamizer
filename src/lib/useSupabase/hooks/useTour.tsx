import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { TourSteps } from '../types';

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
			const existingTour = queryClient.getQueryData(TOUR_QUERY_KEY) as TourSteps;

			const { data, error } = await client
				.from('profiles')
				.update({
					tour: { ...existingTour, ...tour },
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
				queryClient.setQueryData(TOUR_QUERY_KEY, tour);
			},
		}
	);
};

export function itemTourProgress(tour: TourSteps) {
	if (!tour.item_create_fab) return 'item_create_fab';
	if (!tour.item_name) return 'item_name';
	if (!tour.item_image) return 'item_image';
	if (!tour.item_url) return 'item_url';
	if (!tour.item_more_links) return 'item_more_links';
	if (!tour.item_custom_fields) return 'item_custom_fields';
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
	group_create_name: true,
	group_create_image: true,
	group_create: true,
	group_card: true,
	group_settings: true,
	group_pin: true,
	group_member_card: true,
	group_member_item_status: true,
	group_member_item_status_taken: true,
	group_member_item_filter: true,
	group_settings_add_people: true,
	group_settings_permissions: true,
};

export function groupTourProgress(tour: TourSteps, isMobile: boolean) {
	if (!tour.item_create_fab) return 'item_create_fab';
	if (!tour.group_nav) return 'group_nav';
	if (!tour.group_create_fab) return 'group_create_fab';
	if (!tour.group_create_name) return 'group_create_name';
	if (!tour.group_create_image) return 'group_create_image';
	if (!tour.group_create) return 'group_create';
	if (!tour.group_card) return 'group_card';
	if (!tour.group_settings) return 'group_settings';
	if (!tour.group_pin && !isMobile) return 'group_pin';
	if (!tour.group_member_card) return 'group_member_card';
	if (!tour.group_member_item_status) return 'group_member_item_status';
	if (!tour.group_member_item_status_taken) return 'group_member_item_status_taken';
	if (!tour.group_member_item_filter) return 'group_member_item_filter';

	return null;
}

export function groupSettingsTourProgress(tour: TourSteps) {
	if (!tour.group_settings_add_people) return 'group_settings_add_people';
	if (!tour.group_settings_permissions) return 'group_settings_permissions';

	return null;
}

/** Every step of the list tour marked done. `list_tour_start` stays set so the tour reads as begun-then-finished, not un-started. */
export const SKIP_LIST_TOUR: TourSteps = {
	list_tour_start: true,
	list_nav: true,
	list_intro: true,
	list_menu: true,
	list_edit: true,
	list_group_assign: true,
};

export function listTourProgress(tour: TourSteps) {
	if (!tour.list_tour_start && !tour.list_nav) return 'list_tour_not_started';
	if (tour.list_tour_start && !tour.list_nav) return 'list_tour_start';
	if (!tour.list_nav) return 'list_nav';
	if (!tour.list_intro) return 'list_intro';
	if (!tour.list_menu) return 'list_menu';
	if (!tour.list_edit) return 'list_edit';
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
