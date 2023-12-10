import React from 'react';

import { useParams, useNavigate, Link, NavigateFunction, useLocation } from 'react-router-dom';
import { groupTourProgress, useGetGroupMembers, useGetGroups, useGetLists, useGetProfile, useGetTour, useSetGroupPin, useUpdateTour } from '../lib/useSupabase';
import { TransitionGroup } from 'react-transition-group';
import { UseMutationResult } from '@tanstack/react-query';
import { Member, TourSteps } from '../lib/useSupabase/types';

import {
	Card,
	CardActionArea,
	CardContent,
	CardMedia,
	CircularProgress,
	Grid,
	Link as MUILink,
	Typography,
	Box,
	Breadcrumbs,
	AppBar,
	Toolbar,
	Checkbox,
	Grow,
	Container,
	Tooltip,
	Alert,
	Collapse,
	DialogTitle,
	useTheme,
	DialogContent,
	DialogActions,
	useMediaQuery,
} from '@mui/material';
import { PushPinOutlined, PushPin, EscalatorWarning } from '@mui/icons-material';

import GroupSettingsDialog from '../components/GroupSettingsDialog';
import NotFound from '../components/NotFound';
import TourTooltip from '../components/TourTooltip';
import { LoadingButton } from '@mui/lab';
import SecretSanta from '../components/SecretSanta';

interface RenderMemberProps {
	index: number;
	member: Member;
	navigate: NavigateFunction;

	tour: TourSteps | undefined;
	updateTour: UseMutationResult<TourSteps, unknown, TourSteps, unknown>;
}
function RenderMember({ index, member, navigate, tour, updateTour }: RenderMemberProps) {
	const { group: groupID } = useParams();

	return (
		<Grid tour-element={index === 0 ? 'group_member_card' : undefined} key={member.user_id} item xs sx={{ maxWidth: { xs: '100%', sm: 250 }, margin: 1 }}>
			<Card sx={{ height: '100%' }}>
				<CardActionArea
					sx={{ height: '100%', display: 'grid', alignItems: 'start' }}
					onClick={() => {
						navigate(`/groups/${groupID}/${member.user_id}`);

						if (!tour?.group_member_card) {
							updateTour.mutateAsync({
								group_member_card: true,
							});
						}
					}}
				>
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
						image={member.profile.image}
					>
						{member.profile.image ? '' : Array.from(String(member.profile.first_name + member.profile.last_name).toUpperCase())[0]}
					</CardMedia>

					<CardContent>
						<Grid container>
							<Grid item xs>
								<Typography variant='h5' component='h2'>
									{member.profile.first_name} {member.profile.last_name}
								</Typography>
							</Grid>

							{member.child_list && (
								<Grid item>
									<EscalatorWarning />
								</Grid>
							)}
						</Grid>
					</CardContent>
				</CardActionArea>
			</Card>
		</Grid>
	);
}

