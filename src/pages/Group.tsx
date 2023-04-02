import React from 'react';

import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';

import { useSupabase } from '../lib/useSupabase';
import { GroupType, Member } from '../lib/useSupabase/types';

import { Card, CardActionArea, CardContent, CardMedia, CircularProgress, Grid, Link as MUILink, Typography, Box, Breadcrumbs, AppBar, Toolbar, Checkbox, Grow } from '@mui/material';

import { PushPinOutlined, PushPin, Person } from '@mui/icons-material';

import GroupAdminSettingsDialog from '../components/GroupAdminSettingsDialog';
import GroupSettingsDialog from '../components/GroupSettingsDialog';

type GroupProps = {
	group: GroupType;
};

export default function Group(props: GroupProps) {
	const location = useLocation();
	const groupID = location.pathname.split('/groups/')[1].split('/')[0];

	const { user: userID } = useParams();

	const navigate = useNavigate();
	const { client, user } = useSupabase();

	const [members, setMembers] = React.useState<Member[] | undefined>([]);
	const [loading, setLoading] = React.useState<boolean>(true);

	const [member, setMember] = React.useState<Member | undefined>();

	const [groupPinLoading, setGroupPinLoading] = React.useState<boolean>(false);

	React.useEffect(() => {
		if (userID) {
			setMember(members?.find((m) => m.user_id === userID));
		} else {
			setMember(undefined);
		}
	}, [members, userID]);

	React.useEffect(() => {
		const getGroupMembers = async () => {
			const { data, error } = await client
				.from('group_members')
				.select(
					`user_id,
					owner,
					invite,
					profile:profiles(
							email,
							name,
							bio,
							avatar_token
						)
					)
					`
				)
				.neq('user_id', user.id)
				.eq('group_id', groupID);
			if (error) console.log(error);

			setMembers(data! as unknown as Member[]);

			setLoading(false);
		};

		if (groupID) {
			client
				.channel(`public:group_members:group_id=eq.${groupID}`)
				.on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupID}` }, (payload) => {
					getGroupMembers();
				})
				.subscribe();

			getGroupMembers();
		} else {
			setMembers([]);
		}
	}, [client, groupID, user.id]);

	const updatePinned = async (pinned: boolean) => {
		const { error } = await client.from('group_members').update({ pinned: pinned }).eq('group_id', groupID).eq('user_id', user.id);

		if (error) console.log(error);
		setGroupPinLoading(false);
	};

	return (
		<>
			{!userID && (
				<>
					<AppBar position='static' sx={{ marginBottom: 2, bgcolor: 'background.paper' }}>
						<Toolbar variant='dense'>
							<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
								<MUILink underline='hover' color='inherit' component={Link} to='/groups'>
									Groups
								</MUILink>
								<Typography color='text.primary'>{props.group.name}</Typography>
							</Breadcrumbs>

							<Checkbox
								size='small'
								icon={groupPinLoading ? <CircularProgress size={20} /> : <PushPinOutlined />}
								checkedIcon={groupPinLoading ? <CircularProgress size={20} /> : <PushPin />}
								sx={{ mr: 1, display: { xs: 'none', sm: 'none', md: 'flex' } }}
								checked={props.group.my_membership[0].pinned}
								onChange={(e) => {
									setGroupPinLoading(true);
									updatePinned(e.target.checked);
								}}
								disabled={groupPinLoading}
							/>

							{members && (props.group.my_membership[0].owner ? <GroupAdminSettingsDialog group={props.group} members={members} /> : <GroupSettingsDialog group={props.group} />)}
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
															  `${client.supabaseUrl}/storage/v1/object/public/avatars/${member.user_id}?${member.profile.avatar_token}`
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
															<Person />
														</Grid>
													</Grid>
												</CardContent>
											</CardActionArea>
										</Card>
									</Grid>
								</Grow>
							))}
						{members?.filter((m) => !m.invite).length === 0 && !loading && (
							<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
								This group has no members, invite some friends and family!
							</Typography>
						)}
					</Grid>
					{loading && (
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
							<CircularProgress />
						</Box>
					)}
				</>
			)}

			{userID && member && (
				<>
					<AppBar position='static' sx={{ marginBottom: 2, bgcolor: 'background.paper' }}>
						<Toolbar variant='dense'>
							<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
								<MUILink underline='hover' color='inherit' component={Link} to={`/groups/${props.group.id}`}>
									{props.group.name}
								</MUILink>
								<Typography color='text.primary'>{member.profile.name}</Typography>
							</Breadcrumbs>
						</Toolbar>
					</AppBar>

					<Grid container justifyContent='center'>
						<Grid item xs={9}>
							<Typography variant='h4' gutterBottom sx={{ mt: 4, textAlign: 'center' }}>
								{member.profile.name}
							</Typography>
							<Typography variant='body1' gutterBottom sx={{ textAlign: 'center' }}>
								{member.profile.bio}
							</Typography>
						</Grid>
					</Grid>

					<Grid container spacing={2}>
						<Grid item xs={12}>
							items
						</Grid>
					</Grid>
				</>
			)}
		</>
	);
}
