import React from 'react';
import { useSnackbar } from 'notistack';

import { useGetItems } from '../lib/useSupabase';

import { Container, Grid, Typography, Box, CircularProgress } from '@mui/material';

import ItemCard from '../components/ItemCard';

export default function ItemArchive() {
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
					{items
						?.filter((i) => i.archived)
						.map((item, index) => (
							// TODO: Change ItemCard to Renderer function to allow Grow transition/animation
							<ItemCard key={item.id} item={item} editable />
						))}

					{items?.filter((i) => i.archived).length === 0 && (
						<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
							<Typography variant='h5' gutterBottom>
								Archive is empty!
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
