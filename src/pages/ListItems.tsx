import React from 'react';
import { useSnackbar } from 'notistack';

import { useGetItems, useGetLists } from '../lib/useSupabase';

import { Container, Grid, Typography, Box, CircularProgress, Link as MUILink, AppBar, Breadcrumbs, Toolbar } from '@mui/material';

import ItemCreate from '../components/ItemCreate';
import ItemCard from '../components/ItemCard';
import { Link, useParams } from 'react-router-dom';
import NotFound from '../components/NotFound';

export default function ListItems() {
	const { list: listID } = useParams();
	const { enqueueSnackbar } = useSnackbar();

	const { data: lists, isLoading: loadingLists } = useGetLists();
	const { data: items, isLoading, isError, error } = useGetItems();

	React.useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get items! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	return (
		<>
			{loadingLists || isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					{lists?.find((l) => l.id === listID) ? (
						<>
							<AppBar position='static' sx={{ marginBottom: 2, bgcolor: 'background.paper' }}>
								<Toolbar variant='dense'>
									<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
										<MUILink underline='hover' color='inherit' component={Link} to='/lists'>
											Lists
										</MUILink>

										{listID && <Typography color='text.primary'>{lists?.find((l) => l.id === listID)?.name}</Typography>}
									</Breadcrumbs>
								</Toolbar>
							</AppBar>

							<Container sx={{ paddingTop: 2, paddingBottom: 12 }}>
								<Grid container spacing={2}>
									{items
										?.filter((i) => i.lists?.find((l) => l.list_id === listID))
										.map((item, index) => (
											// TODO: Change ItemCard to Renderer function to allow Grow transition/animation
											<ItemCard item={item} editable />
										))}

									{items?.filter((i) => i.lists?.find((l) => l.list_id === listID)).length === 0 && (
										<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
											<Typography variant='h5' gutterBottom>
												This list does not have any items!
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

							<ItemCreate defaultList={lists.find((l) => l.id === listID)!} />
						</>
					) : (
						<NotFound />
					)}
				</>
			)}
		</>
	);
}
