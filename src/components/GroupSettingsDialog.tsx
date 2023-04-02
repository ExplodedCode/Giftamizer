import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useSupabase } from '../lib/useSupabase';
import { GroupType, Member } from '../lib/useSupabase/types';

import { useTheme } from '@mui/material/styles';
import { Alert, Button, Dialog, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, Stack, useMediaQuery } from '@mui/material';
import { Settings, Logout } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';

export interface MemberEdit extends Member {
	deleted: boolean;
}

type GroupSettingsDialogProps = {
	group: GroupType;
};

export default function GroupSettingsDialog(props: GroupSettingsDialogProps) {
	const location = useLocation();
	const groupID = location.pathname.split('/groups/')[1];

	const theme = useTheme();
	const navigate = useNavigate();

	const { client, user } = useSupabase();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	const handleLeave = async () => {
		setLoading(true);

		const { error } = await client.from('group_members').delete().eq('group_id', groupID).eq('user_id', user.id);
		if (error) {
			console.log(error);
		} else {
			navigate('/groups');
			handleClose();
		}
	};

	const handleOpen = async () => {
		setOpen(true);
	};

	const handleClose = async () => {
		setOpen(false);

		setLoading(false);
	};

	return (
		<>
			<Button variant='outlined' color='primary' size='small' sx={{ display: { xs: 'none', sm: 'flex' } }} onClick={handleOpen}>
				Manage
			</Button>
			<IconButton sx={{ display: { xs: 'flex', sm: 'none' } }} onClick={handleOpen}>
				<Settings />
			</IconButton>

			<Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Group Settings</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>TODO: describe what groups do...</DialogContentText>
						</Grid>

						<Grid item xs={12}>
							<LoadingButton onClick={handleLeave} endIcon={<Logout />} loading={loading} loadingPosition='end' variant='contained' color='error'>
								Leave Group
							</LoadingButton>
						</Grid>

						<Grid item xs={12}>
							<Alert severity='error'>
								This action <b>cannot</b> be undone.
							</Alert>
						</Grid>
						<Grid item xs={12}>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<Button color='inherit' onClick={handleClose}>
									Close
								</Button>
							</Stack>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>
		</>
	);
}
