import * as React from 'react';
import { Link, Navigate } from 'react-router-dom';
import moment from 'moment';
import { Gift, RefreshCw } from 'lucide-react';

import { useGetFeed, useGetGroups, useGetProfile, useMarkFeedSeen } from '../lib/useSupabase';
import { FeedEvent, SecretSantaStatus } from '../lib/useSupabase/types';
import { cn } from '../lib/utils';

import FeedEventRow from '../components/FeedEventRow';
import FeedFilter from '../components/FeedFilter';
import { PageHeader } from '../components/ui/page-header';
import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import { Button } from '../components/ui/button';

const UPCOMING_DAYS = 30;

function dayLabel(date: string) {
	const m = moment(date);
	if (m.isSame(moment(), 'day')) return 'Today';
	if (m.isSame(moment().subtract(1, 'day'), 'day')) return 'Yesterday';
	return m.format(m.isSame(moment(), 'year') ? 'dddd, MMMM D' : 'dddd, MMMM D, YYYY');
}

function FeedSkeleton() {
	return (
		<div className='flex flex-col gap-2'>
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className='flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4'>
					<Skeleton className='size-9 shrink-0 rounded-full' />
					<div className='flex flex-1 flex-col gap-2'>
						<Skeleton className='h-4 w-4/5' />
						<Skeleton className='h-3 w-1/3' />
					</div>
					<Skeleton className='size-12 shrink-0' />
				</div>
			))}
		</div>
	);
}

/**
 * Secret Santa exchanges coming up soon. Worked out on the client from the
 * groups the user is already loading, so no scheduled job is needed.
 */
function UpcomingSecretSanta({ hidden }: { hidden: boolean }) {
	const { data: groups } = useGetGroups();
	if (hidden) return null;

	const upcoming = (groups ?? [])
		.filter((g) => !g.my_membership[0]?.invite && g.secret_santa?.status === SecretSantaStatus.On && g.secret_santa.date)
		.map((g) => ({ group: g, days: moment(g.secret_santa.date, 'LL').startOf('day').diff(moment().startOf('day'), 'days') }))
		.filter(({ days }) => days >= 0 && days <= UPCOMING_DAYS)
		.sort((a, b) => a.days - b.days);

	if (upcoming.length === 0) return null;

	return (
		<div className='mb-4 flex flex-col gap-2'>
			{upcoming.map(({ group, days }) => (
				// wraps: on narrow screens the button drops to its own full-width row instead of squeezing the text
				<div key={group.id} className='flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-festive/40 bg-festive/10 p-3'>
					<span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-festive/20 text-festive-foreground dark:text-festive'>
						<Gift className='size-5' />
					</span>
					<div className='min-w-0 flex-1 basis-40'>
						<p className='text-sm leading-snug font-semibold [overflow-wrap:anywhere]'>
							{group.secret_santa.name || 'Secret Santa'} is {days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}
						</p>
						<p className='text-xs text-muted-foreground [overflow-wrap:anywhere]'>
							{group.name} · {group.secret_santa.date}
						</p>
					</div>
					<Button asChild size='sm' variant='secondary' className='max-sm:w-full'>
						<Link to={`/groups/${group.id}`}>See who you got</Link>
					</Button>
				</div>
			))}
		</div>
	);
}

// The route stays registered, but when the user has turned the Feed off in
// Settings it just bounces to Items - before any feed data is fetched.
export default function Feed() {
	const { data: profile } = useGetProfile();

	if (!profile) return null;
	if (profile.enable_feed === false) return <Navigate to='/items' replace />;

	return <FeedPage />;
}

function FeedPage() {
	const { data: profile } = useGetProfile();
	const feed = useGetFeed();
	const markSeen = useMarkFeedSeen();

	// Remember what "last seen" was when the page opened, so new rows stay
	// highlighted even after we mark the feed as seen.
	const [seenAt, setSeenAt] = React.useState<string | undefined>();
	React.useEffect(() => {
		if (seenAt === undefined && profile?.feed_seen_at) setSeenAt(profile.feed_seen_at);
	}, [profile?.feed_seen_at, seenAt]);

	const marked = React.useRef(false);
	React.useEffect(() => {
		if (seenAt !== undefined && feed.isSuccess && !marked.current) {
			marked.current = true;
			markSeen.mutate();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [seenAt, feed.isSuccess]);

	// infinite scroll
	const sentinel = React.useRef<HTMLDivElement>(null);
	const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
	React.useEffect(() => {
		const el = sentinel.current;
		if (!el || !hasNextPage) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
			},
			{ rootMargin: '400px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const events: FeedEvent[] = feed.data?.pages.flatMap((p) => p.events) ?? [];
	const days = events.reduce<{ label: string; events: FeedEvent[] }[]>((acc, event) => {
		const label = dayLabel(event.created_at);
		const last = acc[acc.length - 1];
		if (last && last.label === label) last.events.push(event);
		else acc.push({ label, events: [event] });
		return acc;
	}, []);

	const hiddenCategories = profile?.feed_hidden ?? [];

	return (
		<>
			<PageHeader
				crumbs={[{ label: 'Feed' }]}
				actions={
					<>
						<button
							type='button'
							aria-label='Refresh feed'
							onClick={() => feed.refetch()}
							disabled={feed.isFetching}
							className='flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default'
						>
							<RefreshCw className={cn('size-5', feed.isRefetching && 'animate-spin')} />
						</button>
						<FeedFilter />
					</>
				}
			/>

			<div className='mx-auto max-w-2xl px-4 pt-4 pb-12'>
				<UpcomingSecretSanta hidden={hiddenCategories.includes('secret_santa')} />

				{feed.isLoading ? (
					<FeedSkeleton />
				) : feed.isError ? (
					<div className='mt-24 text-center'>
						<p className='mb-1 text-xl font-medium'>Couldn't load your feed</p>
						<p className='mb-4 text-muted-foreground'>Check your connection and try again.</p>
						<Button variant='secondary' onClick={() => feed.refetch()}>
							Try again
						</Button>
					</div>
				) : events.length === 0 ? (
					<div className='mt-24 text-center'>
						<p className='mb-1 text-xl font-medium'>Nothing new from your groups yet</p>
						<p className='text-muted-foreground'>
							{hiddenCategories.length > 0
								? 'Some kinds of updates are hidden - use the filter to change that.'
								: "When people in your groups add or change items, you'll see it here."}
						</p>
					</div>
				) : (
					<div className='flex flex-col gap-4'>
						{days.map((day) => (
							<section key={day.label}>
								<h2 className='sticky top-12 z-[5] -mx-4 bg-background/95 px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur-sm'>{day.label}</h2>
								<div className='mt-1 flex flex-col gap-2'>
									{day.events.map((event) => (
										<FeedEventRow key={event.id} event={event} isNew={seenAt !== undefined && moment(event.created_at).isAfter(seenAt)} />
									))}
								</div>
							</section>
						))}

						<div ref={sentinel} className='flex h-10 items-center justify-center'>
							{isFetchingNextPage && <Spinner size={24} />}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
