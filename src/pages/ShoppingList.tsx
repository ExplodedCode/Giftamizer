import React from 'react';
import { useSnackbar } from 'notistack';

import { shoppingTourProgress, useClaimedItems, useGetTour, useUpdateTour } from '../lib/useSupabase';

import { Container, Grid, Typography, Box, CircularProgress, AppBar, Breadcrumbs, Toolbar, FormGroup, FormControlLabel, Checkbox, DialogActions, DialogContent, useTheme } from '@mui/material';

import ItemCard from '../components/ItemCard';
import { ItemStatuses, MemberItemType } from '../lib/useSupabase/types';
import TourTooltip from '../components/TourTooltip';
import { LoadingButton } from '@mui/lab';
import { useLocation } from 'react-router-dom';
import ItemCreate from '../components/ItemCreate';

export default function ShoppingList() {
	const theme = useTheme();

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

	return (
		<>
			<AppBar position='static' sx={{ marginBottom: 2 }} color='default'>
				<Toolbar variant='dense'>
					<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
						<Typography color='text.primary'>Claimed Items</Typography>
					</Breadcrumbs>

					<FormGroup>
						<FormControlLabel
							tour-element='shopping_filter'
							control={<Checkbox checked={hidePurchased} onChange={(e) => setHidePurchased(e.target.checked)} />}
							label='Show Purchased'
							color='inherit'
						/>
					</FormGroup>
				</Toolbar>
			</AppBar>

			<Container sx={{ paddingTop: 2, paddingBottom: 12 }}>
				<Grid container spacing={2}>
					{items
						?.filter((i) => !i.archived && !i.deleted)
						?.filter(filterItems)
						.map((item, index) => (
							// TODO: Change ItemCard to Renderer function to allow Grow transition/animation
							<ItemCard index={index} key={item.id} item={item} editable={item.shopping_item !== null} />
						))}

					{items?.filter((i) => !i.archived && !i.deleted)?.filter(filterItems).length === 0 && (
						<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
							<Typography variant='h5' gutterBottom>
								Your shopping list is empty!
							</Typography>
							<Typography variant='body1' gutterBottom>
								Mark items as planned to keep track of what to get for your friends and family.
							</Typography>
						</Box>
					)}
				</Grid>

				{isLoading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
						<CircularProgress />
					</Box>
				)}

				<ItemCreate shoppingItem />

				{tour && (
					<>
						<TourTooltip
							open={shoppingTourProgress(tour) === 'shopping_filter' && location.hash === ''}
							anchorEl={document.querySelector('[tour-element="shopping_filter"]')}
							placement='bottom'
							content={
								<>
									<DialogContent>
										<Typography>Purchased items are filtered out here.</Typography>
									</DialogContent>
									<DialogActions>
										<LoadingButton
											variant='outlined'
											color='inherit'
											onClick={() => {
												updateTour.mutateAsync({
													shopping_filter: true,
												});
											}}
											loading={updateTour.isLoading}
										>
											Got it
										</LoadingButton>
									</DialogActions>
								</>
							}
							backgroundColor={theme.palette.primary.main}
							color={theme.palette.primary.contrastText}
						/>

						<TourTooltip
							open={shoppingTourProgress(tour) === 'shopping_item' && location.hash === ''}
							anchorEl={document.querySelector('[tour-element="shopping_item_create_fab"]')}
							placement='bottom'
							content={
								<>
									<DialogContent>
										<Typography>Add items you plan on getting for other people even if they don't have it on their list.</Typography>
									</DialogContent>
									<DialogActions>
										<LoadingButton
											variant='outlined'
											color='inherit'
											onClick={() => {
												updateTour.mutateAsync({
													shopping_item: true,
												});
											}}
											loading={updateTour.isLoading}
										>
											Got it
										</LoadingButton>
									</DialogActions>
								</>
							}
							backgroundColor={theme.palette.primary.main}
							color={theme.palette.primary.contrastText}
						/>
					</>
				)}
			</Container>
		</>
	);
}
