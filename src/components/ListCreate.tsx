import React from 'react';

import { useSupabase } from '../lib/useSupabase';
import { GroupType } from '../lib/useSupabase/types';
import { useCreateList, useGetGroups } from '../lib/useSupabase/hooks';

import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogContent, DialogContentText, DialogTitle, Fab, FormControl, FormControlLabel, Grid, Stack, Switch, TextField, useMediaQuery } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Add } from '@mui/icons-material';
import GroupSelector from './GroupSelector';
import ImageCropper from './ImageCropper';

export default function CreateList() {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();

	const { user } = useSupabase();

	const createList = useCreateList();
	const { data: groups } = useGetGroups();

	const [open, setOpen] = React.useState(false);

	const [name, setName] = React.useState('');
	const [selectedGroups, setSelectedGroups] = React.useState<Omit<GroupType, 'image_token' | 'my_membership'>[]>([]);
	const [childList, setChildList] = React.useState<boolean>(false);
	const [image, setImage] = React.useState<string | undefined>();
	const [bio, setBio] = React.useState('');

	const handleCreate = async () => {
		console.log(selectedGroups);

		await createList
			.mutateAsync({ user_id: user.id, name: name, child_list: childList, image: image, bio: bio, groups: selectedGroups })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to create list! ${err.message}`, { variant: 'error' });
			});
	};

	const handleClose = async () => {
		setName('');
		setSelectedGroups([]);
		setChildList(false);
		setImage(undefined);
		setBio('');

		setOpen(false);
	};

	return (
		<>
			<Fab color='primary' aria-label='add' onClick={() => setOpen(true)} sx={{ position: 'fixed', bottom: { xs: 64, md: 16 }, right: { xs: 8, md: 16 } }}>
				<Add />
			</Fab>

			<Dialog open={open} onClose={() => (createList.isLoading ? undefined : handleClose())} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Create List</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>TODO: describe what lists do...</DialogContentText>
						</Grid>
						{childList && (
							<Grid item xs={12}>
								<ImageCropper value={image} onChange={setImage} aspectRatio={1} />
							</Grid>
						)}
						<Grid item xs={12}>
							<TextField fullWidth label='Name' variant='outlined' required value={name} onChange={(e) => setName(e.target.value)} autoFocus disabled={createList.isLoading} />
						</Grid>
						<Grid item xs={12}>
							<GroupSelector groups={groups as Omit<GroupType, 'image_token' | 'my_membership'>[]} value={selectedGroups} onChange={setSelectedGroups} disabled={createList.isLoading} />
						</Grid>
						<Grid item xs={12}>
							<FormControl component='fieldset' variant='standard'>
								<FormControlLabel
									control={<Switch checked={childList} onChange={(e) => setChildList(e.target.checked)} disabled={createList.isLoading} />}
									label='Display Separately in Groups'
								/>
							</FormControl>
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
									helperText={`${bio.length} / 250`}
								/>
							</Grid>
						)}

						<Grid item xs={12}>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<Button color='inherit' onClick={handleClose} disabled={createList.isLoading}>
									Cancel
								</Button>

								<LoadingButton onClick={handleCreate} disabled={name.length === 0} endIcon={<Add />} loading={createList.isLoading} loadingPosition='end' variant='contained'>
									Create
								</LoadingButton>
							</Stack>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>
		</>
	);
}
