import React from 'react';

import { useParams, Link } from 'react-router-dom';
import { useGetGroupMembers, useGetGroups, useGetMemberItems, useSupabase } from '../lib/useSupabase';

import { CircularProgress, Grid, Link as MUILink, Typography, Box, Breadcrumbs, AppBar, Toolbar, Container } from '@mui/material';

import NotFound from '../components/NotFound';
import ItemCard from '../components/ItemCard';

export default function Member() {
	const { group: groupID, user: userID } = useParams();

	const { client } = useSupabase();
	const { data: groups, isLoading: groupsLoading } = useGetGroups();
	const { data: members, isLoading: membersLoading } = useGetGroupMembers(groupID!);

	const user_id = userID!.split('_')[0] ?? userID!;
	const list_id = userID!.split('_')[1] ?? undefined;
	const { data: items, isLoading: memberLoading } = useGetMemberItems(groupID!, user_id, list_id);

	React.useEffect(() => {
		// unsub from realtime
		return () => {
			var itemRealtimeChannel = client.getChannels().find((c) => c.topic === `realtime:public:item_links:realtime=eq.${groupID}.${user_id}${list_id ? `_${list_id}` : ''}`);
			if (itemRealtimeChannel) client.removeChannel(itemRealtimeChannel);
		};
	}, [client, groupID, user_id, list_id]);

	return (
		<>
			{groupsLoading || membersLoading || memberLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					{userID && groups?.find((g) => g.id === groupID && !g.my_membership[0].invite) && members?.find((m) => m.user_id === userID && !m.invite) ? (
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
								<Grid item xs={12}>
									<Typography variant='h4' gutterBottom sx={{ mt: 4, textAlign: 'center' }}>
										{members?.find((m) => m.user_id === userID)?.profile.first_name} {members?.find((m) => m.user_id === userID)?.profile.last_name}
									</Typography>
									<Typography variant='body1' gutterBottom sx={{ textAlign: 'center' }}>
										{members?.find((m) => m.user_id === userID)?.profile.bio}
									</Typography>
								</Grid>
							</Grid>

							<Container sx={{ paddingTop: 2, paddingBottom: 12 }}>
								<Grid container spacing={2}>
									{items?.map((item, index) => (
										// TODO: Change ItemCard to Renderer function to allow Grow transition/animation
										<ItemCard item={item} />
									))}

									{items?.length === 0 && (
										<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
											<Typography variant='h5' gutterBottom>
												No items are shared with this group.
											</Typography>
										</Box>
									)}
								</Grid>

								{memberLoading && (
									<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
										<CircularProgress />
									</Box>
								)}
							</Container>
						</>
					) : (
						<NotFound />
					)}
				</>
			)}
		</>
	);
}
