import React from 'react';

import { useParams, useLocation } from 'react-router-dom';
import { useSupabase, useGetGroupMembers, useGetGroups, useGetMemberItems, groupTourProgress, useGetTour, useUpdateTour } from '../lib/useSupabase';

import { Filter } from 'lucide-react';

import NotFound from '../components/NotFound';
import ItemCard from '../components/ItemCard';
import { ItemStatuses, MemberItemType } from '../lib/useSupabase/types';
import TourTooltip, { TourContent } from '../components/TourTooltip';

import { cn, useMediaQuery } from '../lib/utils';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/ui/page-header';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Spinner } from '../components/ui/spinner';
import { LabeledSwitch } from '../components/ui/switch';

export default function Member() {
	const location = useLocation();
	const { group: groupID, user: userID } = useParams();

	const { user } = useSupabase();
	const { data: groups, isLoading: groupsLoading } = useGetGroups();
	const { data: members, isLoading: membersLoading } = useGetGroupMembers(groupID!);

	const user_id = userID!.split('_')[0] ?? userID!;
	const list_id = userID!.split('_')[1] ?? undefined;
	const { data: items, isLoading: memberLoading } = useGetMemberItems(groupID!, user_id, list_id);

	const [showUnavailableItems, setShowUnavailableItems] = React.useState<boolean>(false);

	const filterItems = (item: MemberItemType) => {
		let show = true;

		if (!showUnavailableItems) {
			if (item.status !== undefined && item.status?.user_id !== user.id && (item.status?.status === ItemStatuses.unavailable || item.status?.status === ItemStatuses.planned)) {
				show = false;
			}
		}

		return show;
	};

	//
	// User tour
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const isMobile = useMediaQuery('(max-width: 599.95px)');

	const filterActive = !showUnavailableItems && items?.filter((i) => !i.archived && !i.deleted)?.filter(filterItems).length !== items?.length && items?.length !== 0;

	return (
		<>
			{groupsLoading || membersLoading || memberLoading ? (
				<div className='mt-32 flex justify-center'>
					<Spinner size={32} />
				</div>
			) : (
				<>
					{userID && groups?.find((g) => g.id === groupID && !g.my_membership[0].invite) && members?.find((m) => m.user_id === userID && !m.invite) ? (
						<>
							<PageHeader
								crumbs={[
									{ label: groups?.find((g) => g.id === groupID)?.name, to: `/groups/${groups?.find((g) => g.id === groupID)?.id}` },
									{
										label: `${members?.find((m) => m.user_id === userID)?.profile.first_name} ${members?.find((m) => m.user_id === userID)?.profile.last_name}`,
									},
								]}
								actions={
									<Popover>
										<PopoverTrigger asChild>
											<button
												type='button'
												{...({ 'tour-element': 'group_member_item_filter' } as object)}
												className='relative flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
											>
												<Filter className={cn('size-5', filterActive && 'text-primary')} />
												{filterActive && <span className='absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive' />}
											</button>
										</PopoverTrigger>
										<PopoverContent align='end' className='w-auto'>
											<LabeledSwitch label='Show Claimed Items' checked={showUnavailableItems} onCheckedChange={(checked) => setShowUnavailableItems(checked === true)} />
										</PopoverContent>
									</Popover>
								}
							/>

							<div className='mx-auto max-w-5xl px-4'>
								<div className='mt-8 mb-4 text-center'>
									<h1 className='text-3xl font-semibold tracking-tight'>
										{members?.find((m) => m.user_id === userID)?.profile.first_name} {members?.find((m) => m.user_id === userID)?.profile.last_name}
									</h1>
									{members?.find((m) => m.user_id === userID)?.profile.bio && (
										<p className='mt-2 text-muted-foreground whitespace-pre-wrap'>{members?.find((m) => m.user_id === userID)?.profile.bio}</p>
									)}
								</div>

								<div className='flex flex-col gap-3 pb-12'>
									{items
										?.filter((i) => !i.archived && !i.deleted)
										?.filter(filterItems)
										.map((item, index) => (
											<ItemCard index={index} key={item.id} item={item} />
										))}

									{items?.filter((i) => !i.archived && !i.deleted)?.filter(filterItems).length === 0 && (
										<div className='mt-24 text-center'>
											<p className='text-xl font-medium'>No {items?.length !== 0 ? 'available ' : ''}items are shared with this group.</p>
										</div>
									)}
								</div>

								{memberLoading && (
									<div className='mt-32 flex justify-center'>
										<Spinner size={32} />
									</div>
								)}
							</div>

							{!groupsLoading && !membersLoading && !memberLoading && !showUnavailableItems && items?.length !== 0 && tour && (
								<>
									<TourTooltip
										open={groupTourProgress(tour, isMobile) === 'group_member_item_filter' && location.hash === ''}
										anchorEl={document.querySelector('[tour-element="group_member_item_filter"]')}
										placement='bottom'
										content={
											<TourContent title='Item Filter'>
												<p>Some items may not be shown if they've been claimed by someone else.</p>
												<div className='mt-1 flex justify-end'>
													<Button
														variant='secondary'
														size='sm'
														onClick={() => {
															if (!tour?.group_member_item_filter) {
																updateTour.mutateAsync({
																	group_member_item_filter: true,
																});
															}
														}}
														loading={updateTour.isLoading}
													>
														Got it
													</Button>
												</div>
											</TourContent>
										}
										mask
										allowClick
									/>
								</>
							)}
						</>
					) : (
						<NotFound />
					)}
				</>
			)}
		</>
	);
}
