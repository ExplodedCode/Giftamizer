import React from 'react';
import { useSnackbar } from 'notistack';

import { useGetItems } from '../lib/useSupabase';

import { Container, Grid, Typography, Box, CircularProgress } from '@mui/material';

import ItemCreate from '../components/ItemCreate';
import ItemCard from '../components/ItemCard';

export default function Items() {
	const { enqueueSnackbar } = useSnackbar();

	const { data: items, isLoading, isError, error } = useGetItems();

	React.useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get items! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	return (
		<>
			<Container sx={{ paddingTop: 2, paddingBottom: 12 }}>
				<Grid container spacing={2}>
					{items?.map((item, index) => (
						// TODO: Change ItemCard to Renderer function to allow Grow transition/animation
						<ItemCard item={item} editable />
					))}

					{items?.length === 0 && (
						<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
							<Typography variant='h5' gutterBottom>
								You don't have any items!
							</Typography>
							<Typography variant='body1' gutterBottom>
								Add some gift ideas to share with your friends and family!
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

			<ItemCreate />
		</>
	);
}
