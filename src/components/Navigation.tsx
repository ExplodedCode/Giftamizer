import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useSupabase } from '../lib/useSupabase';

import { styled, Theme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import ListAltIcon from '@mui/icons-material/ListAlt';
import GroupIcon from '@mui/icons-material/Group';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Star from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import LogoutIcon from '@mui/icons-material/Logout';

import { Avatar, BottomNavigation, BottomNavigationAction, Collapse, CSSObject, IconButton, Menu, MenuItem, Paper, Tooltip } from '@mui/material';
import AccountDialog from './AccountDialog';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
	width: drawerWidth,
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen,
	}),
	overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	overflowX: 'hidden',
	width: `calc(${theme.spacing(7)} + 1px)`,
	[theme.breakpoints.up('sm')]: {
		width: `calc(${theme.spacing(8)} + 1px)`,
	},
});

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
	width: drawerWidth,
	flexShrink: 0,
	whiteSpace: 'nowrap',
	boxSizing: 'border-box',
	...(open && {
		...openedMixin(theme),
		'& .MuiDrawer-paper': openedMixin(theme),
	}),
	...(!open && {
		...closedMixin(theme),
		'& .MuiDrawer-paper': closedMixin(theme),
	}),
}));

const Navigation: React.FC<{ children: JSX.Element }> = ({ children }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [mobileNav, setMobileNav] = React.useState(getLocation(location.pathname));

	const { profile, client } = useSupabase();

	const [drawerOpen, setDrawerOpen] = React.useState(true);
	const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

	const [groupsOpen, setGroupsOpen] = React.useState(true);

	const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorElUser(event.currentTarget);
	};

	const handleCloseUserMenu = () => {
		setAnchorElUser(null);
	};

	const toggleDrawer = () => {
		setDrawerOpen(!drawerOpen);
	};

	return (
		<Box sx={{ display: 'flex' }}>
			<AppBar position='fixed' color='primary' enableColorOnDark sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
				<Toolbar>
					<IconButton color='inherit' aria-label='open drawer' onClick={toggleDrawer} edge='start' sx={{ mr: 2 }}>
						<MenuIcon />
					</IconButton>

					<Typography
						variant='h6'
						noWrap
						component={Link}
						to='/'
						sx={{
							flexGrow: 1,
							color: 'inherit',
							textDecoration: 'none',
						}}
					>
						Giftamizer
					</Typography>

					<Box sx={{ flexGrow: 0 }}>
						<Tooltip title='Open settings'>
							<IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
								<Avatar alt={profile.name} src={profile.avatar} />
							</IconButton>
						</Tooltip>
						<Menu
							sx={{ mt: '45px' }}
							id='menu-appbar'
							anchorEl={anchorElUser}
							anchorOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
							keepMounted
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
							open={Boolean(anchorElUser)}
							onClose={handleCloseUserMenu}
						>
							<AccountDialog handleCloseMenu={handleCloseUserMenu} />
							<MenuItem onClick={handleCloseUserMenu} component={Link} to='/archive' sx={{ display: { xs: 'flex', md: 'none' } }}>
								<ListItemIcon>
									<ArchiveIcon fontSize='small' />
								</ListItemIcon>
								<Typography textAlign='center'>Archive</Typography>
							</MenuItem>
							<MenuItem onClick={handleCloseUserMenu} component={Link} to='/trash' sx={{ display: { xs: 'flex', md: 'none' } }}>
								<ListItemIcon>
									<DeleteIcon fontSize='small' />
								</ListItemIcon>
								<Typography textAlign='center'>Trash</Typography>
							</MenuItem>
							<MenuItem
								onClick={() => {
									handleCloseUserMenu();
									client.auth.signOut();
								}}
							>
								<ListItemIcon>
									<LogoutIcon fontSize='small' />
								</ListItemIcon>
								<Typography textAlign='center'>Logout</Typography>
							</MenuItem>
						</Menu>
					</Box>
				</Toolbar>
			</AppBar>
			<Drawer variant='permanent' open={drawerOpen} sx={{ display: { xs: 'none', md: 'flex' } }}>
				<Toolbar />
				<Box>
					<List>
						<ListItem disablePadding>
							<ListItemButton component={Link} to='/'>
								<ListItemIcon>
									<i
										className='fas fa-gift'
										style={{
											fontSize: '1.19rem',
											marginLeft: 2,
										}}
									/>
								</ListItemIcon>
								<ListItemText primary='Items' />
							</ListItemButton>
						</ListItem>
						<ListItem disablePadding>
							<ListItemButton component={Link} to='/lists'>
								<ListItemIcon>
									<ListAltIcon />
								</ListItemIcon>
								<ListItemText primary='Lists' />
							</ListItemButton>
						</ListItem>
						<ListItem disablePadding>
							<ListItemButton component={Link} to='/groups'>
								<ListItemIcon>
									<GroupIcon />
								</ListItemIcon>
								<ListItemText primary='Groups' />
							</ListItemButton>
							{drawerOpen && (
								<IconButton
									aria-label='delete'
									onClick={(e) => {
										e.preventDefault();
										setGroupsOpen(!groupsOpen);
									}}
									sx={{ borderRadius: 0 }}
									size='large'
								>
									{groupsOpen ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}
								</IconButton>
							)}
						</ListItem>
						<Collapse in={groupsOpen && drawerOpen} timeout='auto' unmountOnExit>
							<List component='div' disablePadding>
								<ListItemButton component={Link} to='/groups/groupid' sx={{ pl: 4 }}>
									<ListItemIcon>
										<Star />
									</ListItemIcon>
									<ListItemText primary='Pinned Group' />
								</ListItemButton>
							</List>
						</Collapse>
					</List>
					<Divider />
					<List>
						<ListItem disablePadding>
							<ListItemButton component={Link} to='/shopping'>
								<ListItemIcon>
									<ShoppingCartIcon />
								</ListItemIcon>
								<ListItemText primary='Shopping List' />
							</ListItemButton>
						</ListItem>
					</List>
					<Divider />
					<List>
						<ListItem disablePadding>
							<ListItemButton component={Link} to='/archive'>
								<ListItemIcon>
									<ArchiveIcon />
								</ListItemIcon>
								<ListItemText primary='Archive' />
							</ListItemButton>
						</ListItem>
						<ListItem disablePadding>
							<ListItemButton component={Link} to='/trash'>
								<ListItemIcon>
									<DeleteIcon />
								</ListItemIcon>
								<ListItemText primary='Trash' />
							</ListItemButton>
						</ListItem>
					</List>
				</Box>
			</Drawer>
			<Box component='main' sx={{ flexGrow: 1, p: { xs: 1.5, md: 3 } }}>
				<Toolbar />
				<Box>{children}</Box>
			</Box>
			<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: { xs: 'block', md: 'none' } }} elevation={3}>
				<BottomNavigation
					showLabels
					value={mobileNav}
					onChange={(event, newValue) => {
						setMobileNav(newValue);
						switch (newValue) {
							case 0:
								navigate('/');
								break;
							case 1:
								navigate('/lists');
								break;
							case 2:
								navigate('/groups');
								break;
							case 3:
								navigate('/shopping');
								break;
						}
					}}
				>
					<BottomNavigationAction label='Items' icon={<i className='fas fa-gift' style={{ fontSize: '1.19rem' }} />} />
					<BottomNavigationAction label='Lists' icon={<ListAltIcon />} />
					<BottomNavigationAction label='Groups' icon={<GroupIcon />} />
					<BottomNavigationAction label='Shopping' icon={<ShoppingCartIcon />} />
				</BottomNavigation>
			</Paper>
		</Box>
	);
};

export default Navigation;

function getLocation(path: string) {
	if (path.startsWith('/list')) {
		return 1;
	} else if (path.startsWith('/group')) {
		return 2;
	} else if (path.startsWith('/shopping')) {
		return 3;
	}
	return 0;
}
