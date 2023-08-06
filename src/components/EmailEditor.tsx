import React from 'react';

import { useGetProfile, useSupabase, validateEmail } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Close, Edit, SyncAlt } from '@mui/icons-material';

export default function EmailEditor() {
	const { client } = useSupabase();
	const { data: profile } = useGetProfile();

	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	const [email, setEmail] = React.useState('');
	const [emailConfirm, setEmailConfirm] = React.useState('');

	const handleClose = () => {
		setOpen(false);
		setLoading(false);
		setEmail('');
		setEmailConfirm('');
	};
	const handleUpdateEmail = async () => {
		setLoading(true);

		const { error } = await client.auth.updateUser({ email: email });

		if (error) {
			console.log(error);
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		} else {
			enqueueSnackbar(`Confirmation sent to ${profile?.email} & ${email}`, {
				variant: 'info',
				autoHideDuration: null,
				action: (key) => (
					<>
						<IconButton aria-label='close' size='small' onClick={() => closeSnackbar(key)}>
							<Close />
						</IconButton>
					</>
				),
			});
		}

		handleClose();
	};

	return (
		<>
			{/* Email Field with Edit Action */}
			<FormControl fullWidth>
				<InputLabel htmlFor='component-outlined'>Email</InputLabel>
				<OutlinedInput
					id='component-outlined'
					value={profile?.email}
					label='Email'
					disabled
					endAdornment={
						<InputAdornment position='end'>
							<Divider sx={{ height: 28, m: 0.5, display: { xs: 'inherit', sm: 'none' } }} orientation='vertical' />
							<IconButton sx={{ display: { xs: 'block', sm: 'none' } }} color='primary' edge='end' onClick={() => setOpen(true)}>
								<Edit />
							</IconButton>
							<Button variant='contained' sx={{ display: { xs: 'none', sm: 'inherit' } }} endIcon={<Edit />} onClick={() => setOpen(true)}>
								Change email
							</Button>
						</InputAdornment>
					}
				/>
			</FormControl>

			{/* Popup Dialog with Email Updater */}
			<Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
				<DialogTitle>Update Profile Email</DialogTitle>
				<DialogContent>
					<Box sx={{ paddingTop: 1 }}>
						<Grid container spacing={2}>
							<Grid item xs={12}>
								<TextField required label='New Email' placeholder={profile?.email} value={email} onChange={(e) => setEmail(e.target.value)} error={!validateEmail(email)} fullWidth />
							</Grid>
							<Grid item xs={12}>
								<TextField
									required
									label='Confirm New Email'
									placeholder={profile?.email}
									value={emailConfirm}
									onChange={(e) => setEmailConfirm(e.target.value)}
									error={!validateEmail(emailConfirm) || email !== emailConfirm}
									fullWidth
								/>
							</Grid>
						</Grid>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>

					<LoadingButton
						onClick={handleUpdateEmail}
						endIcon={<SyncAlt />}
						disabled={!(validateEmail(email) && validateEmail(emailConfirm) && email === emailConfirm)}
						loading={loading}
						loadingPosition='end'
						variant='contained'
					>
						Update Email
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</>
	);
}
