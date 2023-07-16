import React from 'react';

import { useSupabase, useCreateItem, useGetProfile, DEFAULT_LIST_ID } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogContent, DialogContentText, DialogTitle, Fab, Grid, Stack, TextField, useMediaQuery } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Add } from '@mui/icons-material';
import ListSelector from './ListSelector';
import { ListType } from '../lib/useSupabase/types';

export default function ItemCreate() {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);

	const [name, setName] = React.useState('');
	const [description, setDescription] = React.useState('');
	const [lists, setLists] = React.useState<ListType[]>([]);

	const { user } = useSupabase();
	const { data: profile } = useGetProfile();
	const createItem = useCreateItem();

	const handleCreate = async () => {
		createItem
			.mutateAsync({
				name: name,
				description: description,
				newLists: profile?.enable_lists ? lists : [{ id: DEFAULT_LIST_ID, user_id: user.id, name: 'Default List', child_list: false, groups: [] }],
			})
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to create item! ${err.message}`, { variant: 'error' });
			});
	};

	const handleClose = async () => {
		setName('');
		setDescription('');
		setLists([]);

		setOpen(false);
	};

	return (
		<>
			<Fab color='primary' aria-label='add' onClick={() => setOpen(true)} sx={{ position: 'fixed', bottom: { xs: 64, md: 16 }, right: { xs: 8, md: 16 } }}>
				<Add />
			</Fab>

			<Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Create Item</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>TODO: describe what items do...</DialogContentText>
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='Name' variant='outlined' required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='Description' variant='outlined' value={description} onChange={(e) => setDescription(e.target.value)} />
						</Grid>
						{profile?.enable_lists && (
							<Grid item xs={12}>
								<ListSelector value={lists} onChange={(v) => setLists(v)} />
							</Grid>
						)}
						<Grid item xs={12}>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<Button color='inherit' onClick={handleClose}>
									Cancel
								</Button>

								<LoadingButton onClick={handleCreate} disabled={name.length === 0} endIcon={<Add />} loading={createItem.isLoading} loadingPosition='end' variant='contained'>
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