export default function Group() {
	const theme = useTheme();

	const navigate = useNavigate();
	const location = useLocation();
	const { group: groupID, user: userID } = useParams();

	const { data: profile } = useGetProfile();
	const { data: lists } = useGetLists();
	const { data: groups, isLoading: groupsLoading } = useGetGroups();
	const { data: members, isLoading: membersLoading } = useGetGroupMembers(groupID!);
	const setGroupPin = useSetGroupPin();

	//
	// User tour
	// const addGroupFab = React.useRef(null);
	const [showTour, setShowTour] = React.useState<boolean>(false);
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	React.useEffect(() => {
		setTimeout(() => {
			setShowTour(true);
		}, 500);
	}, []);

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
							<AppBar position='static' sx={{ bgcolor: 'background.paper' }}>
								<Toolbar variant='dense'>
									<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
										<MUILink underline='hover' color='inherit' component={Link} to='/groups'>
											Groups
										</MUILink>
										<Typography color='text.primary'>{groups?.find((g) => g.id === groupID)?.name}</Typography>
									</Breadcrumbs>

									<Tooltip title={groups?.find((g) => g.id === groupID)?.my_membership[0].pinned ? 'Unpin' : 'Pin'} arrow>
										<Checkbox
											tour-element='group_pin'
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
									</Tooltip>

									<GroupSettingsDialog group={groups?.find((g) => g.id === groupID)!} owner={groups?.find((g) => g.id === groupID)?.my_membership[0].owner!} />
								</Toolbar>
							</AppBar>
							<ListUnassignedAlert open={profile?.enable_lists && lists?.filter((l) => !l.child_list && l.groups.find((g) => g.id === groupID)).length === 0} />
							<Container sx={{ marginTop: 2, paddingBottom: 12 }}>
								{members?.filter((m) => !m.invite).length! > 1 && <SecretSanta group={groups?.find((g) => g.id === groupID)!} members={members?.filter((m) => !m.invite) ?? []} />}

								<TransitionGroup component={Grid} container justifyContent='center'>
									{members
										?.filter((m) => !m.invite)
										.map((member, index) => (
											<Grow
												key={member.user_id}
												style={{ transitionDelay: `${index * 25}ms` }}
												addEndListener={() => {
													setTimeout(() => {
														setShowTour(true);
													}, 150);
												}}
											>
												{RenderMember({ index: index, member: member, navigate: navigate, tour: tour, updateTour: updateTour })}
											</Grow>
										))}
								</TransitionGroup>

								{members?.filter((m) => !m.invite).length === 0 && (!groupsLoading || !membersLoading) && (
									<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
										This group has no members, invite some friends and family!
									</Typography>
								)}
							</Container>

							{groups && showTour && tour && (
								<>
									<TourTooltip
										open={groupTourProgress(tour, isMobile) === 'group_settings' && location.hash === ''}
										anchorEl={document.querySelector('[tour-element="group_settings"]')}
										placement='bottom-end'
										content={
											<>
												<DialogContent>
													<Typography>
														{groups?.find((g) => g.id === groupID)?.my_membership[0].owner ? 'Manage your group members and settings here.' : 'Manage your group here.'}
													</Typography>
												</DialogContent>
												<DialogActions>
													<LoadingButton
														variant='outlined'
														color='inherit'
														onClick={() => {
															updateTour.mutateAsync({
																group_settings: true,
															});
														}}
														loading={updateTour.isLoading}
													>
														Next
													</LoadingButton>
												</DialogActions>
											</>
										}
										backgroundColor={theme.palette.primary.main}
										color={theme.palette.primary.contrastText}
										allowClick
									/>
									<TourTooltip
										open={groupTourProgress(tour, isMobile) === 'group_pin' && !isMobile && location.hash === ''}
										anchorEl={document.querySelector('[tour-element="group_pin"]')}
										placement='bottom-end'
										content={
											<>
												<DialogContent>
													<Typography>Pin groups to the side navigation.</Typography>
												</DialogContent>
												<DialogActions>
													<LoadingButton
														variant='outlined'
														color='inherit'
														onClick={() => {
															updateTour.mutateAsync({
																group_pin: true,
															});
														}}
														loading={updateTour.isLoading}
													>
														Next
													</LoadingButton>
												</DialogActions>
											</>
										}
										backgroundColor={theme.palette.primary.main}
										color={theme.palette.primary.contrastText}
										allowClick
									/>

									<TourTooltip
										open={groupTourProgress(tour, isMobile) === 'group_member_card' && location.hash === ''}
										anchorEl={document.querySelector('[tour-element="group_member_card"]')}
										placement='bottom'
										content={
											<>
												<DialogTitle>View items your friends and family shared!</DialogTitle>
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

interface ListUnassignedAlertProps {
	open?: boolean;
}
function ListUnassignedAlert({ open }: ListUnassignedAlertProps) {
	return (
		<Box sx={{ width: '100%' }}>
			<Collapse in={open}>
				<Collapse in={alert !== undefined}>
					<Alert severity='warning'>You are not sharing any lists with this group!</Alert>
				</Collapse>
			</Collapse>
		</Box>
	);
}
