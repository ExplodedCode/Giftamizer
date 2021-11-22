import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@mui/styles/withStyles';
import * as colors from '@mui/material/colors';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckIcon from '@mui/icons-material/Check';
import Slider from '@mui/material/Slider';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Resizer from 'react-image-file-resizer';

import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import { editMyGroup } from '../../../firebase/gift/groups';

import Delete from './Delete';

import Alert from '../../Alert';
import Snackbar from '@mui/material/Snackbar';

const hues = Object.keys(colors).slice(1, 17);
const shades = [900, 800, 700, 600, 500, 400, 300, 200, 100, 50, 'A700', 'A400', 'A200', 'A100'];

const styles = (theme) => ({
	radio: {
		padding: 0,
	},
	radioIcon: {
		width: 48,
		height: 48,
	},
	radioIconSelected: {
		width: 48,
		height: 48,
		border: '1px solid white',
		color: theme.palette.common.white,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
	swatch: {
		width: 192,
	},
	sliderContainer: {
		display: 'flex',
		alignItems: 'center',
		marginTop: theme.spacing(2),
		marginBottom: theme.spacing(2),
	},
	slider: {
		width: 'calc(100% - 80px)',
		marginLeft: theme.spacing(3),
		marginRight: theme.spacing(3),
	},
	colorBar: {
		marginTop: theme.spacing(2),
	},
	colorSquare: {
		width: 85.3,
		height: 85.3,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
	button: {
		marginLeft: theme.spacing(1),
	},
});

function ColorTool(props) {
	const { classes } = props;
	// const dispatch = React.useContext(DispatchContext);
	const [state, setState] = React.useState({
		primary: props.group.backgroundValue,
		primaryInput: props.group.backgroundValue,
		primaryHue: 'green',
		primaryShade: 4,
		textShade: props.group.textShade ?? 'light',
		backgroundType: props.group.backgroundType,
		backgroundValue: props.group.backgroundValue,
		groupName: props.group.name ?? '',

		saveloading: false,
	});

	const [open, setOpen] = React.useState(false);
	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};

	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleAlertClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	const handleChangeHue = (name) => (event) => {
		const hue = event.target.value;
		const color = colors[hue][shades[state[`${name}Shade`]]];

		setState({
			...state,
			[`${name}Hue`]: hue,
			[name]: color,
			[`${name}Input`]: color,
		});
	};

	const handleChangeShade = (name) => (event, shade) => {
		const color = colors[state[`${name}Hue`]][shades[shade]];
		setState({
			...state,
			[`${name}Shade`]: shade,
			[name]: color,
		});
	};
	const handleChangeBackgroundType = (event) => {
		setState({
			...state,
			backgroundType: event.target.value,
			backgroundValue: '',
		});
	};
	const handleChangeImageUpload = (event) => {
		let file = event.target.files[0];
		Resizer.imageFileResizer(
			file,
			400,
			400,
			'PNG',
			70,
			0,
			(uri) => {
				setState({
					...state,
					backgroundValue: uri,
				});
			},
			'base64'
		);
	};

	const handleChangegroupName = (event) => {
		setState({
			...state,
			groupName: event.target.value,
		});
	};
	const handleChangetextShade = (event) => {
		setState({
			...state,
			textShade: event.target.checked ? 'dark' : 'light',
		});
	};

	const colorPicker = (intent) => {
		const intentShade = state[`${intent}Shade`];

		var sliderEnabled = false;

		hues.forEach((hue) => {
			const shade = shades[state.primaryShade];
			const backgroundColor = colors[hue][shade];
			if (state[intent] === backgroundColor) {
				sliderEnabled = true;
			}
		});

		return (
			<Grid item xs={12}>
				<div className={classes.sliderContainer}>
					<Typography id={`${intent}ShadeSliderLabel`}>Shade:</Typography>
					<Slider
						className={classes.slider}
						value={intentShade}
						min={0}
						max={13}
						step={1}
						onChange={handleChangeShade(intent)}
						aria-labelledby={`${intent}ShadeSliderLabel`}
						disabled={!sliderEnabled}
					/>
					<Typography>{shades[intentShade]}</Typography>
				</div>
				<FormControlLabel control={<Switch checked={state.textShade === 'dark'} onChange={handleChangetextShade} name='checkedB' color='primary' />} label='Dark Text' style={{ margin: 8 }} />
				<div className={classes.swatch}>
					{hues.map((hue) => {
						const shade = shades[state.primaryShade];
						const backgroundColor = colors[hue][shade];

						return (
							<Tooltip placement='right' title={hue} key={hue}>
								<Radio
									className={classes.radio}
									color='default'
									checked={state[intent] === backgroundColor}
									onChange={handleChangeHue(intent)}
									value={hue}
									name={intent}
									aria-labelledby={`tooltip-${intent}-${hue}`}
									icon={<div className={classes.radioIcon} style={{ backgroundColor }} />}
									checkedIcon={
										<div className={classes.radioIconSelected} style={{ backgroundColor }}>
											<CheckIcon style={{ color: state.textShade === 'dark' ? '#000000de' : '#fff', fontSize: 30 }} />
										</div>
									}
								/>
							</Tooltip>
						);
					})}
				</div>
			</Grid>
		);
	};

	return (
		<div>
			<Button size='small' color='primary' onClick={handleClickOpen}>
				Edit
			</Button>
			<Dialog open={open} scroll={'body'} onClose={handleClose} maxWidth='sm' fullWidth>
				<DialogTitle id='form-dialog-title'>Edit</DialogTitle>
				<DialogContent>
					<DialogContentText>You can modify the name, color or image of the group.</DialogContentText>
					<Grid container spacing={5} className={classes.root}>
						<Grid item xs={12}>
							<Grid container spacing={5} className={classes.root}>
								<Grid item xs={12}>
									<Typography component='label' gutterBottom variant='h6'>
										Name:
									</Typography>
									<TextField label='Group Name' variant='outlined' fullWidth value={state.groupName} onChange={handleChangegroupName} style={{ marginTop: 12 }} />
								</Grid>
								<Grid item xs={12}>
									<Typography component='label' gutterBottom variant='h6'>
										Group Display:
									</Typography>
									<FormControl component='fieldset' fullWidth>
										<RadioGroup row aria-label='position' name='position' defaultValue='top' value={state.backgroundType} onChange={handleChangeBackgroundType}>
											<FormControlLabel value='color' control={<Radio color='primary' />} label='Color' />
											<FormControlLabel value='image' control={<Radio color='primary' />} label='Image' />
										</RadioGroup>
									</FormControl>
									{state.backgroundType === 'color' ? (
										<div>{colorPicker('primary')}</div>
									) : (
										<Button variant='contained' color='primary' size='large' component='label'>
											Upload Image
											<input type='file' accept='image/*' style={{ display: 'none' }} onChange={handleChangeImageUpload} />
										</Button>
									)}
								</Grid>
							</Grid>
						</Grid>
					</Grid>
					{state.backgroundValue.length > 15 && <img alt='group' style={{ maxWidth: '100%', maxHeight: 200, marginTop: 8 }} src={state.backgroundValue} />}
				</DialogContent>
				<DialogActions>
					<Delete group={props.group._id} setAlert={setAlert} closeModal={handleClose} getGroups={props.getGroups} />
					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							editMyGroup({
								id: props.group.id,
								backgroundType: state.backgroundType,
								backgroundValue: state.backgroundType === 'color' ? state.primary : state.backgroundValue,
								name: state.groupName,
								textShade: state.textShade,
							}).then((result) => {
								if (result === 'ok') {
									setAlert({ open: true, message: 'Group details saved!', severity: 'success' });
									handleClose();
									props.getGroups();
								} else {
									setAlert({ open: true, message: 'Error while saving details', severity: 'error' });
								}
							});
						}}
						color='primary'
						disabled={!(state.groupName.trim().length > 0 && (state.backgroundType === 'color' ? state.primary : state.backgroundValue).length !== 0)}
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

ColorTool.propTypes = {
	classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ColorTool);
