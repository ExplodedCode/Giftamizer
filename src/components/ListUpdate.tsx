import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { listTourProgress, useGetGroups, useGetTour, useUpdateLists, useUpdateTour } from '../lib/useSupabase/hooks';
import { GroupType, ListType } from '../lib/useSupabase/types';

import { useSnackbar } from 'notistack';

import { Dialog, DialogTitle, DialogContent, Button, TextField, DialogContentText, Grid, Stack, useMediaQuery, useTheme, DialogActions, Typography } from '@mui/material';
import { Save } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import GroupSelector from './GroupSelector';
import ImageCropper from './ImageCropper';
import TourTooltip from './TourTooltip';

type ListUpdateProps = {
	list: ListType | null;
	onClose: () => void;
};

export default function ListUpdate({ list, onClose }: ListUpdateProps) {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const location = useLocation();

	const open = location.hash === '#list-edit';

	const { data: groups } = useGetGroups();

	const [name, setName] = React.useState('');
	const [selectedGroups, setSelectedGroups] = React.useState<Omit<GroupType, 'image_token' | 'my_membership'>[]>([]);
	const [childList, setChildList] = React.useState<boolean>(false);
	const [image, setImage] = React.useState<string | undefined>();
	const [bio, setBio] = React.useState<string | undefined>();

	const updateLists = useUpdateLists();
	const handleSave = async () => {
		if (list) {
			await updateLists
				.mutateAsync({ id: list.id, name: name.trim(), child_list: childList, image: image, bio: bio, groups: selectedGroups })
				.then(() => {
					onClose();
				})
				.catch((err) => {
					enqueueSnackbar(`Unable to update list! ${err.message}`, { variant: 'error' });
				});
		}
	};

	useEffect(() => {
		if (list) {
			setName(list.name);
			setSelectedGroups(list.groups);
			setChildList(list.child_list);
			setImage(list.image);
			setBio(list.bio);
		}
	}, [list]);

	//
	// User tour
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();

	const [showTour, setShowTour] = React.useState<boolean>(false);
	React.useEffect(() => {
		if (open) {
			setTimeout(() => {
				setShowTour(true);
			}, 250);
		} else {
			setShowTour(false);
		}
	}, [open]);

	return (
		<>
			<Dialog open={list !== null && open} onClose={updateLists.isLoading ? undefined : onClose} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Edit List</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>Organize your wishlist into categories, making it easier for others to find the perfect gift for you.</DialogContentText>
						</Grid>
						{childList && (
							<Grid item xs={12}>
								<ImageCropper value={image} onChange={setImage} aspectRatio={1} />
							</Grid>
						)}
						<Grid item xs={12}>
							<TextField fullWidth label='Name' variant='outlined' required value={name} onChange={(e) => setName(e.target.value)} disabled={updateLists.isLoading} />
						</Grid>
						<Grid item xs={12}>
							<GroupSelector
								groups={groups?.filter((g) => g.my_membership[0].invite === false) as Omit<GroupType, 'image_token' | 'my_membership'>[]}
								value={selectedGroups}
								onChange={setSelectedGroups}
								disabled={updateLists.isLoading}
							/>
						</Grid>

						{childList && (
							<Grid item xs={12}>
								<TextField
									fullWidth
									multiline
									minRows={3}
									maxRows={7}
									label='Bio'
									variant='outlined'
									inputProps={{ maxLength: 250 }}
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									helperText={`${bio?.length} / 250`}
								/>
							</Grid>
						)}

						<Grid item xs={12}>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<Button color='inherit' onClick={onClose} disabled={updateLists.isLoading}>
									Cancel
								</Button>

								<LoadingButton onClick={handleSave} disabled={name.trim().length === 0} endIcon={<Save />} loading={updateLists.isLoading} loadingPosition='end' variant='contained'>
									Save
								</LoadingButton>
							</Stack>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>

			{showTour && open && tour && groups && (
				<>
					<TourTooltip
						open={listTourProgress(tour ?? {}) === 'list_group_assign'}
						anchorEl={document.querySelector('[tour-element="list_group_assign"]')}
						placement='top'
						content={
							<>
								<DialogContent>
									<Typography gutterBottom>Assign your list to a group here.</Typography>
								</DialogContent>
								<DialogActions>
									<LoadingButton
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												list_group_assign: true,
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
						allowClick
					/>
				</>
			)}
		</>
	);
}
