import React from 'react';
import { useSnackbar } from 'notistack';

import { useEmptyTrash, useGetItems } from '../lib/useSupabase';

import { Container, Grid, Typography, Box, CircularProgress, Button } from '@mui/material';
import { DeleteSweep } from '@mui/icons-material';

import ItemCard from '../components/ItemCard';

export default function ItemsTrash() {
	const { enqueueSnackbar } = useSnackbar();

	const { data: items, isLoading, isError, error } = useGetItems();

	React.useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get items! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	const emptyTrash = useEmptyTrash();
	const handleEmptyTrash = async () => {
		await emptyTrash.mutateAsync(items?.filter((i) => i.deleted).map((i) => i.id)!).catch((err) => {
			enqueueSnackbar(`Unable to restore item! ${err.message}`, { variant: 'error' });
		});
	};

	return (
		<>
			<Container sx={{ paddingTop: 2, paddingBottom: 12 }}>
				{items?.filter((i) => i.deleted).length !== 0 && (
					<Box sx={{ display: 'flex', justifyContent: 'center', m: 3 }}>
						<Button variant='outlined' color='error' size='medium' endIcon={<DeleteSweep />} onClick={handleEmptyTrash}>
							Empty Trash
						</Button>
					</Box>
				)}

				<Grid container spacing={2}>
					{items
						?.filter((i) => i.deleted)
						.map((item, index) => (
							// TODO: Change ItemCard to Renderer function to allow Grow transition/animation
							<ItemCard item={item} editable />
						))}

					{items?.filter((i) => i.deleted).length === 0 && (
						<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
							<Typography variant='h5' gutterBottom>
								Trash is empty!
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
