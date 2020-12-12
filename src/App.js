import React, { Component } from 'react';

import socketIOClient from 'socket.io-client';

import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import CssBaseline from '@material-ui/core/CssBaseline';

import CircularProgress from '@material-ui/core/CircularProgress';

import { firebaseAuth } from './firebase/constants';

import Landing from './components/Landing';
import Signin from './components/Signin/Signin';
import Signup from './components/Signin/Signup';
import Gift from './components/Gift/Gift';

var socket; // define socket

function PrivateRoute({ component: Component, authed, ...rest }) {
	return <Route {...rest} render={(props) => (authed ? <Component {...props} /> : <Redirect to={{ pathname: '/signin', state: { from: props.location } }} />)} />;
}

function PublicRoute({ component: Component, authed, ...rest }) {
	return <Route {...rest} render={(props) => (authed ? <Redirect to='/gift' /> : <Component {...props} />)} />;
}

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			authed: false,
			loading: true,
			user: null,
			endpoint: 'https://api.giftamizer.com',
		};

		socket = socketIOClient(this.state.endpoint); // initialize socket

		// this.prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

		this.default = createMuiTheme({
			palette: {
				// type: this.prefersDarkMode ? 'dark' : 'light',
				primary: {
					light: '#6fbf73',
					main: '#4caf50',
					dark: '#357a38',
					contrastText: '#fff',
				},
				secondary: {
					light: '#f6685e',
					main: '#f44336',
					dark: '#aa2e25',
					contrastText: '#fff',
				},
			},
		});

		this.removeListener = firebaseAuth().onAuthStateChanged((user) => {
			if (user) {
				this.setState(
					{
						user: user,
						authed: true,
					},
					() => {
						this.setState({ loading: false });
					}
				);
			} else {
				this.setState({
					user: null,
					authed: false,
					loading: false,
				});
			}
		});
	}

	render() {
		return this.state.loading === true ? (
			<MuiThemeProvider theme={this.default}>
				<CssBaseline />
				<CircularProgress style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, margin: 'auto' }} />
			</MuiThemeProvider>
		) : (
			<MuiThemeProvider theme={this.default}>
				<CssBaseline />
				<BrowserRouter>
					<Switch>
						<PublicRoute authed={this.state.authed} exact path='/' component={Landing} />
						<PublicRoute authed={this.state.authed} exact path='/signin' component={Signin} />
						<PublicRoute authed={this.state.authed} exact path='/signup' component={Signup} />
						<PrivateRoute authed={this.state.authed} path='/gift' component={(props) => <Gift {...props} user={this.state.user} socket={socket} />} />
					</Switch>
				</BrowserRouter>
			</MuiThemeProvider>
		);
	}
}
