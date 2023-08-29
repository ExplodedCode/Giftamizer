import React from 'react';

import { useParams, Link } from 'react-router-dom';
import { useSupabase, useGetGroupMembers, useGetGroups, useGetMemberItems } from '../lib/useSupabase';

import { CircularProgress, Grid, Link as MUILink, Typography, Box, Breadcrumbs, AppBar, Toolbar, Container, IconButton, Popover, FormControlLabel, FormGroup, Switch } from '@mui/material';
import { FilterAlt } from '@mui/icons-material';

import NotFound from '../components/NotFound';
import ItemCard from '../components/ItemCard';
import { ItemStatuses, MemberItemType } from '../lib/useSupabase/types';

export default function Member() {
	const { group: groupID, user: userID } = useParams();

	const { user } = useSupabase();
	const { data: groups, isLoading: groupsLoading } = useGetGroups();
	const { data: members, isLoading: membersLoading } = useGetGroupMembers(groupID!);

	const user_id = userID!.split('_')[0] ?? userID!;
	const list_id = userID!.split('_')[1] ?? undefined;
	const { data: items, isLoading: memberLoading } = useGetMemberItems(groupID!, user_id, list_id);

	const [hideUnavailableItems, setHideUnavailableItems] = React.useState<boolean>(true);

	const [filterAnchorEl, setFilterAnchorEl] = React.useState<HTMLButtonElement | null>(null);
	const filterOpen = Boolean(filterAnchorEl);

	const handleFilterOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
		setFilterAnchorEl(event.currentTarget);
	};

	const handleFilterClose = (event: React.MouseEvent<HTMLButtonElement>) => {
		setFilterAnchorEl(null);
	};

	const filterItems = (item: MemberItemType) => {
		let show = true;

		if (hideUnavailableItems) {
			if (item.status !== undefined && item.status?.user_id !== user.id && (item.status?.status === ItemStatuses.unavailable || item.status?.status === ItemStatuses.planned)) {
				show = false;
			}
		}

		return show;
	};

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

									<IconButton onClick={handleFilterOpen}>
										<FilterAlt />
									</IconButton>

									<Popover
										open={filterOpen}
										anchorEl={filterAnchorEl}
										onClose={handleFilterClose}
										anchorOrigin={{
											vertical: 'bottom',
											horizontal: 'right',
										}}
										transformOrigin={{
											vertical: 'top',
											horizontal: 'right',
										}}
									>
										<Box sx={{ ml: 2, mr: 2, mt: 1, mb: 1 }}>
											<FormGroup>
												<FormControlLabel
													control={<Switch checked={hideUnavailableItems} onChange={(e) => setHideUnavailableItems(e.target.checked)} />}
													label='Hide Unavailable Items'
												/>
											</FormGroup>
										</Box>
									</Popover>
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
									{items?.filter(filterItems).map((item, index) => (
										// TODO: Change ItemCard to Renderer function to allow Grow transition/animation
										<ItemCard item={item} />
									))}

									{items?.filter(filterItems).length === 0 && (
										<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
											<Typography variant='h5' gutterBottom>
												No {items?.length !== 0 ? 'available ' : ''}items are shared with this group.
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
