import React from 'react';

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetGroupMembers, useGetGroups, useSetGroupPin } from '../lib/useSupabase';

import { Card, CardActionArea, CardContent, CardMedia, CircularProgress, Grid, Link as MUILink, Typography, Box, Breadcrumbs, AppBar, Toolbar, Checkbox, Grow } from '@mui/material';
import { PushPinOutlined, PushPin, Person, EscalatorWarning } from '@mui/icons-material';

import GroupSettingsDialog from '../components/GroupSettingsDialog';
import NotFound from '../components/NotFound';

export default function Group() {
	const { group: groupID, user: userID } = useParams();

	const navigate = useNavigate();
	const { data: groups, isLoading: groupsLoading } = useGetGroups();
	const { data: members, isLoading: membersLoading } = useGetGroupMembers(groupID!);
	const setGroupPin = useSetGroupPin();

	return (
		<>
			{groupsLoading || membersLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					{!userID && groups?.find((g) => g.id === groupID && !g.my_membership[0].invite) ? (
						<>
							<AppBar position='static' sx={{ marginBottom: 2, bgcolor: 'background.paper' }}>
								<Toolbar variant='dense'>
									<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
										<MUILink underline='hover' color='inherit' component={Link} to='/groups'>
											Groups
										</MUILink>
										<Typography color='text.primary'>{groups?.find((g) => g.id === groupID)?.name}</Typography>
									</Breadcrumbs>

									<Checkbox
										size='small'
										icon={setGroupPin.isLoading ? <CircularProgress size={20} /> : <PushPinOutlined />}
										checkedIcon={setGroupPin.isLoading ? <CircularProgress size={20} /> : <PushPin />}
										sx={{ mr: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }}
										checked={groups?.find((g) => g.id === groupID)?.my_membership[0].pinned}
										onChange={(e) => {
											setGroupPin.mutateAsync({ id: groupID!, pinned: e.target.checked });
										}}
										disabled={setGroupPin.isLoading}
									/>

									<GroupSettingsDialog group={groups?.find((g) => g.id === groupID)!} owner={groups?.find((g) => g.id === groupID)?.my_membership[0].owner!} />
								</Toolbar>
							</AppBar>
							<Grid container justifyContent='center'>
								{members
									?.filter((m) => !m.invite)
									.map((member, index) => (
										<Grow key={member.user_id} in={members.length > 0} style={{ transitionDelay: `${index * 25}ms` }}>
											<Grid key={member.user_id} item xs sx={{ maxWidth: { xs: '100%', sm: 250 }, margin: 1 }}>
												<Card sx={{ height: '100%' }}>
													<CardActionArea sx={{ height: '100%', display: 'grid', alignItems: 'start' }} onClick={() => navigate(`/groups/${groupID}/${member.user_id}`)}>
														<CardMedia
															sx={{
																height: 250,
																width: { xs: 'calc(100vw - 16px)', sm: 250 },
																fontSize: 150,
																lineHeight: 1.7,
																textAlign: 'center',
																backgroundColor: '#5cb660',
																color: '#fff',
															}}
															image={member.profile.image}
														>
															{member.profile.image ? '' : Array.from(String(member.profile.first_name).toUpperCase())[0]}
														</CardMedia>

														<CardContent>
															<Grid container>
																<Grid item xs>
																	<Typography variant='h5' component='h2'>
																		{member.profile.first_name} {member.profile.last_name}
																	</Typography>
																</Grid>
																<Grid item>{member.child_list ? <EscalatorWarning /> : <Person />}</Grid>
															</Grid>
														</CardContent>
													</CardActionArea>
												</Card>
											</Grid>
										</Grow>
									))}
								{members?.filter((m) => !m.invite).length === 0 && (!groupsLoading || !membersLoading) && (
									<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
										This group has no members, invite some friends and family!
									</Typography>
								)}
							</Grid>
						</>
					) : (
						<NotFound />
					)}
				</>
			)}
		</>
	);
}
