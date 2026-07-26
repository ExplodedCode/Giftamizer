import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useSnackbar } from '../lib/snackbar';

import { Check, Clock, Gift } from 'lucide-react';

import { FakeDelay, groupTourProgress, useActiveTourLeg, useGetTour, useRefreshItem, useSupabase, useUpdateItemStatus, useUpdateTour } from '../lib/useSupabase';
import { ItemStatuses, MemberItemType } from '../lib/useSupabase/types';

import { cn, useMediaQuery } from '../lib/utils';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { SimpleTooltip } from './ui/tooltip';
import { TourHint } from './ui/tour-hint';

const STATUS_ICONS = {
	available: Gift,
	planned: Clock,
	purchased: Check,
} as const;

/** Demo status chip used inside the tour legend callouts. Mirrors the real claim button. */
function DemoStatusButton({ variant, faded, children }: { variant: 'available' | 'planned' | 'purchased'; faded?: boolean; children: React.ReactNode }) {
	const Icon = STATUS_ICONS[variant];

	return (
		<span
			className={cn(
				'inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium uppercase',
				variant === 'available' && (faded ? 'border-status-available/50 text-status-available/50' : 'border-status-available text-status-available'),
				variant === 'planned' && (faded ? 'border-status-planned/50 text-status-planned/50' : 'border-status-planned text-status-planned'),
				variant === 'purchased' && (faded ? 'border-status-purchased/50 text-status-purchased/50' : 'border-status-purchased text-status-purchased')
			)}
		>
			<Icon className='size-3.5' />
			{children}
		</span>
	);
}

