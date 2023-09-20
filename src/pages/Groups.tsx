import React from 'react';

import { Link, NavigateFunction, useNavigate, useParams } from 'react-router-dom';
import { TransitionGroup } from 'react-transition-group';

import { useGetGroups } from '../lib/useSupabase';
import { GroupType } from '../lib/useSupabase/types';

import { Container, Card, CardActionArea, CardContent, CardMedia, Grid, Typography, AppBar, Breadcrumbs, Link as MUILink, Toolbar, Grow, Box, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

import GroupCreate from '../components/GroupCreate';

interface RenderGroupProps {
	group: GroupType;
	navigate: NavigateFunction;
}
function RenderGroup({ group, navigate }: RenderGroupProps) {
	return (
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
						image={group.image}
					>
						{group.image ? '' : Array.from(String(group.name).toUpperCase())[0]}
					</CardMedia>

					<CardContent>
						<Typography variant='h5' component='h2'>
							{group.name}
						</Typography>
					</CardContent>
				</CardActionArea>
			</Card>
		</Grid>
	);
}

export default function Groups() {
	const { group: groupID, user: userID } = useParams();
	const navigate = useNavigate();
	const { data: groups, isLoading } = useGetGroups();

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

						{groupID && <Typography color='text.primary'>{groups?.find((g) => g.id === groupID)?.name}</Typography>}
					</Breadcrumbs>
				</Toolbar>
			</AppBar>

			<Container sx={{ paddingBottom: 12 }}>
				<TransitionGroup component={Grid} container justifyContent='center'>
					{groups
						?.filter((g) => !g.my_membership[0].invite)
						.map((group, index) => (
							<Grow key={group.id} style={{ transitionDelay: `${index * 25}ms` }}>
								{RenderGroup({ group: group, navigate: navigate })}
							</Grow>
						))}
				</TransitionGroup>
				{groups?.filter((g) => !g.my_membership[0].invite)?.length === 0 && (
					<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
						You don't have any groups, create or join a group with your friends and family!
					</Typography>
				)}

				{isLoading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
						<CircularProgress />
					</Box>
				)}
			</Container>

			<GroupCreate />
		</>
	);
}
