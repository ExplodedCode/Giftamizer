import React, { Component } from 'react';

import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

import ColorTool from './ColorTool';

import CircularProgress from '@mui/material/CircularProgress';

import Snackbar from '@mui/material/Snackbar';
import Alert from '../../Alert';

import { firebaseAuth } from '../../../firebase/constants';

import Button from '@mui/material/Button';
import { logout } from '../../../firebase/auth';
import LockIcon from '@mui/icons-material/Lock';

class Printing extends Component {
	constructor(props) {
		super(props);
		this.state = {
			user: firebaseAuth().currentUser.uid,

			main: '#4caf50',
			textShade: 'light',

			backgroundType: '',
			backgroundValue: '',

			image: '',

			loading: true,
		};
		props.setTitle('My Account');
	}

	componentDidMount() {
		this.getThemeSettings();
	}

	getThemeSettings = () => {
		this.props.socket.emit('req:userData', firebaseAuth().currentUser.uid);
		this.props.socket.on('res:userData', (result) => {
			if (result) {
				if (result.backgroundType && result.backgroundValue) {
					this.setState({
						main: result.backgroundValue,
						textShade: result.textShade,
						backgroundType: result.backgroundType,
						backgroundValue: result.backgroundValue,
						displayName: result.displayName,
						image: result.image,
						loading: false,
					});
				} else {
					this.setState({
						displayName: result.displayName,
						backgroundType: 'color',
						loading: false,
					});
				}
			} else {
				this.setState({
					loading: false,
				});
			}
		});

		// var themeRef = db.collection('users').doc(firebaseAuth().currentUser.uid);

		// themeRef
		// 	.get()
		// 	.then((doc) => {
		// 		// console.log(doc.data());
		// 	})
		// 	.catch((error) => {
		// 		// console.log('Error getting document:', error);
		// 		this.setState({ loading: false });
		// 	});
	};

	handleSnackbarClose = () => {
		this.setState({
			snackbarOpen: false,
		});
	};
	handleSnackbarOpen = (message, severity) => {
		this.setState({
			snackbarOpen: true,
			snackbarMessage: message,
			snackbarSeverity: severity,
		});
	};

	render() {
		return this.state.loading === true ? (
			<div>
				<CircularProgress style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, margin: 'auto' }} />
			</div>
		) : (
			<div>
				<Paper elevation={9} style={{ padding: 12, margin: 8 }}>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<ColorTool settings={this.state} openSnackber={this.handleSnackbarOpen} />
						</Grid>
						{this.props.isMobile && (
							<Grid item xs={12}>
								<Button variant='contained' startIcon={<LockIcon />} onClick={logout} fullWidth>
									Logout
								</Button>
							</Grid>
						)}
					</Grid>
				</Paper>
				<Snackbar
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'center',
					}}
					open={this.state.snackbarOpen}
					autoHideDuration={5000}
					onClose={this.handleSnackbarClose}
				>
					<Alert onClose={this.handleSnackbarClose} severity={this.state.snackbarSeverity}>
						{this.state.snackbarMessage}
					</Alert>
				</Snackbar>
			</div>
		);
	}
}

export default Printing;
