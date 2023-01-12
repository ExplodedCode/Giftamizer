import React from 'react';

import { useParams, useNavigate, Link } from 'react-router-dom';

import { useSupabase } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { Container, Card, CardActionArea, CardContent, CardMedia, CircularProgress, Grid, Link as MUILink, Typography, Box, Paper, Breadcrumbs, Button, AppBar, Toolbar } from '@mui/material';

import PersonIcon from '@mui/icons-material/Person';

import GroupSettingsDialog from '../components/GroupSettingsDialog';

export default function Groups() {
	const { group: groupID, user: userID } = useParams();

	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { client, user, groups } = useSupabase();

	const [loading, setLoading] = React.useState(true);
	const [members, setMembers] = React.useState<any[]>([]);

	React.useEffect(() => {
		if (groups.find((g) => g.id === groupID)) {
			setLoading(true);
			const getMembers = async () => {
				const { data, error } = await client
					.from('group_members')
					.select(
						`owner,
					profile:profiles!inner (
						user_id,
						name,
						avatar_token
					)`
					)
					.eq('group_id', groupID)
					.neq('profile.user_id', user.id);
				if (error) enqueueSnackbar(error.message, { variant: 'error' });

				setMembers(data!);
				setLoading(false);
			};
			getMembers();

			const myGroupsSubscription = client
				.channel(`public`)
				.on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
					getMembers();
				})
				.on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, (payload) => {
					getMembers();
				})
				.subscribe();

			return () => {
				client.removeChannel(myGroupsSubscription);
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [groupID, groups]);

	return (
		<>
			{groups.find((g) => g.id === groupID) ? (
				<>
					<AppBar position='static' sx={{ marginBottom: 2 }}>
						<Toolbar variant='dense'>
							<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
								{!userID && (
									<MUILink underline='hover' color='inherit' component={Link} to='/groups'>
										Groups
									</MUILink>
								)}
								{!userID ? (
									<Typography color='text.primary'>{groups.find((g) => g.id === groupID)?.name}</Typography>
								) : (
									<MUILink underline='hover' color='inherit' component={Link} to={`/groups/${groupID}`}>
										{groups.find((g) => g.id === groupID)?.name}
									</MUILink>
								)}
								{userID && <Typography color='text.primary'>{members.find((m) => m.profile.user_id === userID)?.profile.name}</Typography>}
							</Breadcrumbs>
							{!userID && <GroupSettingsDialog />}
						</Toolbar>
					</AppBar>
					{!userID ? (
						<Container>
							{loading ? (
								<Box sx={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
									<CircularProgress />
								</Box>
							) : (
								<Grid container justifyContent='center'>
									{members?.map((member) => (
										<Grid key={member.profile.user_id} item xs sx={{ maxWidth: { xs: '100%', sm: 250 }, margin: 1 }}>
											<Card sx={{ height: '100%' }}>
												<CardActionArea sx={{ height: '100%', display: 'grid', alignItems: 'start' }} onClick={() => navigate(`/groups/${groupID}/${member.profile.user_id}`)}>
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
															member.profile.avatar_token && member.profile.avatar_token !== -1
																? // @ts-ignore
																  `${client.supabaseUrl}/storage/v1/object/public/avatars/${member.profile.user_id}?${member.profile.avatar_token}`
																: undefined
														}
													>
														{member.profile.avatar_token && member.profile.avatar_token !== -1 ? '' : Array.from(String(member.profile.name).toUpperCase())[0]}
													</CardMedia>

													<CardContent>
														<Grid container>
															<Grid item xs>
																<Typography variant='h5' component='h2'>
																	{member.profile.name}
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
									{members.length === 0 && (
										<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
											This group has no members, invite some friends and family!
										</Typography>
									)}
								</Grid>
							)}
						</Container>
					) : members.find((m) => m.profile.user_id === userID) ? (
						<>{members.find((m) => m.profile.user_id === userID)?.profile.name}'s List</>
					) : (
						<>Member not found</>
					)}
				</>
			) : (
				<>Groups not found</>
			)}
		</>
	);
}
