import * as React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Gift } from 'lucide-react';

import { useSupabase } from '../lib/useSupabase';
import { FeedEvent } from '../lib/useSupabase/types';
import { cn } from '../lib/utils';

import { UserAvatar } from './ui/avatar';
import { Chip } from './ui/chip';

type Named = { first_name?: string | null; last_name?: string | null } | null | undefined;

const fullName = (person: Named) => [person?.first_name, person?.last_name].filter(Boolean).join(' ') || 'Someone';

const FIELD_LABELS: Record<string, string> = {
	name: 'name',
	description: 'description',
	links: 'links',
	details: 'details',
	images: 'photos',
};

function Strong({ children }: { children: React.ReactNode }) {
	return <strong className='font-semibold'>{children}</strong>;
}

/** Where tapping an event takes you. */
function eventLink(event: FeedEvent): string {
	const groupId = event.group?.id;

	switch (event.type) {
		case 'item_added':
		case 'item_updated': {
			const g = event.group_ids?.[0];
			if (!g || !event.item) return '/groups';
			// child lists are listed as `${user_id}_${list_id}` members
			const member = event.item.child_list_id ? `${event.item.user_id}_${event.item.child_list_id}` : event.item.user_id;
			return `/groups/${g}/${member}`;
		}
		case 'item_removed':
			// you claimed it - your shopping list is where you act on it
			return '/shopping';
		case 'profile_updated':
			return groupId && event.actor ? `/groups/${groupId}/${event.actor.user_id}` : '/groups';
		default:
			return groupId ? `/groups/${groupId}` : '/groups';
	}
}

function describe(event: FeedEvent, viewerId: string | undefined): { text: React.ReactNode; detail?: React.ReactNode } {
	const actor = <Strong>{fullName(event.actor)}</Strong>;
	const group = event.group?.name ? <Strong>{event.group.name}</Strong> : 'a group';
	const itemName = event.item?.name ?? event.payload.name;
	const item = <Strong>{itemName ?? 'an item'}</Strong>;
	const fields = (event.payload.fields ?? []).map((f) => FIELD_LABELS[f] ?? f);

	switch (event.type) {
		case 'item_added':
			return { text: <>{actor} added {item}</> };

		case 'item_updated':
			return {
				text: <>{actor} updated {item}</>,
				detail: fields.length > 0 ? <>Changed {fields.join(', ')}</> : undefined,
			};

		case 'item_removed':
			return {
				text: <>{actor} removed {item}, which you claimed</>,
				detail: <>It was {event.payload.reason === 'deleted' ? 'deleted' : 'archived'}, so you may not need to buy it.</>,
			};

		case 'member_joined':
			return { text: <>{actor} joined {group}</> };

		case 'member_left':
			return event.payload.removed
				? { text: <>{actor} removed <Strong>{fullName(event.subject)}</Strong> from {group}</> }
				: { text: <>{actor} left {group}</> };

		case 'member_promoted':
			return {
				text: <>{actor} made {event.subject?.user_id === viewerId ? <Strong>you</Strong> : <Strong>{fullName(event.subject)}</Strong>} a co-owner of {group}</>,
			};

		case 'list_shared':
			return {
				text: <>{actor} {event.payload.child_list ? 'added' : 'shared the list'} <Strong>{event.payload.list_name ?? 'a list'}</Strong> {event.payload.child_list ? 'to' : 'with'} {group}</>,
			};

		case 'secret_santa_drawn':
			return {
				text: (
					<>
						{actor} {event.payload.redraw ? 'redrew' : 'drew'} names for <Strong>{event.payload.name || 'Secret Santa'}</Strong> in {group}
					</>
				),
				detail: event.payload.date ? <>Gift exchange on {event.payload.date}</> : undefined,
			};

		case 'group_updated': {
			const renamed = event.payload.fields?.includes('name') && event.payload.old_name && event.payload.new_name;
			const photo = event.payload.fields?.includes('image');
			if (renamed) {
				return {
					text: <>{actor} renamed <Strong>{event.payload.old_name}</Strong> to <Strong>{event.payload.new_name}</Strong></>,
					detail: photo ? <>Also changed the group photo</> : undefined,
				};
			}
			return { text: <>{actor} {photo ? 'changed the photo of' : 'updated'} {group}</> };
		}

		case 'profile_updated': {
			const parts = [event.payload.fields?.includes('avatar') ? 'profile photo' : null, event.payload.fields?.includes('bio') ? 'bio' : null].filter(Boolean);
			return { text: <>{actor} updated their {parts.join(' and ') || 'profile'}</> };
		}

		default:
			return { text: <>{actor} made a change</> };
	}
}

export default function FeedEventRow({ event, isNew }: { event: FeedEvent; isNew?: boolean }) {
	const { user } = useSupabase();
	const { text, detail } = describe(event, user?.id);
	const claimed = event.claimed_by_me || event.type === 'item_removed';
	const thumbnail = event.item?.image ?? (event.type === 'group_updated' || event.type === 'secret_santa_drawn' ? event.group?.image : undefined);

	return (
		<Link
			to={eventLink(event)}
			className={cn(
				// same surface as Card / ItemCard
				'flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left text-card-foreground shadow-xs transition-shadow outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50 sm:p-4',
				claimed && 'border-status-planned/40',
			)}
		>
			<UserAvatar src={event.actor?.image} alt={fullName(event.actor)} className='size-9 shrink-0' />

			<div className='min-w-0 flex-1'>
				<p className='line-clamp-2 text-sm leading-snug [overflow-wrap:anywhere]'>{text}</p>
				{detail && <p className='mt-0.5 line-clamp-2 text-xs text-muted-foreground'>{detail}</p>}

				<div className='mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
					<span title={moment(event.created_at).format('LLL')}>{moment(event.created_at).fromNow()}</span>
					{event.group && (
						<Chip size='sm' className='max-w-40'>
							{event.group.name}
						</Chip>
					)}
					{claimed && event.type !== 'item_removed' && (
						<Chip size='sm' variant='planned'>
							You claimed this
						</Chip>
					)}
					{event.type === 'secret_santa_drawn' && (
						<Chip size='sm' variant='festive' icon={<Gift />}>
							See who you got
						</Chip>
					)}
				</div>
			</div>

			{thumbnail && <img src={thumbnail} alt='' loading='lazy' className='size-12 shrink-0 rounded-lg border border-border object-cover' />}
			{isNew && <span className='mt-1 size-2.5 shrink-0 rounded-full bg-primary' aria-label='New' />}
		</Link>
	);
}
