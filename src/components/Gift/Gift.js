import React from 'react';

import { useCookies } from 'react-cookie';
import { Route, Switch, Link } from 'react-router-dom';

import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';

import NavLinks from './NavLinks';

// gift
import Dashboard from './Dashboard';
import Items from './Items/Items';

import Lists from './Lists/Lists';
import List from './Lists/List/Items';

import Groups from './Groups/Groups';
import Group from './Groups/Group/Group';
import MemberItems from './Groups/Group/Members/Items';
import ListItems from './Groups/Group/Members/List/Items';

import ShoppingList from './ShoppingList/Items';

import Me from './Me/Me';

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

export default function Gift() {
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
					{/* <Tooltip title='Logout' placement='left'>
						<IconButton color='inherit' onClick={logout}>
							<ExitToAppIcon />
						</IconButton>
					</Tooltip> */}
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
						<Route exact path='/gift' component={(props) => <Dashboard {...props} setTitle={setTitle} />} />

						<Route exact path='/gift/groups' component={(props) => <Groups {...props} setTitle={setTitle} />} />
						<Route exact path='/gift/group/:group' component={(props) => <Group {...props} setTitle={setTitle} />} />
						<Route exact path='/gift/group/:group/member/:member' component={(props) => <MemberItems {...props} setTitle={setTitle} />} />
						<Route exact path='/gift/group/:group/member/:member/list/:list' component={(props) => <ListItems {...props} setTitle={setTitle} />} />

						<Route exact path='/gift/items' component={(props) => <Items {...props} setTitle={setTitle} />} />

						<Route exact path='/gift/lists' component={(props) => <Lists {...props} setTitle={setTitle} />} />
						<Route exact path='/gift/list/:list' component={(props) => <List {...props} setTitle={setTitle} />} />

						<Route exact path='/gift/shopping' component={(props) => <ShoppingList {...props} setTitle={setTitle} />} />

						<Route exact path='/gift/me' component={(props) => <Me {...props} setTitle={setTitle} />} />
					</Switch>
				</div>
			</main>
		</div>
	);
}
