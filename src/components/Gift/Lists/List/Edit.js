import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Fab from '@material-ui/core/Fab';
import SettingsIcon from '@material-ui/icons/Settings';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import Autocomplete from '@material-ui/lab/Autocomplete';

import Alert from '../../../Alert';
import Snackbar from '@material-ui/core/Snackbar';

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
			<Dialog open={open} onClose={handleClose} aria-labelledby='form-dialog-title'>
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
					<Button onClick={handleClose}>Cancel</Button>
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

			<Snackbar open={alert.open} autoHideDuration={3500} onClose={handleAlertClose}>
				<Alert onClose={handleAlertClose} severity={alert.severity}>
					{alert.message}
				</Alert>
			</Snackbar>
		</div>
	);
}
