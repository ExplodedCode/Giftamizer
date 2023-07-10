import React from 'react';

import { useSupabase } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogContent, DialogContentText, DialogTitle, Fab, Grid, Stack, TextField, useMediaQuery } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Add } from '@mui/icons-material';

type CreateItemProps = {};

export default function CreateItem(props: CreateItemProps) {
	const theme = useTheme();

	const { client, user } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	const [name, setName] = React.useState('');
	const [description, setDescription] = React.useState('');

	// var { error } = await client.from('items').insert({
	// 	name: name,
	// 	description: description
	// });

	const handleCreate = async () => {
		setLoading(true);

		var { error } = await client.from('items').insert({
			user_id: user.id,
			name: name,
			description: description,
		});
		if (error) enqueueSnackbar(error.message, { variant: 'error' });

		handleClose();
	};

	const handleClose = async () => {
		setName('');
		setDescription('');

		setOpen(false);
		setLoading(false);
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
						<Grid item xs={12}>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<Button color='inherit' onClick={handleClose}>
									Cancel
								</Button>

								<LoadingButton onClick={handleCreate} disabled={name.length === 0} endIcon={<Add />} loading={loading} loadingPosition='end' variant='contained'>
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
