import React from 'react';

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetGroupMembers, useGetGroups, useGetMemberItems, useSetGroupPin, useSupabase } from '../lib/useSupabase';

import { Card, CardActionArea, CardContent, CardMedia, CircularProgress, Grid, Link as MUILink, Typography, Box, Breadcrumbs, AppBar, Toolbar, Checkbox, Grow } from '@mui/material';
import { PushPinOutlined, PushPin, Person } from '@mui/icons-material';

import GroupSettingsDialog from '../components/GroupSettingsDialog';
import NotFound from '../components/NotFound';
import { RealtimeChannel } from '@supabase/realtime-js';

export default function Member() {
	const { group: groupID, user: userID } = useParams();

	const navigate = useNavigate();
	const { client, user } = useSupabase();
	const { data: groups, isLoading: groupsLoading } = useGetGroups();
	const { data: members, isLoading: membersLoading } = useGetGroupMembers(groupID!);
	const { data: items, isLoading: memberLoading } = useGetMemberItems(groupID!, userID!);
	const setGroupPin = useSetGroupPin();

	React.useEffect(() => {
		// unsub from members realtime
		return () => {
			var groupMembersChannel = client.getChannels().find((c) => c.topic === `realtime:public:group_members:group_id=eq.${groupID}`);
			if (groupMembersChannel) client.removeChannel(groupMembersChannel);
			var externalInvitesChannel = client.getChannels().find((c) => c.topic === `realtime:public:external_invites:group_id=eq.${groupID}`);
			if (externalInvitesChannel) client.removeChannel(externalInvitesChannel);
		};
	}, [client, groupID]);

	return (
		<>
			{groupsLoading || membersLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					{userID && groups?.find((g) => g.id === groupID && !g.my_membership[0].invite) ? (
						<>
							<AppBar position='static' sx={{ marginBottom: 2, bgcolor: 'background.paper' }}>
								<Toolbar variant='dense'>
									<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
										<MUILink underline='hover' color='inherit' component={Link} to={`/groups/${groups?.find((g) => g.id === groupID)?.id}`}>
											{groups?.find((g) => g.id === groupID)?.name}
										</MUILink>
										<Typography color='text.primary'>
											{members?.find((m) => m.user_id === userID)?.profile.first_name} {members?.find((m) => m.user_id === userID)?.profile.last_name}
										</Typography>
									</Breadcrumbs>
								</Toolbar>
							</AppBar>

							<Grid container justifyContent='center'>
								<Grid item xs={9}>
									<Typography variant='h4' gutterBottom sx={{ mt: 4, textAlign: 'center' }}>
										{members?.find((m) => m.user_id === userID)?.profile.first_name} {members?.find((m) => m.user_id === userID)?.profile.last_name}
									</Typography>
									<Typography variant='body1' gutterBottom sx={{ textAlign: 'center' }}>
										{members?.find((m) => m.user_id === userID)?.profile.bio}
									</Typography>
								</Grid>
							</Grid>

							<Grid container spacing={2}>
								<Grid item xs={12}>
									{items?.map((i) => (
										<Typography key={i.id} variant='body1' gutterBottom>
											- {i.name}
										</Typography>
									))}
								</Grid>
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
