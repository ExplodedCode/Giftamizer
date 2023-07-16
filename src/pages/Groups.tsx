import React from 'react';

import { Link, NavigateFunction, useNavigate, useParams } from 'react-router-dom';
import { TransitionGroup } from 'react-transition-group';

import { useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/realtime-js';
import { useSupabase, GROUPS_QUERY_KEY, useGetGroups, useRefreshGroup } from '../lib/useSupabase';
import { GroupType } from '../lib/useSupabase/types';

import { Container, Card, CardActionArea, CardContent, CardMedia, Grid, Typography, AppBar, Breadcrumbs, Link as MUILink, Toolbar, Grow, Box, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

import CreateGroup from '../components/CreateGroup';

interface RenderListItemProps {
	group: GroupType;
	navigate: NavigateFunction;
}
function RenderGroups({ group, navigate }: RenderListItemProps) {
	const { client } = useSupabase();

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
	);
}

export default function Groups() {
	const { group: groupID, user: userID } = useParams();
	const navigate = useNavigate();

	const queryClient = useQueryClient();

	const { user, client } = useSupabase();
	const { data: groups, isLoading } = useGetGroups();

	// const refreshGroup = useRefreshGroup();
	// React.useEffect(() => {
	// 	var sub: RealtimeChannel;
	// 	if (user) {
	// 		console.log('Subscribe realtime groups:', groupID);
	// 		sub = client
	// 			.channel(`public:group_members:user_id=eq.${user.id}`)
	// 			.on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` }, async (payload) => {
	// 				console.log(payload);

	// 				switch (payload.eventType) {
	// 					case 'INSERT':
	// 						refreshGroup.mutateAsync(payload.new.group_id);
	// 						break;
	// 					case 'UPDATE':
	// 						refreshGroup.mutateAsync(payload.new.group_id);
	// 						break;
	// 					case 'DELETE':
	// 						queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) =>
	// 							prevGroups ? prevGroups.filter((group) => group.id !== payload.old.group_id) : prevGroups
	// 						);
	// 						break;
	// 				}
	// 			})
	// 			.subscribe();
	// 	}

	// 	return () => {
	// 		client.removeChannel(sub);
	// 	};
	// }, [client, user]);

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

			<Container>
				<TransitionGroup component={Grid} container justifyContent='center'>
					{groups
						?.filter((g) => !g.my_membership[0].invite)
						.map((group, index) => (
							<Grow key={group.id} style={{ transitionDelay: `${index * 25}ms` }}>
								{RenderGroups({ group: group, navigate: navigate })}
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

			<CreateGroup />
		</>
	);
}
