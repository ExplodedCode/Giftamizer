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
import ColorDemo from './ColorDemo';

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

import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import CircularProgress from '@mui/material/CircularProgress';

import { saveAccountDisplay, setAccountEmail } from '../../../firebase/gift/user';
import { verifyPassword, changeEmail, getError } from '../../../firebase/auth';
import { firebaseAuth } from '../../../firebase/constants';

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
		primary: props.settings.main,
		primaryInput: props.settings.main,
		primaryHue: 'green',
		primaryShade: 4,
		textShade: props.settings.textShade ?? 'light',
		backgroundType: props.settings.backgroundType,
		backgroundValue: props.settings.backgroundValue,
		displayName: props.settings.displayName,

		email: firebaseAuth().currentUser.email,
		passwordOpen: false,
		currentPassword: '',

		saveloading: false,
	});

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

	const handleChangedisplayName = (event) => {
		setState({
			...state,
			displayName: event.target.value,
		});
	};
	const handleChangeEmail = (event) => {
		setState({
			...state,
			email: event.target.value,
		});
	};
	const handleChangePassword = (event) => {
		setState({
			...state,
			currentPassword: event.target.value,
		});
	};
	const handleChangeType = (event) => {
		setState({
			...state,
			textShade: event.target.checked ? 'dark' : 'light',
		});
	};

	const handleChangeDocsColors = () => {
		setState({ ...state, saveloading: true });

		saveAccountDisplay({
			textShade: state.textShade,
			backgroundType: state.backgroundType,
			backgroundValue: state.backgroundType === 'color' ? state.primary : state.backgroundValue,
			displayName: state.displayName,
		}).then((result) => {
			if (result === 'ok') {
				setState({ ...state, saveloading: false });
				props.openSnackber('Account saved!', 'success');
			} else {
				setState({ ...state, saveloading: false });
				props.openSnackber('Error saving account!', 'error');
			}
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
				<FormControlLabel control={<Switch checked={state.textShade === 'dark'} onChange={handleChangeType} name='checkedB' color='primary' />} label='Dark Text' style={{ margin: 8 }} />
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
											<CheckIcon style={{ fontSize: 30 }} />
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
		<>
			<Grid container spacing={5} className={classes.root}>
				<Grid item xs={12} sm={12} md={6}>
					<Grid container spacing={2} className={classes.root}>
						<Grid item xs={12}>
							<Typography component='label' gutterBottom variant='h5'>
								Account Display:
							</Typography>
							<TextField label='Full Name' variant='outlined' fullWidth value={state.displayName} onChange={handleChangedisplayName} style={{ marginTop: 12 }} />
						</Grid>
						<Grid item xs={12}>
							<TextField label='Email' variant='outlined' fullWidth value={state.email} onChange={handleChangeEmail} style={{ marginTop: 12, marginBottom: 12 }} />
							<Button
								variant='contained'
								color='primary'
								onClick={() =>
									setState({
										...state,
										passwordOpen: true,
									})
								}
								endIcon={<EmailIcon />}
							>
								Change Email
							</Button>
						</Grid>
						<Grid item xs={12}>
							<Typography component='label' gutterBottom variant='h6'>
								Display in Groups:
							</Typography>
							<FormControl component='fieldset' fullWidth>
								<RadioGroup row aria-label='position' name='position' defaultValue='top' value={state.backgroundType} onChange={handleChangeBackgroundType}>
									<FormControlLabel value='color' control={<Radio color='primary' />} label='Color' />
									<FormControlLabel value='image' control={<Radio color='primary' />} label='Image' />
								</RadioGroup>
							</FormControl>
							{state.backgroundType === 'image' ? (
								<Button variant='contained' color='primary' size='large' component='label'>
									Upload Image
									<input type='file' accept='image/*' style={{ display: 'none' }} onChange={handleChangeImageUpload} />
								</Button>
							) : (
								<div>{colorPicker('primary')}</div>
							)}
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12} sm={12} md={6}>
					<ColorDemo data={state} />
				</Grid>
				<Grid item xs={12}>
					<Button
						variant='contained'
						color='primary'
						disabled={!(!state.saveloading && state.displayName.trim().length > 0 && (state.backgroundType === 'color' ? state.primary : state.backgroundValue).length !== 0)}
						onClick={handleChangeDocsColors}
						endIcon={state.saveloading ? <CircularProgress style={{ color: 'white', height: 20, width: 20 }} /> : <SaveIcon />}
					>
						Save Settings
					</Button>
				</Grid>
			</Grid>
			<Dialog
				open={state.passwordOpen}
				onClose={() =>
					setState({
						...state,
						passwordOpen: false,
					})
				}
				maxWidth={'xs'}
				fullWidth
			>
				<DialogTitle id='form-dialog-title'>Re-enter Password</DialogTitle>
				<DialogContent>
					<DialogContentText>To make sure its you please enter your current password.</DialogContentText>
					<TextField autoFocus margin='dense' label='Password' type='password' fullWidth value={state.currentPassword} onChange={handleChangePassword} />
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() =>
							setState({
								...state,
								passwordOpen: false,
							})
						}
					>
						Cancel
					</Button>
					<Button
						onClick={() => {
							verifyPassword(state.currentPassword)
								.then((res) => {
									if (res.code) {
										props.openSnackber(getError(res?.code || 'ERROR!'), 'error');
									} else {
										changeEmail(state.email)
											.then((eRes) => {
												console.log(eRes);
												if (eRes.code) {
													props.openSnackber(getError(eRes?.code || 'ERROR!'), 'error');
												} else {
													setAccountEmail(state.email).then((result) => {
														if (result === 'ok') {
															props.openSnackber('Email changed!', 'success');
															setState({
																...state,
																passwordOpen: false,
															});
														} else {
															props.openSnackber('Error saving email!', 'error');
														}
													});
												}
											})
											.catch((err) => {
												console.log(err);
												props.openSnackber('ERROR!', 'error');
											});
									}
								})
								.catch((err) => {
									console.log(err);
									props.openSnackber('ERROR!', 'error');
								});
						}}
						color='primary'
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

ColorTool.propTypes = {
	classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ColorTool);
