import React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import SpeedDialAction from '@mui/material/SpeedDialAction';

import Alert from '../../Alert';
import Snackbar from '@mui/material/Snackbar';

import { joinGroup } from '../../../firebase/gift/groups';

export default function FormDialog(props) {
	const [open, setOpen] = React.useState(false);
	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};

	const [inviteCode, setInviteCode] = React.useState('');

	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleCloseAlert = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	return (
		<div>
			<SpeedDialAction {...props} onClick={handleClickOpen} />
			<Dialog open={open} onClose={handleClose} aria-labelledby='form-dialog-title'>
				<DialogTitle id='form-dialog-title'>Join</DialogTitle>
				<DialogContent>
					<DialogContentText>To join a group, please enter the invite code here.</DialogContentText>
					<TextField
						autoFocus
						margin='dense'
						id='name'
						label='Invite Code'
						fullWidth
						value={inviteCode}
						onChange={(event) => setInviteCode(event.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && inviteCode.length === 12) {
								joinGroup(inviteCode).then((result) => {
									if (result === 'error') {
										setAlert({ open: true, message: 'Error joining group!.', severity: 'error' });
									} else {
										setAlert({ open: true, message: 'Joined group.', severity: 'success' });
										handleClose();
									}
								});
							}
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							if (inviteCode.length === 12) {
								joinGroup(inviteCode).then((result) => {
									if (result === 'notfound') {
										setAlert({ open: true, message: 'Group not found!', severity: 'error' });
										handleClose();
										props.handleSpeedDialClose();
									}
									if (result === 'alreadyjoined') {
										setAlert({ open: true, message: 'Already in group!', severity: 'warning' });
										handleClose();
										props.handleSpeedDialClose();
									} else {
										setAlert({ open: true, message: 'Joined group!', severity: 'success' });
										handleClose();
										props.handleSpeedDialClose();
										props.getGroups();
									}
									setInviteCode('');
								});
							}
						}}
						color='primary'
						disabled={inviteCode.length !== 12}
					>
						Join
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar open={alert.open} autoHideDuration={3500} onClose={handleCloseAlert}>
				<Alert onClose={handleCloseAlert} severity={alert.severity}>
					{alert.message}
				</Alert>
			</Snackbar>
		</div>
	);
}
