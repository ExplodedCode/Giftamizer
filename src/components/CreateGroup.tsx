import React from 'react';

import { useSupabase } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import { Avatar, Button, Dialog, DialogContent, DialogContentText, DialogTitle, Fab, Grid, IconButton, Stack, TextField, useMediaQuery } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Add, Group } from '@mui/icons-material';

type CreateGroupProps = {};

export default function CreateGroup(props: CreateGroupProps) {
	const theme = useTheme();

	const { client } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	const [name, setName] = React.useState('');

	const handleCreate = async () => {
		setLoading(true);

		var { error } = await client.from('groups').insert({
			name: name,
		});
		if (error) enqueueSnackbar(error.message, { variant: 'error' });

		handleClose();
	};

	const handleClose = async () => {
		setName('');
		setOpen(false);
		setLoading(false);
	};

	return (
		<>
			<Fab color='primary' aria-label='add' onClick={() => setOpen(true)} sx={{ position: 'fixed', bottom: { xs: 64, md: 16 }, right: { xs: 8, md: 16 } }}>
				<Add />
			</Fab>

			<Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Create Group</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>TODO: describe what groups do...</DialogContentText>
						</Grid>
						<Grid item xs={12}>
							<IconButton sx={{ p: 0, borderRadius: 0 }}>
								<Avatar
									sx={{
										borderRadius: 0,
										height: 196,
										width: 196,
										fontSize: 150,
										lineHeight: 1.5,
										textAlign: 'center',
										backgroundColor: '#5cb660',
										color: '#fff',
									}}
								>
									{name.trim() === '' ? 'G' : Array.from(String(name).toUpperCase())[0]}
								</Avatar>
							</IconButton>
						</Grid>
						<Grid item xs={12}>
							<TextField autoFocus fullWidth label='Group Name' variant='outlined' required value={name} onChange={(e) => setName(e.target.value)} />
						</Grid>
						<Grid item xs={12}>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<Button color='inherit' onClick={handleClose}>
									Cancel
								</Button>

								<LoadingButton onClick={handleCreate} endIcon={<Group />} loading={loading} loadingPosition='end' variant='contained'>
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
