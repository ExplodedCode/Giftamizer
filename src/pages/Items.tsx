import React from 'react';

import { useSupabase } from '../lib/useSupabase';
import { ItemType } from '../lib/useSupabase/types';

import { Container, Card, CardContent, CardMedia, Grid, Typography, Grow, Box, CircularProgress, Button, Stack, IconButton } from '@mui/material';

import CreateItem from '../components/CreateItem';
import { Delete, Edit } from '@mui/icons-material';

// type ItemsProps = {};
export default function Items() {
	const { client } = useSupabase();

	const [loading, setLoading] = React.useState<boolean>(true);
	const [items, setItems] = React.useState<any[]>([]);

	React.useEffect(() => {
		const getItems = async () => {
			const { data, error } = await client.from('items').select(`*`);
			if (error) console.log(error);

			setItems(data as ItemType[]);
			setLoading(false);
		};

		getItems();
	}, [client]);

	return (
		<>
			<Container sx={{ paddingTop: 2, paddingBottom: 12 }}>
				<Grid container spacing={2}>
					{items.map((i, index) => (
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
										</CardContent>

										<Box sx={{ display: 'flex', alignItems: 'center', padding: 1 }}>
											<Grid container justifyContent='flex-start' spacing={2}>
												<Grid item xs>
													<Stack direction='row' justifyContent='flex-start' spacing={2}>
														<Button color='primary'>Edit</Button>
														<Button color='info'>amazon.com</Button>
													</Stack>
												</Grid>
												<Grid item>
													<Button color='error'>Delete</Button>
												</Grid>
											</Grid>
										</Box>
									</Box>
								</Card>

								{/* <Card sx={{ maxWidth: 345, display: { sm: 'none', xs: 'flex' } }}> */}
								<Card sx={{ display: { sm: 'none', xs: 'block' } }}>
									<CardMedia component='img' alt='green iguana' height='240' image={`https://picsum.photos/300/200?id=${index}`} />
									<CardContent>
										<Typography gutterBottom variant='h5' component='div'>
											{i.name}
										</Typography>
										<Typography variant='body2' color='text.secondary'>
											{i.description}
										</Typography>
									</CardContent>
									<Box sx={{ display: 'flex', alignItems: 'center', padding: 1 }}>
										<Grid container justifyContent='flex-start' spacing={2}>
											<Grid item xs>
												<Stack direction='row' justifyContent='flex-start' spacing={2}>
													<IconButton color='primary'>
														<Edit />
													</IconButton>
													<Button color='info'>amazon.com</Button>
												</Stack>
											</Grid>
											<Grid item>
												<IconButton color='error'>
													<Delete />
												</IconButton>
											</Grid>
										</Grid>
									</Box>
								</Card>
							</Grid>
						</Grow>
					))}

					{items.length === 0 && (
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
				{loading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
						<CircularProgress />
					</Box>
				)}
			</Container>

			<CreateItem />
		</>
	);
}
