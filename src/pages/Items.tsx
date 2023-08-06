import React, { useEffect } from 'react';
import { useSnackbar } from 'notistack';

import { ExtractDomain, useDeleteItem, useGetItems, useGetProfile, useSupabase } from '../lib/useSupabase';
import { ItemType } from '../lib/useSupabase/types';

import { Container, Card, CardContent, CardMedia, Grid, Typography, Grow, Box, CircularProgress, Button, Stack, IconButton, Chip } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

import ItemUpdate from '../components/ItemUpdate';
import ItemCreate from '../components/ItemCreate';

// type ItemsProps = {};
export default function Items() {
	const { user } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const { data: profile } = useGetProfile();
	const { data: items, isLoading, isError, error } = useGetItems();
	const deleteItem = useDeleteItem();

	const [itemEdit, setItemEdit] = React.useState<ItemType | null>(null);

	useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get lists! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	return (
		<>
			<Container sx={{ paddingTop: 2, paddingBottom: 12 }}>
				<Grid container spacing={2}>
					{items?.map((i, index) => (
						<Grow key={i.id} in={items.length > 0} style={{ transitionDelay: `${index * 25}ms` }}>
							<Grid item xs={12}>
								<Card sx={{ display: { sm: 'flex', xs: 'none' } }}>
									<CardMedia component='img' sx={{ width: 151 }} image={`https://picsum.photos/300/200?id=${index}`} />
									<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
										<CardContent sx={{ flex: '1 0 auto' }}>
											<Typography component='div' variant='h6'>
												{i.name}
											</Typography>
											<Typography variant='subtitle1' color='text.secondary' component='div'>
												{i.description}
											</Typography>

											{profile?.enable_lists && (
												<>
													<Stack direction='row' justifyContent='flex-start' spacing={1}>
														{i.lists?.map((l) => (
															<Chip label={l.list.name} size='small' />
														))}
													</Stack>
												</>
											)}
										</CardContent>

										<Box sx={{ display: 'flex', alignItems: 'center', padding: 1 }}>
											<Grid container justifyContent='flex-start' spacing={2}>
												<Grid item xs>
													<Stack direction='row' justifyContent='flex-start' spacing={2}>
														<Button color='primary' onClick={() => setItemEdit(i)}>
															Edit
														</Button>

														{i.links?.map((link, i) => (
															<Button key={i} href={link} target='_blank' color='info'>
																{ExtractDomain(link)}
															</Button>
														))}
													</Stack>
												</Grid>
												<Grid item>
													<Button color='error' onClick={() => deleteItem.mutateAsync(i.id)}>
														Delete
													</Button>
												</Grid>
											</Grid>
										</Box>
									</Box>
								</Card>

								{/* Mobile card */}
								<Card sx={{ display: { sm: 'none', xs: 'block' } }}>
									<CardMedia component='img' alt='green iguana' height='240' image={`https://picsum.photos/300/200?id=${index}`} />
									<CardContent>
										<Typography variant='h5' component='div'>
											{i.name}
										</Typography>
										<Typography gutterBottom variant='body2' color='text.secondary'>
											{i.description}
										</Typography>

										{profile?.enable_lists && (
											<>
												<Stack direction='row' justifyContent='flex-start' spacing={1}>
													{i.lists?.map((l) => (
														<Chip label={l.list.name} size='small' />
													))}
												</Stack>
											</>
										)}

										<Stack direction='row' justifyContent='flex-start' spacing={1}>
											{i.links?.map((link, i) => (
												<Button key={i} href={link} target='_blank' color='info' size='small'>
													{ExtractDomain(link)}
												</Button>
											))}
										</Stack>
									</CardContent>
									{/* <Box sx={{ display: 'flex', alignItems: 'center', padding: 1 }}>
										<Grid container justifyContent='flex-start' spacing={2}>
											<Grid item xs>
											<Stack direction='row' justifyContent='flex-start' spacing={2}>
												<IconButton color='primary' onClick={() => setItemEdit(i)}>
													<Edit />
												</IconButton>
											</Stack>
											</Grid>
											<Grid item>
												<IconButton color='error' onClick={() => deleteItem.mutateAsync(i.id)}>
													<Delete />
												</IconButton>
											</Grid>
										</Grid>
									</Box> */}
								</Card>
							</Grid>
						</Grow>
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
			<ItemUpdate item={itemEdit} onClose={() => setItemEdit(null)} />
		</>
	);
}
