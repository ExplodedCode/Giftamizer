import React from 'react';

import { Link, NavigateFunction, useLocation, useNavigate, useParams } from 'react-router-dom';
import { UseMutationResult } from '@tanstack/react-query';
import { TransitionGroup } from 'react-transition-group';

import { groupTourProgress, useGetGroups, useGetTour, useUpdateTour } from '../lib/useSupabase';
import { GroupType, TourSteps } from '../lib/useSupabase/types';

import {
	Container,
	Card,
	CardActionArea,
	CardContent,
	CardMedia,
	Grid,
	Typography,
	AppBar,
	Breadcrumbs,
	Link as MUILink,
	Toolbar,
	Grow,
	Box,
	CircularProgress,
	DialogActions,
	DialogTitle,
	useTheme,
} from '@mui/material';

import GroupCreate from '../components/GroupCreate';
import TourTooltip from '../components/TourTooltip';

interface RenderGroupProps {
	index: number;
	group: GroupType;
	navigate: NavigateFunction;

	tour: TourSteps | undefined;
	updateTour: UseMutationResult<TourSteps, unknown, TourSteps, unknown>;
}
function RenderGroup({ index, group, navigate, tour, updateTour }: RenderGroupProps) {
	return (
		<Grid tour-element={index === 0 ? 'group_card' : undefined} key={group.id} item xs sx={{ maxWidth: { xs: '100%', sm: 250 }, margin: 1 }}>
			<Card sx={{ height: '100%' }}>
				<CardActionArea
					sx={{ height: '100%', display: 'grid', alignItems: 'start' }}
					onClick={() => {
						navigate(`/groups/${group.id}`);
						if (!tour?.group_card) {
							updateTour.mutateAsync({
								group_card: true,
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
	const theme = useTheme();

	const navigate = useNavigate();
	const location = useLocation();
	const { group: groupID, user: userID } = useParams();

	const { data: groups, isLoading } = useGetGroups();

	//
	// User tour
	// const addGroupFab = React.useRef(null);
	const [showTour, setShowTour] = React.useState<boolean>(false);
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();

	return (
		<>
			<AppBar position='static' sx={{ marginBottom: 2 }} color='default'>
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
							<Grow
								key={group.id}
								style={{ transitionDelay: `${index * 25}ms` }}
								addEndListener={() => {
									setTimeout(() => {
										setShowTour(true);
									}, 400);
								}}
							>
								{RenderGroup({ index: index, group: group, navigate: navigate, tour: tour, updateTour: updateTour })}
							</Grow>
						))}
				</TransitionGroup>
				{groups?.filter((g) => !g.my_membership[0].invite)?.length === 0 && (
					<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
						<Typography variant='h5' gutterBottom>
							You don't have any groups!
						</Typography>
						<Typography variant='body1' gutterBottom>
							Create or join a group with your friends and family.
						</Typography>
					</Box>
				)}

				{isLoading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
						<CircularProgress />
					</Box>
				)}
			</Container>

			<GroupCreate />

			{groups && groups?.filter((g) => g.my_membership[0].invite).length === 0 && showTour && tour && location.hash === '' && (
				<>
					<TourTooltip
						open={groupTourProgress(tour, false) === 'group_card'}
						anchorEl={document.querySelector('[tour-element="group_card"]')}
						placement='bottom'
						content={
							<>
								<DialogTitle>Open the Group to view the members!</DialogTitle>
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
	);
}
