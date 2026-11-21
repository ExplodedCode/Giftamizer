import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { FeedCursor, FeedEvent, FeedPage, ProfileType } from '../types';
import { getSignedUrls } from '../storageUrls';

export const FEED_QUERY_KEY = ['feed'];
const FEED_UNREAD_QUERY_KEY = ['feed', 'unread'];
const PROFILE_QUERY_KEY = ['profile'];
const PAGE_SIZE = 30;

const hasImage = (token: number | null | undefined) => token !== null && token !== undefined && token !== -1;

/**
 * Feed events come from the get_feed() RPC (see Giftamizer-Supabase 0016).
 * The RPC returns image *tokens/ids*; buckets are private, so every page is
 * signed in one batch per bucket here.
 */
async function resolveFeedImages(client: ReturnType<typeof useSupabase>['client'], events: FeedEvent[]): Promise<FeedEvent[]> {
	const avatarPaths = new Set<string>();
	const groupPaths = new Set<string>();
	const itemPaths = new Set<string>();

	events.forEach((e) => {
		if (e.actor && hasImage(e.actor.avatar_token)) avatarPaths.add(e.actor.user_id);
		if (e.group && hasImage(e.group.image_token)) groupPaths.add(e.group.id);
		if (e.item?.first_image_id) itemPaths.add(`${e.item.id}/${e.item.first_image_id}`);
	});

	const [avatars, groups, items] = await Promise.all([
		getSignedUrls(client, 'avatars', [...avatarPaths]),
		getSignedUrls(client, 'groups', [...groupPaths]),
		getSignedUrls(client, 'items', [...itemPaths]),
	]);

	return events.map((e) => ({
		...e,
		actor: e.actor ? { ...e.actor, image: avatars[e.actor.user_id] } : null,
		group: e.group ? { ...e.group, image: groups[e.group.id] } : null,
		item: e.item ? { ...e.item, image: e.item.first_image_id ? items[`${e.item.id}/${e.item.first_image_id}`] : undefined } : null,
	}));
}

/** Paged feed of changes made by other people. Newest first. */
export const useGetFeed = () => {
	const { client } = useSupabase();

	return useInfiniteQuery({
		queryKey: FEED_QUERY_KEY,
		queryFn: async ({ pageParam }: { pageParam?: FeedCursor }): Promise<FeedPage> => {
			const { data, error } = await client.rpc('get_feed', {
				_before: pageParam?.before ?? null,
				_before_id: pageParam?.before_id ?? null,
				_limit: PAGE_SIZE,
			});
			if (error) throw error;

			const rows = (data ?? []) as unknown as FeedEvent[];
			const events = await resolveFeedImages(client, rows);
			const last = rows[rows.length - 1];

			return {
				events,
				nextCursor: rows.length === PAGE_SIZE && last ? { before: last.created_at, before_id: last.id } : undefined,
			};
		},
		getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor,
		// the app-wide default is refetchOnMount: false - a feed must be fresh when opened
		refetchOnMount: 'always',
		staleTime: 0,
	});
};

/** Number of unseen feed events (capped at 99 by the database). Polled - the activity table is not on realtime. */
export const useFeedUnreadCount = () => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: FEED_UNREAD_QUERY_KEY,
		queryFn: async (): Promise<number> => {
			const { data, error } = await client.rpc('get_feed_unread_count');
			if (error) throw error;
			return (data as number) ?? 0;
		},
		enabled: !!user,
		refetchInterval: 120_000,
		refetchOnWindowFocus: true,
		refetchOnMount: 'always',
		retry: 1,
	});
};

/** Marks everything currently in the feed as seen (clears the unread badge). */
export const useMarkFeedSeen = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (): Promise<string> => {
			const seenAt = new Date().toISOString();
			const { error } = await client.from('profiles').update({ feed_seen_at: seenAt }).eq('user_id', user.id);
			if (error) throw error;
			return seenAt;
		},
		{
			onSuccess: (seenAt) => {
				queryClient.setQueryData(FEED_UNREAD_QUERY_KEY, 0);
				queryClient.setQueryData<ProfileType | undefined>(PROFILE_QUERY_KEY, (profile) => (profile ? { ...profile, feed_seen_at: seenAt } : profile));
			},
		},
	);
};

/** Saves the list of hidden feed categories. Optimistic, so rapid toggles compose. */
export const useUpdateFeedHidden = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (hidden: string[]): Promise<string[]> => {
			const { error } = await client.from('profiles').update({ feed_hidden: hidden }).eq('user_id', user.id);
			if (error) throw error;
			return hidden;
		},
		{
			onMutate: async (hidden) => {
				await queryClient.cancelQueries(PROFILE_QUERY_KEY);
				const previous = queryClient.getQueryData<ProfileType>(PROFILE_QUERY_KEY);
				queryClient.setQueryData<ProfileType | undefined>(PROFILE_QUERY_KEY, (profile) => (profile ? { ...profile, feed_hidden: hidden } : profile));
				return { previous };
			},
			onError: (_error, _hidden, context) => {
				if (context?.previous) queryClient.setQueryData(PROFILE_QUERY_KEY, context.previous);
			},
			onSettled: () => {
				// the visible set (and the unread count) changed server-side
				queryClient.invalidateQueries(FEED_QUERY_KEY);
			},
		},
	);
};
