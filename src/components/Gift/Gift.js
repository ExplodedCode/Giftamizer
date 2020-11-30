import React from 'react';

import { useCookies } from 'react-cookie';
import { BrowserRouter, Route, Switch, Redirect, Link } from 'react-router-dom';

import useMediaQuery from '@material-ui/core/useMediaQuery';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import SvgIcon from '@material-ui/core/SvgIcon';

import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Dialog from '@material-ui/core/Dialog';
import Container from '@material-ui/core/Container';

import NavLinks from './NavLinks';

// auth
import CircularProgress from '@material-ui/core/CircularProgress';
import firebase from 'firebase';

import Groups from './Group/Groups';

import { logout } from '../../firebase/auth';

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

export default function Dashboard() {
	const [cookies, setCookie] = useCookies(['DrawerOpen']);

	const classes = useStyles();
	const [open, setOpen] = React.useState(cookies.DrawerOpen === 'true' ? true : JSON.stringify(cookies).indexOf('DrawerOpen') === -1 ? true : false);
	const [title, setTitle] = React.useState('Dashboard');

	const handleDrawerOpen = () => {
		setCookie('DrawerOpen', true, { path: '/' });
		setOpen(true);
	};
	const handleDrawerClose = () => {
		setCookie('DrawerOpen', false, { path: '/' });
		setOpen(false);
	};

	return (
		<div className={classes.root}>
			<AppBar position='absolute' className={clsx(classes.appBar, open && classes.appBarShift)}>
				<Toolbar className={classes.toolbar}>
					<IconButton edge='start' color='inherit' aria-label='open drawer' onClick={handleDrawerOpen} className={clsx(classes.menuButton, open && classes.menuButtonHidden)}>
						<MenuIcon />
					</IconButton>
					<Typography component={Link} to='/' variant='h6' color='inherit' noWrap className={classes.title}>
						{title}
					</Typography>
					<Tooltip title='Logout' placement='left'>
						<IconButton color='inherit' onClick={logout}>
							<ExitToAppIcon />
						</IconButton>
					</Tooltip>
				</Toolbar>
			</AppBar>

			<Drawer
				variant='permanent'
				classes={{
					paper: clsx(classes.drawerPaper, !open && classes.drawerPaperClose),
				}}
				open={open}
			>
				<div className={classes.toolbarIcon}>
					<IconButton onClick={handleDrawerClose}>
						<ChevronLeftIcon />
					</IconButton>
				</div>
				<NavLinks />
			</Drawer>

			<main className={classes.content}>
				{/* <div className={classes.appBarSpacer} /> */}
				<div>
					<Switch>
						<Route exact path='/gift/groups' component={(props) => <Groups {...props} setTitle={setTitle} token={firebase.auth().currentUser.xa} />} />
					</Switch>
				</div>
			</main>
		</div>
	);
}
