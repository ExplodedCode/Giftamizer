import * as React from 'react';
import { Link, useNavigate, useLocation, Location } from 'react-router-dom';
import { SnackbarKey, useSnackbar } from 'notistack';

import { useSupabase, SUPABASE_URL, useGetProfile } from '../lib/useSupabase';
import { GroupType, Profile } from '../lib/useSupabase/types';

import { TransitionGroup } from 'react-transition-group';
import { styled, Theme } from '@mui/material/styles';
import {
	AppBar,
	Avatar,
	BottomNavigation,
	BottomNavigationAction,
	Box,
	Collapse,
	CSSObject,
	Divider,
	Drawer as MuiDrawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Paper,
	Stack,
	Toolbar,
	Tooltip,
	Typography,
	CircularProgress,
	ListItemAvatar,
	Button,
} from '@mui/material';
import { ExpandLess, ExpandMore, Archive, Delete, Group, ListAlt, Logout, ShoppingCart, Menu as MenuIcon, Podcasts, Close } from '@mui/icons-material';

import AccountDialog from './AccountDialog';
import Notifications from './Notifications';
import { useGetGroups } from '../lib/useSupabase/hooks/useGroup';

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

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop: string) => prop !== 'open' })(({ theme, open }) => ({
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

interface RenderItemOptions {
	group: GroupType;
	location: Location;
}
function renderItem({ group, location }: RenderItemOptions) {
	return (
		<ListItemButton key={group.id} sx={{ pl: 4 }} component={Link} to={`/groups/${group.id}`} selected={location.pathname.startsWith(`/groups/${group.id}`)}>
			{/* <ListItemIcon>
				<Star />
			</ListItemIcon> */}

			<ListItemAvatar>
				<Avatar
					alt={group.name}
					sx={{ width: 32, height: 32, bgcolor: location.pathname.startsWith(`/groups/${group.id}`) ? 'primary.main' : undefined }}
					src={`${SUPABASE_URL}/storage/v1/object/public/groups/${group.id}?${group.image_token}`}
				/>
			</ListItemAvatar>

			<ListItemText primary={group.name} />
		</ListItemButton>
	);
}

const Navigation: React.FC<{ children: JSX.Element }> = ({ children }) => {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();
	const [mobileNav, setMobileNav] = React.useState(getLocation(location.pathname));

	const { client, user } = useSupabase();
	const { data: profile, isLoading, refetch: refetchProfile } = useGetProfile();

	React.useEffect(() => {
		client
			.channel(`public:profiles:user_id=eq.${user.id}`)
			.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload) => {
				const newProfile = payload.new as Profile;
				if (newProfile.avatar_token !== profile?.avatar_token) {
					refetchProfile();
				}
			})
			.subscribe();
	}, [user, client, profile?.avatar_token, refetchProfile]);

	const { data: groups } = useGetGroups();

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
					<IconButton color='inherit' aria-label='open drawer' onClick={toggleDrawer} edge='start' sx={{ mr: 2, display: { xs: 'none', sm: 'none', md: 'flex' } }}>
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
						<Stack direction='row' spacing={2}>
							{window.location.hostname !== 'giftamizer.com' && (
								<Tooltip title='Get Realtime Channels'>
									<IconButton
										size='large'
										onClick={() => {
											var channels = client.getChannels();
											enqueueSnackbar(`${channels.length} Channels:`, {
												variant: 'info',
												action: (snackbarId: SnackbarKey | undefined) => (
													<React.Fragment>
														{channels.map((c) => (
															<>
																{c.topic}
																<br />
															</>
														))}
														<IconButton size='small' aria-label='close' color='inherit' onClick={() => closeSnackbar(snackbarId)}>
															<Close fontSize='small' />
														</IconButton>
													</React.Fragment>
												),
											});
											console.log(channels);
										}}
									>
										<Podcasts />
									</IconButton>
								</Tooltip>
							)}

							<Notifications />
							<Tooltip title='Open settings'>
								<IconButton onClick={isLoading ? undefined : handleOpenUserMenu} sx={{ p: 0 }}>
									{isLoading ? <CircularProgress color='inherit' /> : <Avatar alt={profile?.first_name} src={profile?.image || '/defaultAvatar.png'} />}
								</IconButton>
							</Tooltip>
						</Stack>
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
									<Archive fontSize='small' />
								</ListItemIcon>
								<Typography textAlign='center'>Archive</Typography>
							</MenuItem>
							<MenuItem onClick={handleCloseUserMenu} component={Link} to='/trash' sx={{ display: { xs: 'flex', md: 'none' } }}>
								<ListItemIcon>
									<Delete fontSize='small' />
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
									<Logout fontSize='small' />
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
							<ListItemButton component={Link} to='/' selected={location.pathname === '/'}>
								<ListItemIcon>
									<Box
										className='fas fa-gift'
										sx={{
											fontSize: '1.19rem',
											marginLeft: 0.35,
											color: location.pathname === '/' ? 'primary.main' : undefined,
										}}
									/>
								</ListItemIcon>
								<ListItemText primary='Items' />
							</ListItemButton>
						</ListItem>
						{profile?.enable_lists && (
							<ListItem disablePadding>
								<ListItemButton component={Link} to='/lists' selected={location.pathname.startsWith('/lists')}>
									<ListItemIcon>
										<ListAlt color={location.pathname.startsWith('/lists') ? 'primary' : undefined} />
									</ListItemIcon>
									<ListItemText primary='Lists' />
								</ListItemButton>
							</ListItem>
						)}
						<ListItem disablePadding>
							<ListItemButton
								component={Link}
								to='/groups'
								selected={
									location.pathname.startsWith('/groups') &&
									!groups
										?.filter((g) => g.my_membership[0].pinned === true)
										.map((g) => g.id)
										.includes(location.pathname?.split('/groups/')?.[1]?.split('/')?.[0])
								}
							>
								<ListItemIcon>
									<Group color={location.pathname === '/groups' ? 'primary' : undefined} />
								</ListItemIcon>
								<ListItemText primary='Groups' />
							</ListItemButton>
							{drawerOpen && groups && groups?.filter((g) => g.my_membership[0].pinned === true)?.length > 0 && (
								<IconButton
									onClick={(e) => {
										e.preventDefault();
										setGroupsOpen(!groupsOpen);
									}}
									sx={{
										borderRadius: 0,
										height: 48,
										width: 48,
										backgroundColor: location.pathname === '/groups' || location.pathname === '/groups/' ? 'rgba(76, 175, 80, 0.16)' : undefined,
									}}
								>
									{groupsOpen ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}
								</IconButton>
							)}
						</ListItem>
						<Collapse in={groupsOpen && drawerOpen} timeout='auto' unmountOnExit>
							<List component='div' disablePadding>
								<TransitionGroup>
									{groups
										?.filter((g) => g.my_membership[0].pinned === true)
										.map((group, index) => (
											<Collapse key={group.id}>{renderItem({ group, location })}</Collapse>
										))}
								</TransitionGroup>
							</List>
						</Collapse>
					</List>
					<Divider />
					<List>
						<ListItem disablePadding>
							<ListItemButton component={Link} to='/shopping' selected={location.pathname === '/shopping'}>
								<ListItemIcon>
									<ShoppingCart color={location.pathname === '/shopping' ? 'primary' : undefined} />
								</ListItemIcon>
								<ListItemText primary='Shopping List' />
							</ListItemButton>
						</ListItem>
					</List>
					<Divider />
					<List>
						<ListItem disablePadding>
							<ListItemButton component={Link} to='/archive' selected={location.pathname === '/archive'}>
								<ListItemIcon>
									<Archive color={location.pathname === '/archive' ? 'primary' : undefined} />
								</ListItemIcon>
								<ListItemText primary='Archive' />
							</ListItemButton>
						</ListItem>
						<ListItem disablePadding>
							<ListItemButton component={Link} to='/trash' selected={location.pathname === '/trash'}>
								<ListItemIcon>
									<Delete color={location.pathname === '/trash' ? 'primary' : undefined} />
								</ListItemIcon>
								<ListItemText primary='Trash' />
							</ListItemButton>
						</ListItem>
					</List>
				</Box>
			</Drawer>
			<Box component='main' sx={{ flexGrow: 1 }}>
				<Toolbar />
				<Box sx={{ mb: 4 }}>{children}</Box>
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
					{profile?.enable_lists && <BottomNavigationAction label='Lists' icon={<ListAlt />} />}
					<BottomNavigationAction label='Groups' icon={<Group />} />
					<BottomNavigationAction label='Shopping' icon={<ShoppingCart />} />
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
