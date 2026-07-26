import React from 'react';
import { useSnackbar } from '../lib/snackbar';

import { shoppingTourProgress, useClaimedItems, useGetTour, useUpdateTour, useActiveTourLeg, SKIP_SHOPPING_TOUR } from '../lib/useSupabase';

import ItemCard, { ItemCardSkeletonList } from '../components/ItemCard';
import { ItemStatuses, MemberItemType } from '../lib/useSupabase/types';
import TourTooltip, { TourSkipButton } from '../components/TourTooltip';
import { useLocation } from 'react-router-dom';
import ItemCreate from '../components/ItemCreate';

import { Button } from '../components/ui/button';
import { LabeledCheckbox } from '../components/ui/checkbox';
import { PageHeader } from '../components/ui/page-header';

export default function ShoppingList() {
	const { enqueueSnackbar } = useSnackbar();
	const location = useLocation();

	const { data: items, isLoading, isError, error } = useClaimedItems();

	React.useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get items! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	const [hidePurchased, setHidePurchased] = React.useState<boolean>(false);

	const filterItems = (item: MemberItemType) => {
		let show = true;

		if (!hidePurchased) {
			if (item.status !== undefined && item.status?.status === ItemStatuses.unavailable) {
				show = false;
			}
		}

		return show;
	};

	//
	// user tour
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const activeTourLeg = useActiveTourLeg();

	const handleSkipTour = () => {
		updateTour.mutateAsync(SKIP_SHOPPING_TOUR);
	};

	return (
		<>
			<PageHeader
				crumbs={[{ label: 'Claimed Items' }]}
				actions={
					<div {...({ 'tour-element': 'shopping_filter' } as object)}>
						<LabeledCheckbox label='Show Purchased' checked={hidePurchased} onCheckedChange={(checked) => setHidePurchased(checked === true)} />
					</div>
				}
			/>

			<div className='mx-auto max-w-5xl px-4 pt-4 pb-12'>
				<div className='flex flex-col gap-3'>
					{items
						?.filter((i) => !i.archived && !i.deleted)
						?.filter(filterItems)
						.map((item, index) => (
							<ItemCard index={index} key={item.id} item={item} editable={item.shopping_item !== null} />
						))}

					{items?.filter((i) => !i.archived && !i.deleted)?.filter(filterItems).length === 0 && (
						<div className='mt-24 text-center'>
							<p className='mb-1 text-xl font-medium'>Your shopping list is empty!</p>
							<p className='text-muted-foreground'>Mark items as planned to keep track of what to get for your friends and family.</p>
						</div>
					)}
				</div>

				{isLoading && <ItemCardSkeletonList />}

				<ItemCreate shoppingItem />

				{tour && activeTourLeg === 'shopping' && (
					<>
						<TourTooltip
							open={shoppingTourProgress(tour) === 'shopping_filter' && location.hash === ''}
							anchorEl={document.querySelector('[tour-element="shopping_filter"]')}
							placement='bottom'
							content={
								<div>
									<p>Everything you've marked as planned or purchased lands here. Items you've already bought are hidden until you turn this on.</p>
									<div className='mt-1 flex justify-end gap-2'>
										<TourSkipButton onClick={handleSkipTour} loading={updateTour.isLoading}>
											Skip Shopping Tour
										</TourSkipButton>
										<Button
											variant='secondary'
											size='sm'
											onClick={() => {
												updateTour.mutateAsync({
													shopping_filter: true,
												});
											}}
											loading={updateTour.isLoading}
										>
											Next
										</Button>
									</div>
								</div>
							}
						/>

						<TourTooltip
							open={shoppingTourProgress(tour) === 'shopping_item' && location.hash === ''}
							anchorEl={document.querySelector('[tour-element="shopping_item_create_fab"]')}
							placement='top-end'
							content={
								<div>
									<p>Buying something that isn't on anyone's list? Add it here and it'll be tracked alongside the rest.</p>
									<div className='mt-1 flex justify-end'>
										<Button
											variant='secondary'
											size='sm'
											onClick={() => {
												updateTour.mutateAsync({
													shopping_item: true,
												});
											}}
											loading={updateTour.isLoading}
										>
											Got it
										</Button>
									</div>
								</div>
							}
							mask
							allowClick
						/>
					</>
				)}
			</div>
		</>
	);
}