export interface ItemStatusProps {
	index: number;
	item: MemberItemType;
	claimError: string | undefined;
	setClaimError(claimError: string | undefined): void;
}
export default function ItemStatus({ index, item, claimError, setClaimError }: ItemStatusProps) {
	const location = useLocation();

	const { enqueueSnackbar } = useSnackbar();
	const { user } = useSupabase();

	const { group: groupID, user: userID } = useParams();
	const user_id = userID?.split('_')[0] ?? userID!;
	const list_id = userID?.split('_')[1] ?? undefined;

	const refreshItem = useRefreshItem(groupID!, user_id, list_id);
	const updateItemStatus = useUpdateItemStatus(groupID!, user_id, list_id, item.shopping_item !== null);
	const handleUpdateItemStatus = async (status: ItemStatuses) => {
		await updateItemStatus.mutateAsync({ item_id: item.id, user_id: user.id, status: status }).catch(async (err) => {
			switch (err.code) {
				case '42501':
					enqueueSnackbar(`This item was just claimed by someone else!`, { variant: 'error' });
					setClaimError(`This item was just claimed by someone else!`);
					await FakeDelay(4000);
					await refreshItem.mutateAsync(item.id);
					break;

				default:
					enqueueSnackbar(`Unable to update item status! ${err.message}`, { variant: 'error' });
					break;
			}
		});
	};

	// user tour
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const activeTourLeg = useActiveTourLeg();
	const isMobile = useMediaQuery('(max-width: 599.95px)');

	const claimedByOther = item.status?.user_id !== undefined && item.status?.user_id !== user.id;
	const isDisabled = claimError !== undefined || claimedByOther;

	/** Single source of truth for the claim button — label, tint, icon and what a click does next. */
	const statusMeta = (() => {
		switch (item.status?.status) {
			default:
				return { label: 'Available', tone: 'available' as const, next: ItemStatuses.planned, nextLabel: 'Mark as Planned' };
			case ItemStatuses.planned:
				return { label: 'Planned', tone: 'planned' as const, next: ItemStatuses.unavailable, nextLabel: 'Mark as Purchased' };
			case ItemStatuses.unavailable:
				return { label: 'Purchased', tone: 'purchased' as const, next: ItemStatuses.available, nextLabel: 'Mark as Available' };
		}
	})();

	// Faded + unclickable: someone else got here first. A live claim error is a different state — it keeps
	// the full-strength tint so the shake reads, and the label gets struck through instead.
	const taken = claimedByOther && !claimError;
	const takenLabel = 'Already claimed by someone else';

	const claimButton = () => {
		const Icon = STATUS_ICONS[statusMeta.tone];

		return (
			<button
				type='button'
				// The status cycles, so name the *next* action — this is the only cue on touch, where tooltips never fire.
				aria-label={taken ? takenLabel : statusMeta.nextLabel}
				aria-disabled={isDisabled || undefined}
				className={cn(
					'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold tracking-wide uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
					statusMeta.tone === 'available' && (taken ? 'border-status-available/50 text-status-available/50' : 'border-status-available text-status-available hover:bg-status-available/10'),
					statusMeta.tone === 'planned' && (taken ? 'border-status-planned/50 text-status-planned/50' : 'border-status-planned text-status-planned hover:bg-status-planned/10'),
					statusMeta.tone === 'purchased' && (taken ? 'border-status-purchased/50 text-status-purchased/50' : 'border-status-purchased text-status-purchased hover:bg-status-purchased/10'),
					claimError && 'error-shake',
					isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
				)}
				onClick={() => {
					if (isDisabled || updateItemStatus.isLoading) return;
					handleUpdateItemStatus(statusMeta.next);
				}}
			>
				{/* Spinner replaces the icon rather than joining it, so the button keeps its width mid-mutation. */}
				{updateItemStatus.isLoading ? <Spinner size={14} className='text-current' /> : <Icon className='size-3.5' />}
				<span className={cn(claimError && 'line-through')}>{statusMeta.label}</span>
			</button>
		);
	};

	return (
		<>
			{index === 0 &&
			location.hash === '' &&
			location.pathname.startsWith('/groups/') &&
			activeTourLeg === 'group' &&
			(groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status' || groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status_taken') ? (
				<TourHint
					placement='bottom-start'
					open
					title={
						<>
							{groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status' && (
								<div className='flex flex-col gap-2'>
									<p className='text-base font-semibold'>Claim an item</p>
									<p>Click the status button to cycle it, so nobody buys the same gift twice.</p>

									<div className='flex flex-col gap-2 rounded-lg bg-card p-2.5 text-card-foreground'>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='available'>Available</DemoStatusButton>
											<span className='text-sm'>— nobody has claimed it</span>
										</div>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='planned'>Planned</DemoStatusButton>
											<span className='text-sm'>— you intend to buy it</span>
										</div>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='purchased'>Purchased</DemoStatusButton>
											<span className='text-sm'>— you've bought it</span>
										</div>
									</div>

									<div className='flex justify-end'>
										<Button
											variant='secondary'
											size='sm'
											loading={updateTour.isLoading}
											onClick={() => {
												if (!tour?.group_member_item_status) {
													updateTour.mutateAsync({
														group_member_item_status: true,
													});
												}
											}}
										>
											Next
										</Button>
									</div>
								</div>
							)}

							{groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status_taken' && (
								<div className='flex flex-col gap-2'>
									<p>A faded, unclickable button means someone else got there first.</p>

									<div className='flex flex-col gap-2 rounded-lg bg-card p-2.5 text-card-foreground'>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='planned' faded>
												Planned
											</DemoStatusButton>
											<span className='text-sm'>— someone else plans to buy it</span>
										</div>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='purchased' faded>
												Purchased
											</DemoStatusButton>
											<span className='text-sm'>— someone else already bought it</span>
										</div>
									</div>

									<div className='flex justify-end'>
										<Button
											variant='secondary'
											size='sm'
											loading={updateTour.isLoading}
											onClick={() => {
												if (!tour?.group_member_item_status_taken) {
													updateTour.mutateAsync({
														group_member_item_status_taken: true,
													});
												}
											}}
										>
											Got it
										</Button>
									</div>
								</div>
							)}
						</>
					}
				>
					{claimButton()}
				</TourHint>
			) : (
				<SimpleTooltip side='right' title={taken ? takenLabel : statusMeta.nextLabel}>
					{claimButton()}
				</SimpleTooltip>
			)}
		</>
	);
}
