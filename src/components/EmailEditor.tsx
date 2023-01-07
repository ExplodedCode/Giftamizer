import React from 'react';

import { useSupabase, validateEmail } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import EditIcon from '@mui/icons-material/Edit';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CloseIcon from '@mui/icons-material/Close';

export default function AvatarEditor() {
	/* ************ CNC CODE ************ */
	/* ************ CNC CODE ************ */
	/* ************ CNC CODE ************ */
	const { client, profile, updateProfile } = useSupabase();
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
		//grab email value
		// const email = emails[0];
		// //Set spinning action
		setLoading(true);

		// //TODO : Build in updater for login email..?

		// //Update profile email
		// await updateProfile({
		// 	email: email,
		// });
		//Clear email values and dismiss popup/loading animation

		const { data, error } = await client.auth.updateUser({ email: email });

		if (error) {
			console.log(error);
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		} else {
			enqueueSnackbar(`Confirmation sent to ${profile.email} & ${email}`, {
				variant: 'info',
				autoHideDuration: null,
				action: (key) => (
					<>
						<IconButton aria-label='close' size='small' onClick={() => closeSnackbar(key)}>
							<CloseIcon />
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
					value={profile.email}
					label='Email'
					disabled
					endAdornment={
						<InputAdornment position='end'>
							<Divider sx={{ height: 28, m: 0.5 }} orientation='vertical' />
							<IconButton color='primary' edge='end' onClick={() => setOpen(true)}>
								<EditIcon />
							</IconButton>
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
								<TextField required label='New Email' placeholder={profile.email} value={email} onChange={(e) => setEmail(e.target.value)} error={!validateEmail(email)} fullWidth />
							</Grid>
							<Grid item xs={12}>
								<TextField
									required
									label='Confirm New Email'
									placeholder={profile.email}
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
						endIcon={<SyncAltIcon />}
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
