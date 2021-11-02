import React from 'react';

import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Autocomplete from '@mui/material/Autocomplete';

import Alert from '../../Alert';
import Snackbar from '@mui/material/Snackbar';

import { createList, getMyGroups } from '../../../firebase/gift/lists';

export default function SpeedDialTooltipOpen(props) {
	const [open, setOpen] = React.useState(false);
	const handleOpen = () => {
		setOpen(true);
		getGroups();
	};
	const handleClose = () => {
		setOpen(false);
	};

	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleAlertClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	const [name, setName] = React.useState('');
	const [isForChild, setIsForChild] = React.useState(false);

	const [groups, setgroups] = React.useState([]);
	const [groupsSelected, setGroupsSelected] = React.useState([]);
	const getGroups = () => {
		getMyGroups().then((result) => {
			// console.log(result);
			setgroups(result);
		});
	};

	const groupSelected = (event, value) => {
		setGroupsSelected(value);
	};

	return (
		<div style={{ position: 'fixed', bottom: 8, right: 8 }}>
			<Fab
				color='primary'
				aria-label='add'
				style={{
					position: 'absolute',
					right: 8,
					bottom: props.isMobile ? 64 : 8,
				}}
				onClick={handleOpen}
			>
				<AddIcon />
			</Fab>
			<Dialog open={open} onClose={handleClose} aria-labelledby='form-dialog-title'>
				<DialogTitle id='form-dialog-title'>Add List</DialogTitle>
				<DialogContent>
					<DialogContentText>Fill out the details below and publish to a group.</DialogContentText>
					<TextField autoFocus margin='dense' label='Name' fullWidth value={name} onChange={(event) => setName(event.target.value)} />
					<Autocomplete
						multiple
						limitTags={2}
						options={groups}
						value={groupsSelected}
						getOptionLabel={(option) => option.name}
						renderInput={(params) => <TextField {...params} variant='standard' label='Groups' />}
						style={{ marginTop: 8 }}
						onChange={groupSelected}
					/>
					<FormControlLabel
						control={<Checkbox checked={isForChild} onChange={(event) => setIsForChild(event.target.checked)} color='primary' />}
						label='For Child (displays as seperate list)'
					/>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							var groupsTemp = [];
							groupsSelected.forEach((group) => {
								groupsTemp.push(group.id);
							});

							createList(name, groupsTemp, isForChild).then((result) => {
								if (result === 'ok') {
									setAlert({ open: true, message: 'List created!', severity: 'success' });
									handleClose();
									props.getlists();
								} else {
									setAlert({ open: true, message: 'Error creating list!', severity: 'error' });
								}
							});
						}}
						color='primary'
						disabled={name.trim().length === 0}
					>
						Save
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
