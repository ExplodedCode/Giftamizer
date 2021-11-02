import React from 'react';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import Alert from '../../Alert';
import Snackbar from '@mui/material/Snackbar';

import { firebaseAuth } from '../../../firebase/constants';

export default function FormDialog({ socket, group, fromNoMembers }) {
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [inviteEmail, setInviteEmail] = React.useState('');

	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleAlertClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};
	const handleInvite = () => {
		setLoading(true);
		socket.emit('req:userData', firebaseAuth().currentUser.uid);
		socket.on('res:userData', (result) => {
			// console.log(result);
			if (result) {
				fetch('/api/sendInvite?email=' + inviteEmail + '&code=' + group.id + '&name=' + result.displayName, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((response) => {
					if (!response.ok) {
						response.json().then((error) => {
							// console.log(error);
							setInviteEmail('');
							setLoading(false);
							setOpen(false);
							setAlert({ open: true, message: 'Error sending invite', severity: 'error' });
						});
					} else {
						return response.json().then(() => {
							setLoading(false);
							setOpen(false);
							setAlert({ open: true, message: 'Invite Sent!', severity: 'success' });
						});
					}
				});
			} else {
				// error getting name
			}
		});
	};

	return (
		<div>
			<Button size={fromNoMembers ? 'large' : 'small'} variant={fromNoMembers ? 'contained' : 'text'} color='primary' onClick={handleClickOpen}>
				Invite
			</Button>
			<Dialog open={open} onClose={handleClose} aria-labelledby='form-dialog-title'>
				<DialogTitle id='form-dialog-title'>Invite</DialogTitle>
				<DialogContent>
					<DialogContentText>To invite someone to this group, please enter their email address here. We will send them an invitation.</DialogContentText>
					<TextField autoFocus margin='dense' id='name' label='Email Address' type='email' fullWidth value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={handleInvite} color='primary' disabled={!(validEmail(inviteEmail) && !loading)}>
						{loading ? 'Inviting...' : 'Invite'}
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar open={alert.open} autoHideDuration={3500} onClose={handleAlertClose}>
				<Alert onClose={handleAlertClose} severity={alert.severity}>
					{alert.message}
				</Alert>
			</Snackbar>
		</div>
	);
}

function validEmail(email) {
	const re = /^(([^<>()[\].,;:\s@"]+(.[^<>()[\].,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}
