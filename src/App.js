import React, { Component } from 'react';

import { useCookies } from 'react-cookie';
import { BrowserRouter, Route, Switch, Link, Redirect } from 'react-router-dom';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import CircularProgress from '@material-ui/core/CircularProgress';

import { firebaseAuth, db } from './firebase/constants';

import Landing from './components/Landing';
import Signin from './components/Signin/Signin';
import Signup from './components/Signin/Signup';
import Gift from './components/Gift/Gift';

function PrivateRoute({ component: Component, authed, ...rest }) {
	return <Route {...rest} render={(props) => (authed ? <Component {...props} /> : <Redirect to={{ pathname: '/signin', state: { from: props.location } }} />)} />;
}

function PublicRoute({ component: Component, authed, ...rest }) {
	return <Route {...rest} render={(props) => (authed ? <Redirect to='/gift' /> : <Component {...props} />)} />;
}

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
	root: {
		display: 'flex',
	},
	toolbar: {
		paddingRight: 24, // keep right padding when drawer closed
	},
	toolbarIcon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		padding: '0 8px',
		...theme.mixins.toolbar,
	},
	appBar: {
		zIndex: theme.zIndex.drawer + 1,
		transition: theme.transitions.create(['width', 'margin'], {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.leavingScreen,
		}),
	},
	appBarShift: {
		marginLeft: drawerWidth,
		width: `calc(100% - ${drawerWidth}px)`,
		transition: theme.transitions.create(['width', 'margin'], {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
	},
	menuButton: {
		marginRight: 36,
	},
	menuButtonHidden: {
		display: 'none',
	},
	title: {
		flexGrow: 1,
		textDecoration: 'none',
	},
	drawerPaper: {
		position: 'relative',
		whiteSpace: 'nowrap',
		width: drawerWidth,
		transition: theme.transitions.create('width', {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
	},
	drawerPaperClose: {
		overflowX: 'hidden',
		transition: theme.transitions.create('width', {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.leavingScreen,
		}),
		width: theme.spacing(7),
		[theme.breakpoints.up('sm')]: {
			width: theme.spacing(9),
		},
	},
	appBarSpacer: theme.mixins.toolbar,
	content: {
		flexGrow: 1,
		height: 'calc(100vh - 64px)',
		overflow: 'auto',
		marginTop: 64,
	},
	container: {
		paddingTop: theme.spacing(4),
		paddingBottom: theme.spacing(4),
	},
	fixedHeight: {
		height: 240,
	},
}));

// export default function Dashboard() {
// 	const [cookies, setCookie] = useCookies(['DrawerOpen']);

// 	const classes = useStyles();
// 	const [open, setOpen] = React.useState(cookies.DrawerOpen === 'true' ? true : JSON.stringify(cookies).indexOf('DrawerOpen') === -1 ? true : false);
// 	const [title, setTitle] = React.useState('Dashboard');

// 	const handleDrawerOpen = () => {
// 		setCookie('DrawerOpen', true, { path: '/' });
// 		setOpen(true);
// 	};
// 	const handleDrawerClose = () => {
// 		setCookie('DrawerOpen', false, { path: '/' });
// 		setOpen(false);
// 	};

// 	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
// 	const theme = React.useMemo(
// 		() =>
// 			createMuiTheme({
// 				palette: {
// 					type: prefersDarkMode ? 'dark' : 'light',
// 					primary: {
// 						light: '#15c4ff',
// 						main: '#4caf50',
// 						dark: '#357a38',
// 						contrastText: '#fff',
// 					},
// 					secondary: {
// 						light: '#ff7961',
// 						main: '#f44336',
// 						dark: '#ba000d',
// 						contrastText: '#000',
// 					},
// 				},
// 			}),
// 		[prefersDarkMode]
// 	);

// 	return (
// 		<div className={classes.root}>
// 			<ThemeProvider theme={theme}>
// 				<CssBaseline />
// 				<Landing />
// 			</ThemeProvider>
// 		</div>
// 	);
// }

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			authed: false,
			loading: true,
			user: null,
		};

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
					contrastText: '#000',
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
						// var themeRef = db.collection('/locations/' + user.uid + '/preferences').doc('theme');
						// themeRef.onSnapshot((doc) => {
						// 	if (doc.exists) {
						// 		this.default = createMuiTheme({
						// 			palette: {
						// 				type: doc.data().type,
						// 				primary: {
						// 					light: doc.data().light,
						// 					main: doc.data().main,
						// 					dark: doc.data().dark,
						// 					contrastText: doc.data().contrastText,
						// 				},
						// 			},
						// 		});
						// 		this.setState({ loading: false });
						// 	} else {
						// 		this.setState({ loading: false });
						// 	}
						// });
					}
				);
			} else {
				console.log(user);
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
						<PrivateRoute authed={this.state.authed} path='/gift' component={(props) => <Gift {...props} user={this.state.user} />} />
					</Switch>
				</BrowserRouter>
			</MuiThemeProvider>
		);
	}
}
