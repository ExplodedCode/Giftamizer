import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { groupTourProgress, useCreateGroup, useGetGroups, useGetTour, useUpdateTour } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, Grid, Stack, TextField, Typography, useMediaQuery } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Add, GroupAdd } from '@mui/icons-material';

import ImageCropper from './ImageCropper';
import TourTooltip from './TourTooltip';

export default function GroupCreate() {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const { data: groups } = useGetGroups();

	const open = location.hash === '#new-group';

	const [name, setName] = React.useState('');
	const [image, setImage] = React.useState<string | undefined>();

	const createGroup = useCreateGroup();
	const handleCreate = async () => {
		createGroup
			.mutateAsync({ name: name.trim(), invite_link: true, image: image })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to create group! ${err.message}`, { variant: 'error' });
			});
	};

	const handleClose = async () => {
		setName('');
		navigate('#'); // close dialog

		if (!tour?.group_create_fab || !tour?.group_create_name || !tour?.group_create_image || !tour?.group_create) {
			updateTour.mutateAsync({
				group_create_fab: true,
				group_create_name: true,
				group_create_image: true,
				group_create: true,
			});
		}
	};

	//
	// User tour
	const addGroupFab = React.useRef(null);
	const [fabLoaded, setFabLoaded] = React.useState<boolean>(false);
	const [dialogOpenedTour, setDialogOpenedTour] = React.useState<boolean>(false);
	const [imageDialogOpen, setImageDialogOpen] = React.useState<boolean>(false);
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();

	const skipTour = async () => {
		updateTour.mutateAsync({
			group_nav: true,
			group_create_fab: true,
			group_create_name: true,
			group_create_image: true,
			group_create: true,
			group_card: true,
			group_settings: true,
			group_pin: true,
			group_member_card: true,
			group_member_item_status: true,
			group_member_item_status_taken: true,
			group_member_item_filter: true,
			group_settings_add_people: true,
			group_settings_permissions: true,
		});
	};

	React.useEffect(() => {
		if (addGroupFab.current) setFabLoaded(true);
	}, [addGroupFab]);

	React.useEffect(() => {
		if (open) {
			setTimeout(() => {
				setDialogOpenedTour(true);
			}, 250);
		} else {
			setDialogOpenedTour(false);
		}
	}, [open]);

	return (
		<>
			<Fab
				tour-element='group_create_fab'
				ref={addGroupFab}
				color='primary'
				aria-label='add'
				onClick={() => {
					navigate('#new-group');
					if (!tour?.group_create_fab) {
						updateTour.mutateAsync({
							group_nav: true,
							group_create_fab: true,
						});
					}
				}}
				sx={{ position: 'fixed', bottom: { xs: 64, md: 16 }, right: { xs: 8, md: 16 } }}
			>
				<GroupAdd />
			</Fab>

			<Dialog open={open} onClose={handleClose} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Create Group</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>Share your gift lists with your friends and family.</DialogContentText>
						</Grid>
						<Grid item xs={12}>
							<ImageCropper
								onClick={() => {
									setImageDialogOpen(true);
									if (!tour?.group_create_image) {
										updateTour.mutateAsync({
											group_create_image: true,
										});
									}
								}}
								onClose={() => {
									setImageDialogOpen(false);
								}}
								tour_element='group_create_image'
								value={image}
								onChange={setImage}
								aspectRatio={1}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField tour-element='group_create_name' fullWidth label='Group Name' variant='outlined' required value={name} onChange={(e) => setName(e.target.value)} />
						</Grid>
						<Grid item xs={12}>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<Button color='inherit' onClick={handleClose}>
									Cancel
								</Button>

								<LoadingButton
									tour-element='group_create'
									onClick={handleCreate}
									endIcon={<Add />}
									loading={createGroup.isLoading}
									disabled={name.trim().length <= 0}
									loadingPosition='end'
									variant='contained'
								>
									Create
								</LoadingButton>
							</Stack>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>

			{fabLoaded && groups?.filter((g) => g.my_membership[0].invite).length === 0 && tour && (
				<>
					<TourTooltip
						open={
							(groupTourProgress(tour, false) === 'group_create_fab' && location.hash === '') ||
							(groupTourProgress(tour, false) === 'group_create_fab' && !tour.group_nav && location.pathname === '/groups' && location.hash === '')
						}
						anchorEl={document.querySelector('[tour-element="group_create_fab"]')}
						placement='top-end'
						content={
							<>
								<DialogTitle>Create new groups here!</DialogTitle>
								<DialogActions>
									<LoadingButton color='inherit' onClick={skipTour} loading={updateTour.isLoading}>
										Skip Group Tour
									</LoadingButton>
									<LoadingButton
										variant='outlined'
										color='inherit'
										onClick={() => {
											if (!tour?.group_create_fab) {
												updateTour.mutateAsync({
													group_nav: true,
													group_create_fab: true,
													group_create_name: true,
													group_create_image: true,
													group_create: true,
												});
											}
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
						mask
						allowClick
					/>
				</>
			)}

			{fabLoaded && dialogOpenedTour && groups?.filter((g) => g.my_membership[0].invite).length === 0 && tour && location.hash === '#new-group' && (
				<>
					<TourTooltip
						open={groupTourProgress(tour, false) === 'group_create_name'}
						anchorEl={document.querySelector('[tour-element="group_create_name"]')}
						placement='top'
						content={
							<>
								<DialogContent>
									<Typography>Give your group a name.</Typography>
								</DialogContent>
								<DialogActions>
									<LoadingButton
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												group_create_name: true,
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
						mask
					/>

					<TourTooltip
						open={groupTourProgress(tour, false) === 'group_create_image'}
						anchorEl={document.querySelector('[tour-element="group_create_image"]')}
						placement='bottom'
						content={
							<>
								<DialogContent>
									<Typography>Add a picture of you & your friends or family!</Typography>
								</DialogContent>
								<DialogActions>
									<LoadingButton
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												group_create_image: true,
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
					/>

					<TourTooltip
						open={groupTourProgress(tour, false) === 'group_create' && !imageDialogOpen}
						anchorEl={document.querySelector('[tour-element="group_create"]')}
						placement='top'
						content={
							<>
								<DialogContent>
									<Typography>When you have everything ready, click Create to add the item.</Typography>
								</DialogContent>
								<DialogActions>
									<LoadingButton
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												group_create: true,
											});
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
					/>
				</>
			)}
		</>
	);
}
