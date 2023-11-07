import * as React from 'react';
import { Link, useNavigate, useLocation, Location } from 'react-router-dom';
import { SnackbarKey, useSnackbar } from 'notistack';
import moment from 'moment';

import { useSupabase, SUPABASE_URL, useGetProfile, useGetSystem, useSetMaintenance, useGetLists, DEFAULT_LIST_ID } from '../lib/useSupabase';
import { GroupType, ListType, UserRoles } from '../lib/useSupabase/types';

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
	ListSubheader,
	FormControlLabel,
	Switch,
	Link as MUILink,
} from '@mui/material';
import { ExpandLess, ExpandMore, Archive, Delete, Group, ListAlt, Logout, ShoppingCart, Menu as MenuIcon, Podcasts, Close, Build } from '@mui/icons-material';

import AccountDialog from './AccountDialog';
import Notifications from './Notifications';

import { useGetGroups } from '../lib/useSupabase/hooks/useGroup';
import { GiftIcon } from './SvgIcons';
import Snowfall from 'react-snowfall';

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

interface RenderGroupItemOptions {
	group: GroupType;
	location: Location;
}
function renderGroupItem({ group, location }: RenderGroupItemOptions) {
	return (
		<ListItemButton key={group.id} sx={{ pl: 4 }} component={Link} to={`/groups/${group.id}`} selected={location.pathname.startsWith(`/groups/${group.id}`)}>
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
interface RenderListItemOptions {
	list: ListType;
	location: Location;
}
function renderListItem({ list, location }: RenderListItemOptions) {
	return (
		<ListItemButton key={list.id} sx={{ pl: 4 }} component={Link} to={`/lists/${list.id}`} selected={location.pathname.startsWith(`/lists/${list.id}`)}>
			<ListItemAvatar>
				<Avatar src={list.image} alt={list.name} sx={{ width: 32, height: 32, bgcolor: location.pathname.startsWith(`/lists/${list.id}`) ? 'primary.main' : undefined }}>
					<ListAlt sx={{ width: 18, height: 18 }} />
				</Avatar>
			</ListItemAvatar>

			<ListItemText primary={list.name} />
		</ListItemButton>
	);
}

const Navigation: React.FC<{ children: JSX.Element }> = ({ children }) => {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const { client, user } = useSupabase();
	const { data: profile, isLoading, refetch: refetchProfile } = useGetProfile();
	const { data: system, isLoading: systemLoading } = useGetSystem();

	React.useEffect(() => {
		client
			.channel(`public:profiles:user_id=eq.${user.id}`)
			.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload) => {
				refetchProfile();
			})
			.subscribe();
	}, [user, client, profile?.avatar_token, refetchProfile]);

	// handle homepage redirect
	React.useEffect(() => {
		if (location.pathname === '/' && profile?.home !== '/') {
			navigate(profile?.home!);
		}
	}, [location.pathname, profile, navigate]);

	const { data: groups } = useGetGroups();
	const { data: lists } = useGetLists();

	const [drawerOpen, setDrawerOpen] = React.useState(true);
	const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

	const [groupsOpen, setGroupsOpen] = React.useState(true);
	const [listsOpen, setListsOpen] = React.useState(true);

	const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorElUser(event.currentTarget);
	};

	const handleCloseUserMenu = () => {
		setAnchorElUser(null);
	};

	const toggleDrawer = () => {
		setDrawerOpen(!drawerOpen);
	};

	const setMaintenance = useSetMaintenance();
	const handleMaintenance = async (maintenance: boolean) => {
		await setMaintenance
			.mutateAsync({ ...system!, maintenance })
			.then(() => {
				if (maintenance) {
					enqueueSnackbar(`Maintenance mode enabled!`, { variant: 'info' });
				} else {
					enqueueSnackbar(`Maintenance mode disabled!`, { variant: 'info' });
				}
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to set maintenance! ${err.message}`, { variant: 'error' });
			});
	};

	return (
		<Box sx={{ display: 'flex' }}>
			{(new Date().getMonth() === 10 || new Date().getMonth() === 11 || new Date().getMonth() === 0) && profile?.enable_snowfall && (
				<div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', zIndex: 5000, pointerEvents: 'none' }}>
					<Snowfall snowflakeCount={window.innerWidth * 0.035} />
				</div>
			)}
			<AppBar position='fixed' color='primary' enableColorOnDark sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
				<Toolbar>
					<IconButton color='inherit' aria-label='open drawer' onClick={toggleDrawer} edge='start' sx={{ mr: 2, display: { xs: 'none', sm: 'none', md: 'flex' } }}>
						<MenuIcon />
					</IconButton>

					<Typography
						variant='h6'
						noWrap
						component={Link}
						to={profile?.home ?? '/'}
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
							{profile?.roles?.roles.includes(UserRoles.debug) && (
								<Tooltip title='Get Realtime Channels'>
									<IconButton
										size='large'
										color='inherit'
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
								<IconButton onClick={isLoading ? undefined : handleOpenUserMenu} sx={{ p: 0 }} className='profile-icon'>
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

							{profile?.enable_archive && (
								<MenuItem onClick={handleCloseUserMenu} component={Link} to='/archive' sx={{ display: { xs: 'flex', md: 'none' } }}>
									<ListItemIcon>
										<Archive fontSize='small' />
									</ListItemIcon>
									<Typography textAlign='center'>Archive</Typography>
								</MenuItem>
							)}
							{profile?.enable_trash && (
								<MenuItem onClick={handleCloseUserMenu} component={Link} to='/trash' sx={{ display: { xs: 'flex', md: 'none' } }}>
									<ListItemIcon>
										<Delete fontSize='small' />
									</ListItemIcon>
									<Typography textAlign='center'>Trash</Typography>
								</MenuItem>
							)}

							<MenuItem
								onClick={() => {
									handleCloseUserMenu();
									client.auth.signOut();
									navigate('/signin');
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
							<ListItemButton component={Link} to='/items' selected={location.pathname === '/' || location.pathname === '/items'}>
								<ListItemIcon>
									<GiftIcon color={location.pathname === '/' || location.pathname === '/items' ? 'primary' : undefined} />
								</ListItemIcon>
								<ListItemText primary='Items' />
							</ListItemButton>
						</ListItem>
						{profile?.enable_lists && lists && (
							<>
								<ListItem disablePadding>
									<ListItemButton
										component={Link}
										to='/lists'
										selected={
											location.pathname.startsWith('/lists') &&
											!lists
												?.filter((l) => l.pinned === true)
												.map((l) => l.id)
												.includes(location.pathname?.split('/lists/')?.[1]?.split('/')?.[0])
										}
									>
										<ListItemIcon>
											<ListAlt color={location.pathname === '/lists' ? 'primary' : undefined} />
										</ListItemIcon>
										<ListItemText primary='Lists' />
									</ListItemButton>
									{drawerOpen &&
										lists &&
										[...lists?.filter((l) => l.id === DEFAULT_LIST_ID)!, ...lists?.filter((l) => l.id !== DEFAULT_LIST_ID)!]?.filter((l) => l.pinned === true)?.length > 0 && (
											<IconButton
												onClick={(e) => {
													e.preventDefault();
													setListsOpen(!listsOpen);
												}}
												sx={{
													borderRadius: 0,
													height: 48,
													width: 48,
													backgroundColor: location.pathname === '/lists' || location.pathname === '/lists/' ? 'rgba(76, 175, 80, 0.16)' : undefined,
												}}
											>
												{listsOpen ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}
											</IconButton>
										)}
								</ListItem>
								<Collapse in={listsOpen && drawerOpen} timeout='auto' unmountOnExit>
									<List component='div' disablePadding>
										<TransitionGroup>
											{[...lists?.filter((l) => l.id === DEFAULT_LIST_ID)!, ...lists?.filter((l) => l.id !== DEFAULT_LIST_ID)!]
												?.filter((l) => l.pinned === true)
												.map((list, index) => (
													<Collapse key={list.id}>{renderListItem({ list, location })}</Collapse>
												))}
										</TransitionGroup>
									</List>
								</Collapse>
							</>
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
											<Collapse key={group.id}>{renderGroupItem({ group, location })}</Collapse>
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
					{(profile?.enable_archive || profile?.enable_trash) && (
						<>
							<Divider />
							<List>
								{profile?.enable_archive && (
									<ListItem disablePadding>
										<ListItemButton component={Link} to='/archive' selected={location.pathname === '/archive'}>
											<ListItemIcon>
												<Archive color={location.pathname === '/archive' ? 'primary' : undefined} />
											</ListItemIcon>
											<ListItemText primary='Archive' />
										</ListItemButton>
									</ListItem>
								)}
								{profile?.enable_trash && (
									<ListItem disablePadding>
										<ListItemButton component={Link} to='/trash' selected={location.pathname === '/trash'}>
											<ListItemIcon>
												<Delete color={location.pathname === '/trash' ? 'primary' : undefined} />
											</ListItemIcon>
											<ListItemText primary='Trash' />
										</ListItemButton>
									</ListItem>
								)}
							</List>
						</>
					)}

					{profile?.roles?.roles.includes(UserRoles.admin) && !systemLoading && (
						<>
							<Divider />
							<ListSubheader inset sx={{ lineHeight: 1, position: 'relative', top: 12 }}>
								System
							</ListSubheader>
							<List>
								<ListItem>
									<ListItemIcon>
										<Build />
									</ListItemIcon>
									<ListItemText
										primary={
											<FormControlLabel
												control={
													setMaintenance.isLoading ? (
														<CircularProgress size={20} sx={{ ml: 2.5, mr: 2.25, mb: 1.1, mt: 1.1 }} />
													) : (
														<Switch
															checked={system?.maintenance}
															onChange={(e) => {
																handleMaintenance(e.target.checked);
															}}
															color='primary'
														/>
													)
												}
												label='Maintenance'
											/>
										}
										secondary={
											system?.user && (
												<Tooltip
													title={
														<>
															<Typography variant='body2'>
																{system.user.first_name} {system.user.last_name}
															</Typography>
															<Typography variant='body2' color='text.secondary'>
																{system.user.email}
															</Typography>
															<Typography variant='caption' color='text.secondary'>
																{moment(system.updated_at).format('L LTS')}
															</Typography>
														</>
													}
												>
													<MUILink color='inherit' sx={{ cursor: 'pointer' }}>
														Last Modified
													</MUILink>
												</Tooltip>
											)
										}
									/>
								</ListItem>
							</List>
						</>
					)}
				</Box>
			</Drawer>
			<Box component='main' sx={{ flexGrow: 1 }}>
				<Toolbar />
				<Box sx={{ mb: 4 }}>{children}</Box>
			</Box>
			<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: { xs: 'block', md: 'none' } }} elevation={3}>
				<BottomNavigation
					showLabels
					value={(() => {
						switch (true) {
							case location.pathname === '/' || location.pathname === '/items':
								return 0;
							case location.pathname.startsWith('/list'):
								return 1;
							case location.pathname.startsWith('/group'):
								return 2;
							case location.pathname.startsWith('/shopping'):
								return 3;
							default:
								return -1;
						}
					})()}
					onChange={(event, newValue) => {
						// setMobileNav(newValue);
						switch (newValue) {
							case 0:
								navigate('/items');
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
					<BottomNavigationAction label='Items' icon={<GiftIcon />} />
					{profile?.enable_lists && <BottomNavigationAction label='Lists' icon={<ListAlt />} />}
					<BottomNavigationAction label='Groups' icon={<Group />} />
					<BottomNavigationAction label='Shopping' icon={<ShoppingCart />} />
				</BottomNavigation>
			</Paper>
		</Box>
	);
};

export default Navigation;
