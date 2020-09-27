import React from 'react';

import { useCookies } from 'react-cookie';
import { BrowserRouter, Route, Switch, Link } from 'react-router-dom';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import Landing from './components/Landing';

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

	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
	const theme = React.useMemo(
		() =>
			createMuiTheme({
				palette: {
					type: prefersDarkMode ? 'dark' : 'light',
					primary: {
						light: '#15c4ff',
						main: '#4caf50',
						dark: '#357a38',
						contrastText: '#fff',
					},
					secondary: {
						light: '#ff7961',
						main: '#f44336',
						dark: '#ba000d',
						contrastText: '#000',
					},
				},
			}),
		[prefersDarkMode]
	);

	return (
		<div className={classes.root}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Landing />
			</ThemeProvider>
		</div>
	);
}
