import { useNavigate } from 'react-router-dom';

import { useSupabase } from '../lib/useSupabase';

import { Container, Card, CardActionArea, CardContent, CardMedia, Grid, Typography, AppBar, Breadcrumbs, Button, Toolbar } from '@mui/material';

import PersonIcon from '@mui/icons-material/Person';

import CreateGroup from '../components/CreateGroup';

export default function Groups() {
	const navigate = useNavigate();

	const { groups } = useSupabase();

	return (
		<>
			<AppBar position='static' sx={{ marginBottom: 2 }}>
				<Toolbar variant='dense'>
					<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
						<Typography color='text.primary'>Groups</Typography>
					</Breadcrumbs>
				</Toolbar>
			</AppBar>
			<Container>
				<Grid container justifyContent='center'>
					{groups?.map((group) => (
						<Grid key={group.id} item xs sx={{ maxWidth: { xs: '100%', sm: 250 }, margin: 1 }}>
							<Card sx={{ height: '100%' }}>
								<CardActionArea sx={{ height: '100%', display: 'grid', alignItems: 'start' }} onClick={() => navigate(`/groups/${group.id}`)}>
									<CardMedia
										sx={{
											height: 250,
											width: { xs: 'calc(100vw - 48px)', sm: 250 },
											fontSize: 150,
											lineHeight: 1.7,
											textAlign: 'center',
											backgroundColor: '#5cb660',
											color: '#fff',
										}}
									>
										{Array.from(String(group.name).toUpperCase())[0]}
									</CardMedia>

									<CardContent>
										<Grid container>
											<Grid item xs>
												<Typography variant='h5' component='h2'>
													{group.name}
												</Typography>
											</Grid>
											<Grid item>
												<PersonIcon />
											</Grid>
										</Grid>
									</CardContent>
								</CardActionArea>
							</Card>
						</Grid>
					))}
					{groups.length === 0 && (
						<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
							You don't have any groups, create or join a group with your friends and family!
						</Typography>
					)}
				</Grid>
			</Container>
			<CreateGroup />
		</>
	);
}
