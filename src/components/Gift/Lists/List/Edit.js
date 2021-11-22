import React from 'react';
import makeStyles from '@mui/styles/makeStyles';

import Fab from '@mui/material/Fab';
import SettingsIcon from '@mui/icons-material/Settings';

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

import Alert from '../../../Alert';
import Snackbar from '@mui/material/Snackbar';

import Delete from './Delete';

import { editList, getMyGroups, getListDetails } from '../../../../firebase/gift/lists';

const useStyles = makeStyles((theme) => ({
	root: {
		height: 380,
		transform: 'translateZ(0px)',
		flexGrow: 1,
	},
	speedDial: {
		position: 'absolute',
		bottom: theme.spacing(2),
		right: theme.spacing(2),
	},
}));

export default function SpeedDialTooltipOpen(props) {
	const classes = useStyles();
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
		getListDetails(props.list).then((result) => {
			setName(result.name);
			setgroups(result.groups);
			setIsForChild(result.isForChild);

			getMyGroups().then((result2) => {
				setgroups(result2);
				setGroupsSelected(
					result2.filter((obj) => {
						return result.groups.includes(obj.id);
					})
				);
			});
		});
	};

	const groupSelected = (event, value) => {
		setGroupsSelected(value);
	};

	return (
		<div style={{ position: 'fixed', top: 150, right: 8 }}>
			<Fab color='primary' aria-label='add' className={classes.speedDial} onClick={handleOpen}>
				<SettingsIcon />
			</Fab>
			<Dialog open={open} scroll={'body'} onClose={handleClose} maxWidth='sm' fullWidth>
				<DialogTitle id='form-dialog-title'>Edit List</DialogTitle>
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
					<Delete list={props.list} setAlert={setAlert} closeModal={handleClose} />
					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							var groupsTemp = [];
							groupsSelected.forEach((group) => {
								groupsTemp.push(group.id);
							});

							editList(props.list, name, groupsTemp, isForChild).then((result) => {
								if (result === 'ok') {
									setAlert({ open: true, message: 'List saved!', severity: 'success' });
									handleClose(null);
									props.getItems();
								} else {
									setAlert({ open: true, message: 'Error saving list!', severity: 'error' });
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

			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'center',
				}}
				open={alert.open}
				autoHideDuration={3500}
				onClose={handleAlertClose}
			>
				<Alert onClose={handleAlertClose} severity={alert.severity}>
					{alert.message}
				</Alert>
			</Snackbar>
		</div>
	);
}
