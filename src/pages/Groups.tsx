import React from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';

import { useSupabase } from '../lib/useSupabase';
import { GroupType } from '../lib/useSupabase/types';

import { Container, Card, CardActionArea, CardContent, CardMedia, Grid, Typography, AppBar, Breadcrumbs, Link as MUILink, Toolbar, Grow } from '@mui/material';

import PersonIcon from '@mui/icons-material/Person';

import CreateGroup from '../components/CreateGroup';

type GroupsProps = {
	groups: GroupType[];
};

export default function Groups(props: GroupsProps) {
	const { group: groupID, user: userID } = useParams();

	const navigate = useNavigate();
	const { client } = useSupabase();

	return (
		<>
			<AppBar position='static' sx={{ marginBottom: 2, bgcolor: 'background.paper' }}>
				<Toolbar variant='dense'>
					<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
						{!userID && !groupID && <Typography color='text.primary'>Groups</Typography>}

						{!userID && groupID && (
							<MUILink underline='hover' color='inherit' component={Link} to='/groups'>
								Groups
							</MUILink>
						)}

						{groupID && <Typography color='text.primary'>{props.groups.find((g) => g.id === groupID)?.name}</Typography>}
					</Breadcrumbs>
				</Toolbar>
			</AppBar>

			<Container>
				<Grid container justifyContent='center'>
					{props.groups
						.filter((g) => !g.my_membership[0].invite)
						.map((group, index) => (
							<Grow key={group.id} in={props.groups.length > 0} style={{ transitionDelay: `${index * 25}ms` }}>
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
												image={
													group.image_token && group.image_token !== -1
														? // @ts-ignore
														  `${client.supabaseUrl}/storage/v1/object/public/groups/${group.id}?${group.image_token}`
														: undefined
												}
											>
												{group.image_token && group.image_token !== -1 ? '' : Array.from(String(group.name).toUpperCase())[0]}
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
							</Grow>
						))}
					{props.groups.filter((g) => !g.my_membership[0].invite).length === 0 && (
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
