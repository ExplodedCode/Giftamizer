import React from 'react';

import { useSupabase } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import { Avatar, Button, Dialog, DialogContent, DialogContentText, DialogTitle, Fab, Grid, IconButton, Stack, TextField, useMediaQuery } from '@mui/material';

import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';

export default function GroupSettingsDialog() {
	const theme = useTheme();

	const { client } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	const [name, setName] = React.useState('');

	const handleCreate = async () => {
		setLoading(true);

		// var { error } = await client.from('groups').insert({
		// 	name: name, // text
		// 	image_token: 1673290691162, // number - change to refresh image for realtime
		// });
		// if (error) enqueueSnackbar(error.message, { variant: 'error' });

		handleClose();
	};

	const handleClose = async () => {
		setName('');
		setOpen(false);
		setLoading(false);
	};

	return (
		<>
			<Button variant='outlined' color='primary' size='small' sx={{ display: { xs: 'none', sm: 'flex' } }} onClick={() => setOpen(true)}>
				Settings
			</Button>
			<IconButton sx={{ display: { xs: 'flex', sm: 'none' } }} onClick={() => setOpen(true)}>
				<SettingsIcon />
			</IconButton>

			<Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Group Settings</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>TODO: describe what groups do...</DialogContentText>
						</Grid>
						<Grid item xs={12}>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<Button color='inherit' onClick={handleClose}>
									Cancel
								</Button>

								<LoadingButton onClick={handleCreate} endIcon={<SaveIcon />} loading={loading} loadingPosition='end' variant='contained'>
									Save
								</LoadingButton>
							</Stack>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>
		</>
	);
}
