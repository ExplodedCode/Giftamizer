import * as React from 'react';

import { TransitionProps } from '@mui/material/transitions';

import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

import { AppBar, Container, Dialog, Grid, IconButton, MenuItem, Slide, TextField, Toolbar, Typography } from '@mui/material';
import { useSupabase } from '../lib/useSupabase';
import AvatarEditor from './AvatarEditor';

const Transition = React.forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement;
	},
	ref: React.Ref<unknown>
) {
	return <Slide direction='left' ref={ref} {...props} />;
});

export type AccountDialogProps = {
	handleCloseMenu?(): void;
};

export default function AccountDialog(props: AccountDialogProps) {
	const { profile, updateProfile } = useSupabase();

	const [open, setOpen] = React.useState(false);

	const [name, setName] = React.useState(profile.name);

	const handleClickOpen = () => {
		if (props.handleCloseMenu) props.handleCloseMenu();
		setName(profile.name); // update profile
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};
	const handleSave = async () => {
		await updateProfile({
			name: name,
		});
		setOpen(false);
	};

	return (
		<>
			<MenuItem onClick={handleClickOpen}>
				<Typography textAlign='center'>My Account</Typography>
			</MenuItem>

			<Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
				<AppBar sx={{ position: 'relative' }} enableColorOnDark>
					<Toolbar>
						<IconButton edge='start' color='inherit' onClick={handleClose} aria-label='close'>
							<CloseIcon />
						</IconButton>
						<Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
							My Account
						</Typography>
						<IconButton edge='start' color='inherit' onClick={handleSave} aria-label='close'>
							<SaveIcon />
						</IconButton>
					</Toolbar>
				</AppBar>
				<Container maxWidth='md' sx={{ marginTop: 6 }}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<AvatarEditor />
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='Display Name' variant='outlined' value={name} onChange={(e) => setName(e.target.value)} />
						</Grid>
					</Grid>
				</Container>
			</Dialog>
		</>
	);
}
