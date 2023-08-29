import React from 'react';
import { useSnackbar } from 'notistack';

import { useClaimedItems } from '../lib/useSupabase';

import { Container, Grid, Typography, Box, CircularProgress, AppBar, Breadcrumbs, Toolbar, FormGroup, FormControlLabel, Checkbox } from '@mui/material';

import ItemCreate from '../components/ItemCreate';
import ItemCard from '../components/ItemCard';
import { ItemStatuses, MemberItemType } from '../lib/useSupabase/types';

export default function ShoppingList() {
	const { enqueueSnackbar } = useSnackbar();

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

	return (
		<>
			<AppBar position='static' sx={{ marginBottom: 2, bgcolor: 'background.paper' }}>
				<Toolbar variant='dense'>
					<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
						<Typography color='text.primary'>Claimed Items</Typography>
					</Breadcrumbs>

					<FormGroup>
						<FormControlLabel control={<Checkbox checked={hidePurchased} onChange={(e) => setHidePurchased(e.target.checked)} />} label='Show Purchased' />
					</FormGroup>
				</Toolbar>
			</AppBar>

			<Container sx={{ paddingTop: 2, paddingBottom: 12 }}>
				<Grid container spacing={2}>
					{items?.filter(filterItems).map((item, index) => (
						// TODO: Change ItemCard to Renderer function to allow Grow transition/animation
						<ItemCard item={item} />
					))}

					{items?.filter(filterItems).length === 0 && (
						<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
							<Typography variant='h5' gutterBottom>
								Your shopping list is empty!
							</Typography>
							<Typography variant='body1' gutterBottom>
								Get some gifts for your friends and family!
							</Typography>
						</Box>
					)}
				</Grid>

				{isLoading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
						<CircularProgress />
					</Box>
				)}
			</Container>
		</>
	);
}
