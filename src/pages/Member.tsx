import React from 'react';

import { useParams, Link, useLocation } from 'react-router-dom';
import { useSupabase, useGetGroupMembers, useGetGroups, useGetMemberItems, groupTourProgress, useGetTour, useUpdateTour } from '../lib/useSupabase';

import {
	CircularProgress,
	Grid,
	Link as MUILink,
	Typography,
	Box,
	Breadcrumbs,
	AppBar,
	Toolbar,
	Container,
	IconButton,
	Popover,
	FormControlLabel,
	FormGroup,
	Switch,
	Badge,
	DialogActions,
	DialogTitle,
	useTheme,
	DialogContent,
	useMediaQuery,
} from '@mui/material';
import { FilterAlt } from '@mui/icons-material';

import NotFound from '../components/NotFound';
import ItemCard from '../components/ItemCard';
import { ItemStatuses, MemberItemType } from '../lib/useSupabase/types';
import TourTooltip from '../components/TourTooltip';
import { LoadingButton } from '@mui/lab';

export default function Member() {
	const theme = useTheme();

	const location = useLocation();
	const { group: groupID, user: userID } = useParams();

	const { user } = useSupabase();
	const { data: groups, isLoading: groupsLoading } = useGetGroups();
	const { data: members, isLoading: membersLoading } = useGetGroupMembers(groupID!);

	const user_id = userID!.split('_')[0] ?? userID!;
	const list_id = userID!.split('_')[1] ?? undefined;
	const { data: items, isLoading: memberLoading } = useGetMemberItems(groupID!, user_id, list_id);

	const [showUnavailableItems, setShowUnavailableItems] = React.useState<boolean>(false);

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

		if (!showUnavailableItems) {
			if (item.status !== undefined && item.status?.user_id !== user.id && (item.status?.status === ItemStatuses.unavailable || item.status?.status === ItemStatuses.planned)) {
				show = false;
			}
		}

		return show;
	};

	//
	// User tour
	const filterButton = React.useRef(null);
	const [filterButtonLoaded, setFilterButtonLoaded] = React.useState<boolean>(false);
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	React.useEffect(() => {
		if (filterButton.current) setFilterButtonLoaded(true);
	}, [filterButton]);

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
							<AppBar position='static' sx={{ marginBottom: 2 }} color='default'>
								<Toolbar variant='dense'>
									<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
										<MUILink underline='hover' color='inherit' component={Link} to={`/groups/${groups?.find((g) => g.id === groupID)?.id}`}>
											{groups?.find((g) => g.id === groupID)?.name}
										</MUILink>
										<Typography color='text.primary'>
											{members?.find((m) => m.user_id === userID)?.profile.first_name} {members?.find((m) => m.user_id === userID)?.profile.last_name}
										</Typography>
									</Breadcrumbs>

									<IconButton onClick={handleFilterOpen} tour-element='group_member_item_filter'>
										<Badge
											color='secondary'
											variant='dot'
											overlap='circular'
											invisible={!(!showUnavailableItems && items?.filter((i) => !i.archived && !i.deleted)?.filter(filterItems).length !== items?.length && items?.length !== 0)}
										>
											<FilterAlt />
										</Badge>
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
													control={<Switch checked={showUnavailableItems} onChange={(e) => setShowUnavailableItems(e.target.checked)} />}
													label='Show Claimed Items'
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
									<Typography variant='body1' gutterBottom sx={{ textAlign: 'center', whiteSpace: 'pre-wrap' }}>
										{members?.find((m) => m.user_id === userID)?.profile.bio}
									</Typography>
								</Grid>
							</Grid>

							<Container sx={{ paddingTop: 2, paddingBottom: 12 }}>
								<Grid container spacing={2}>
									{items
										?.filter((i) => !i.archived && !i.deleted)
										?.filter(filterItems)
										.map((item, index) => (
											// TODO: Change ItemCard to Renderer function to allow Grow transition/animation
											<ItemCard index={index} key={item.id} item={item} />
										))}

									{items?.filter((i) => !i.archived && !i.deleted)?.filter(filterItems).length === 0 && (
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

							{!groupsLoading && !membersLoading && !memberLoading && !showUnavailableItems && items?.length !== 0 && tour && (
								<>
									<TourTooltip
										open={groupTourProgress(tour, isMobile) === 'group_member_item_filter' && location.hash === ''}
										anchorEl={document.querySelector('[tour-element="group_member_item_filter"]')}
										placement='bottom'
										content={
											<>
												<DialogTitle>Item Filter</DialogTitle>
												<DialogContent>
													<Typography>Some items may not be shown if they've been claimed by someone else.</Typography>
												</DialogContent>
												<DialogActions>
													<LoadingButton
														variant='outlined'
														color='inherit'
														onClick={() => {
															if (!tour?.group_member_item_filter) {
																updateTour.mutateAsync({
																	group_member_item_filter: true,
																});
															}
														}}
														loading={updateTour.isLoading}
													>
														Got it
													</LoadingButton>
												</DialogActions>
											</>
										}
										backgroundColor={theme.palette.primary.main}
										color={theme.palette.primary.contrastText}
										mask
										allowClick
									/>
								</>
							)}
						</>
					) : (
						<NotFound />
					)}
				</>
			)}
		</>
	);
}
