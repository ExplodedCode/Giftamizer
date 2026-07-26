import * as React from 'react';
import { Link, useNavigate, useLocation, Location } from 'react-router-dom';
import { SnackbarKey, useSnackbar } from '../lib/snackbar';

import {
	useSupabase,
	useGetProfile,
	useGetLists,
	DEFAULT_LIST_ID,
	useGetTour,
	useUpdateTour,
	groupTourProgress,
	listTourProgress,
	shoppingTourProgress,
	useActiveTourLeg,
	SKIP_GROUP_TOUR,
	SKIP_LIST_TOUR,
	SKIP_SHOPPING_TOUR,
} from '../lib/useSupabase';
import { GroupType, ListType, UserRoles } from '../lib/useSupabase/types';

import { TransitionGroup } from 'react-transition-group';
import Snowfall from 'react-snowfall';
import { Archive, ChevronDown, ChevronUp, CircleHelp, ClipboardList, LogOut, Menu, Monitor, Moon, Podcast, Settings, ShoppingCart, Sun, Trash2, Users, X } from 'lucide-react';

import Notifications from './Notifications';
import { TourSkipButton } from './TourTooltip';
import { GiftIcon } from './SvgIcons';
import { useGetGroups } from '../lib/useSupabase/hooks/useGroup';
import { useGetSupportConfigured } from '../lib/useSupabase/hooks/useSupport';

import { cn, useMediaQuery } from '../lib/utils';
import { useTheme, type ThemePreference } from './theme/ThemeProvider';
import { TourHint } from './ui/tour-hint';
import { Collapse } from './ui/collapse';
import { Chip } from './ui/chip';
import { UserAvatar } from './ui/avatar';
import { Spinner } from './ui/spinner';
import { Separator } from './ui/separator';
import { SimpleTooltip } from './ui/tooltip';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';

const SIDEBAR_OPEN = 'w-60';
const SIDEBAR_CLOSED = 'w-16';
const MAIN_OPEN = 'md:pl-60';
const MAIN_CLOSED = 'md:pl-16';

// Note: no `flex-1` here — inside the column-direction <nav> its 0% basis
// applies to the height and defeats h-11. Rows that share a line with an
// expand chevron add `flex-1` themselves (there the main axis is the width).
function navRowClasses(selected: boolean, drawerOpen: boolean) {
	return cn(
		'flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
		'[&_svg]:size-5 [&_svg]:shrink-0',
		selected ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
		!drawerOpen && 'justify-center px-0'
	);
}

interface RenderGroupItemOptions {
	group: GroupType;
	location: Location;
}
function renderGroupItem({ group, location }: RenderGroupItemOptions) {
	const selected = location.pathname.startsWith(`/groups/${group.id}`);
	return (
		<Link
			to={`/groups/${group.id}`}
			className={cn(
				'mx-2 flex h-10 items-center gap-2.5 rounded-lg py-1 pr-2 pl-6 text-sm transition-colors',
				selected ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
			)}
		>
			<UserAvatar src={group.image} alt={group.name} className={cn('size-7 text-xs', !selected && '[&_[data-slot=avatar-fallback]]:bg-muted [&_[data-slot=avatar-fallback]]:text-muted-foreground')} />
			<span className='truncate'>{group.name}</span>
		</Link>
	);
}

interface RenderListItemOptions {
	list: ListType;
	location: Location;
}
function renderListItem({ list, location }: RenderListItemOptions) {
	const selected = location.pathname.startsWith(`/lists/${list.id}`);
	return (
		<Link
			to={`/lists/${list.id}`}
			className={cn(
				'mx-2 flex h-10 items-center gap-2.5 rounded-lg py-1 pr-2 pl-6 text-sm transition-colors',
				selected ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
			)}
		>
			<UserAvatar
				src={list.image}
				alt={list.name}
				fallback={<ClipboardList className='size-4' />}
				className={cn('size-7 text-xs', !selected && '[&_[data-slot=avatar-fallback]]:bg-muted [&_[data-slot=avatar-fallback]]:text-muted-foreground')}
			/>
			<span className='truncate'>{list.name}</span>
		</Link>
	);
}

function ThemeToggleRow() {
	const { theme, setTheme } = useTheme();

	const options: { value: ThemePreference; icon: React.ReactNode; label: string }[] = [
		{ value: 'light', icon: <Sun className='size-4' />, label: 'Light' },
		{ value: 'dark', icon: <Moon className='size-4' />, label: 'Dark' },
		{ value: 'system', icon: <Monitor className='size-4' />, label: 'System' },
	];

	return (
		<div className='flex items-center gap-1 px-2 pb-1.5'>
			{options.map((option) => (
				<button
					key={option.value}
					type='button'
					title={option.label}
					onClick={() => setTheme(option.value)}
					className={cn(
						'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors [&_svg]:shrink-0',
						theme === option.value ? 'border-primary/30 bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
					)}
				>
					{option.icon}
					{option.label}
				</button>
			))}
		</div>
	);
}

const Navigation: React.FC<{ children: React.JSX.Element }> = ({ children }) => {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();
	const isDesktop = useMediaQuery('(min-width: 900px)');

	const { client, user } = useSupabase();
	const { data: profile, isLoading, refetch: refetchProfile } = useGetProfile();

	const { data: groups } = useGetGroups();
	const { data: lists } = useGetLists();
	const { data: supportConfigured } = useGetSupportConfigured();

	//
	// user tour
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const activeTourLeg = useActiveTourLeg();
	const [tourStart, setTourStart] = React.useState<boolean>(false);

	React.useEffect(() => {
		setTimeout(() => {
			setTourStart(true);
		}, 1500);
	}, []);

	const handleSkipGroupTour = () => {
		updateTour.mutateAsync(SKIP_GROUP_TOUR);
	};

	const tourGroupNav = () => {
		return (
			<div className='flex flex-col gap-1'>
				<p className='text-base font-semibold'>{groups?.filter((g) => !g.my_membership[0].invite).length !== 0 ? "Let's explore groups!" : "Let's create a group!"}</p>
				<p>Groups are how your items reach your friends and family.</p>

				<div className='mt-1 flex justify-end'>
					<TourSkipButton onClick={handleSkipGroupTour} loading={updateTour.isLoading}>
						Skip Group Tour
					</TourSkipButton>
				</div>
			</div>
		);
	};

	const handleSkipListTour = () => {
		updateTour.mutateAsync(SKIP_LIST_TOUR);
	};

	// Kept short on purpose - the Lists page opens with the full explanation.
	const tourListNav = () => {
		return (
			<div className='flex flex-col gap-1'>
				<p className='text-base font-semibold'>Lists are on!</p>
				<p>Open Lists to choose who sees which items.</p>

				<div className='mt-1 flex justify-end'>
					<TourSkipButton onClick={handleSkipListTour} loading={updateTour.isLoading}>
						Skip List Tour
					</TourSkipButton>
				</div>
			</div>
		);
	};

	const handleSkipShoppingTour = () => {
		updateTour.mutateAsync(SKIP_SHOPPING_TOUR);
	};

	const tourShoppingNav = () => {
		return (
			<div className='flex flex-col gap-1'>
				<p className='text-base font-semibold'>Last stop: your shopping list</p>
				<p>Every item you mark as planned or purchased collects here, ready for when you're actually out buying gifts.</p>

				<div className='mt-1 flex justify-end'>
					<TourSkipButton onClick={handleSkipShoppingTour} loading={updateTour.isLoading}>
						Skip Shopping Tour
					</TourSkipButton>
				</div>
			</div>
		);
	};

	const groupNavHint =
		activeTourLeg === 'group' &&
		tourStart &&
		groupTourProgress(tour ?? {}, false) === 'group_nav' &&
		groups?.filter((g) => g.my_membership[0].invite).length === 0 &&
		location.hash === '';
	const listNavHint = activeTourLeg === 'list' && tourStart && listTourProgress(tour ?? {}) === 'list_tour_start' && location.hash === '';
	const shoppingNavHint = activeTourLeg === 'shopping' && tourStart && shoppingTourProgress(tour ?? {}) === 'shopping_nav' && location.hash === '';

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
			navigate(profile?.home ?? '' + location.hash);
		}
	}, [location.pathname, location.hash, profile, navigate]);

	const [drawerOpen, setDrawerOpen] = React.useState(true);
	const [groupsOpen, setGroupsOpen] = React.useState(true);
	const [listsOpen, setListsOpen] = React.useState(true);

	const toggleDrawer = () => {
		setDrawerOpen(!drawerOpen);
	};

	const pinnedLists = lists ? [...lists.filter((l) => l.id === DEFAULT_LIST_ID), ...lists.filter((l) => l.id !== DEFAULT_LIST_ID)].filter((l) => l.pinned === true) : [];
	const pinnedGroups = groups?.filter((g) => g.my_membership[0].pinned === true) ?? [];

	const itemsSelected = location.pathname === '/' || location.pathname === '/items';
	const listsSelected =
		location.pathname.startsWith('/lists') &&
		!lists
			?.filter((l) => l.pinned === true)
			.map((l) => l.id)
			.includes(location.pathname?.split('/lists/')?.[1]?.split('/')?.[0]);
	const groupsSelected =
		location.pathname.startsWith('/groups') &&
		!groups
			?.filter((g) => g.my_membership[0].pinned === true)
			.map((g) => g.id)
			.includes(location.pathname?.split('/groups/')?.[1]?.split('/')?.[0]);

	const mobileNavValue = (() => {
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
	})();

	return (
		<div className='min-h-dvh'>
			{(new Date().getMonth() === 10 || new Date().getMonth() === 11 || new Date().getMonth() === 0) && profile?.enable_snowfall && (
				<div style={{ position: 'fixed', top: 0, left: 0, height: '100%', width: '100%', zIndex: 5000, pointerEvents: 'none' }}>
					<Snowfall snowflakeCount={window.innerWidth * 0.035} />
				</div>
			)}

			{/* ------------------------------- Header ------------------------------- */}
			<header className='fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-sidebar px-3'>
				<button
					type='button'
					aria-label='open drawer'
					onClick={toggleDrawer}
					className='hidden size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 md:flex'
				>
					<Menu className='size-5' />
				</button>

				<Link to={profile?.home ?? '/'} className='flex items-center gap-2 rounded-lg px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50'>
					<GiftIcon className='size-6 text-primary' />
					<span className='text-lg font-semibold tracking-tight'>Giftamizer</span>
				</Link>

				{window.location.host !== 'giftamizer.com' && (
					<Chip variant='festive' size='sm' className='font-semibold uppercase'>
						Dev
					</Chip>
				)}

				<div className='flex-1' />

				<div className='flex items-center gap-1.5'>
					{profile?.roles?.roles.includes(UserRoles.debug) && (
						<SimpleTooltip title='Get Realtime Channels'>
							<button
								type='button'
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
												<button type='button' aria-label='close' className='cursor-pointer rounded-md p-1 hover:bg-accent' onClick={() => closeSnackbar(snackbarId)}>
													<X className='size-4' />
												</button>
											</React.Fragment>
										),
									});
									console.log(channels);
								}}
								className='flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
							>
								<Podcast className='size-5' />
							</button>
						</SimpleTooltip>
					)}

					<Notifications />

					<DropdownMenu>
						<DropdownMenuTrigger asChild disabled={isLoading}>
							<button type='button' className='profile-icon flex cursor-pointer items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50'>
								{isLoading ? <Spinner size={28} /> : <UserAvatar src={profile?.image || '/defaultAvatar.png'} alt={profile?.first_name} className='size-9' />}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' sideOffset={8} className='w-64'>
							<DropdownMenuLabel className='text-xs font-normal text-muted-foreground'>Theme</DropdownMenuLabel>
							<ThemeToggleRow />
							<DropdownMenuSeparator />

							<DropdownMenuItem asChild className='md:hidden'>
								<Link to='/account'>
									<Settings />
									User Settings
								</Link>
							</DropdownMenuItem>

							{profile?.enable_archive && (
								<DropdownMenuItem asChild className='md:hidden'>
									<Link to='/archive'>
										<Archive />
										Archive
									</Link>
								</DropdownMenuItem>
							)}
							{profile?.enable_trash && (
								<DropdownMenuItem asChild className='md:hidden'>
									<Link to='/trash'>
										<Trash2 />
										Trash
									</Link>
								</DropdownMenuItem>
							)}

							<DropdownMenuItem
								onClick={() => {
									client.auth.signOut();
									navigate('/signin');
								}}
							>
								<LogOut />
								Logout
							</DropdownMenuItem>

							{supportConfigured && (
								<>
									<DropdownMenuSeparator className='md:hidden' />
									<DropdownMenuItem asChild className='md:hidden'>
										<Link to='/support'>
											<CircleHelp />
											Support
										</Link>
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			{/* ------------------------------- Sidebar ------------------------------ */}
			<aside
				className={cn(
					'fixed top-14 bottom-0 left-0 z-30 hidden flex-col overflow-x-hidden border-r border-sidebar-border bg-sidebar pt-2 whitespace-nowrap transition-[width] duration-200 ease-in-out md:flex',
					drawerOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED
				)}
			>
				<nav className='flex flex-col gap-0.5 px-2'>
					<Link to='/items' className={navRowClasses(itemsSelected, drawerOpen)}>
						<GiftIcon />
						{drawerOpen && <span className='truncate'>Items</span>}
					</Link>

					{profile?.enable_lists && lists && (
						<>
							<div className='flex items-center'>
								<TourHint title={tourListNav()} placement='right-start' open={isDesktop && listNavHint}>
									<Link
										to='/lists'
										className={cn(navRowClasses(!!listsSelected, drawerOpen), 'min-w-0 flex-1')}
										onClick={() => {
											if (!tour?.list_nav) {
												updateTour.mutateAsync({
													list_nav: true,
												});
											}
										}}
									>
										<ClipboardList />
										{drawerOpen && <span className='truncate'>Lists</span>}
									</Link>
								</TourHint>
								{drawerOpen && pinnedLists.length > 0 && (
									<button
										type='button'
										onClick={(e) => {
											e.preventDefault();
											setListsOpen(!listsOpen);
										}}
										className='flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
									>
										{listsOpen ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
									</button>
								)}
							</div>
							<Collapse in={listsOpen && drawerOpen} unmountOnExit>
								<div className='flex flex-col gap-0.5 py-0.5'>
									<TransitionGroup component={null}>
										{pinnedLists.map((list) => (
											<Collapse key={list.id}>{renderListItem({ list, location })}</Collapse>
										))}
									</TransitionGroup>
								</div>
							</Collapse>
						</>
					)}

					<div className='flex items-center'>
						<TourHint title={tourGroupNav()} placement='right-start' open={isDesktop && groupNavHint}>
							<Link
								to='/groups'
								className={cn(navRowClasses(!!groupsSelected, drawerOpen), 'min-w-0 flex-1')}
								onClick={() => {
									if (!tour?.group_nav) {
										updateTour.mutateAsync({
											group_nav: true,
										});
									}
								}}
							>
								<Users />
								{drawerOpen && <span className='truncate'>Groups</span>}
							</Link>
						</TourHint>
						{drawerOpen && pinnedGroups.length > 0 && (
							<button
								type='button'
								onClick={(e) => {
									e.preventDefault();
									setGroupsOpen(!groupsOpen);
								}}
								className='flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
							>
								{groupsOpen ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
							</button>
						)}
					</div>
					<Collapse in={groupsOpen && drawerOpen} unmountOnExit>
						<div className='flex flex-col gap-0.5 py-0.5'>
							<TransitionGroup component={null}>
								{pinnedGroups.map((group) => (
									<Collapse key={group.id}>{renderGroupItem({ group, location })}</Collapse>
								))}
							</TransitionGroup>
						</div>
					</Collapse>
				</nav>

				<Separator className='my-2' />

				<nav className='flex flex-col gap-0.5 px-2'>
					<TourHint title={tourShoppingNav()} placement='right-start' open={isDesktop && shoppingNavHint}>
						<Link
							to='/shopping'
							className={navRowClasses(location.pathname === '/shopping', drawerOpen)}
							onClick={() => {
								if (!tour?.shopping_nav) {
									updateTour.mutateAsync({
										shopping_nav: true,
									});
								}
							}}
						>
							<ShoppingCart />
							{drawerOpen && <span className='truncate'>Shopping List</span>}
						</Link>
					</TourHint>
				</nav>

				{(profile?.enable_archive || profile?.enable_trash) && (
					<>
						<Separator className='my-2' />
						<nav className='flex flex-col gap-0.5 px-2'>
							{profile?.enable_archive && (
								<Link to='/archive' className={navRowClasses(location.pathname === '/archive', drawerOpen)}>
									<Archive />
									{drawerOpen && <span className='truncate'>Archive</span>}
								</Link>
							)}
							{profile?.enable_trash && (
								<Link to='/trash' className={navRowClasses(location.pathname === '/trash', drawerOpen)}>
									<Trash2 />
									{drawerOpen && <span className='truncate'>Trash</span>}
								</Link>
							)}
						</nav>
					</>
				)}

				<div className='mt-auto flex flex-col pb-2'>
					{supportConfigured && (
						<>
							<nav className='flex flex-col gap-0.5 px-2'>
								<Link to='/support' className={navRowClasses(location.pathname === '/support', drawerOpen)}>
									<CircleHelp />
									{drawerOpen && <span className='truncate'>Support</span>}
								</Link>
							</nav>
							<Separator className='my-2' />
						</>
					)}
					<nav className='flex flex-col gap-0.5 px-2'>
						<Link to='/account' className={navRowClasses(location.pathname === '/account', drawerOpen)}>
							<Settings />
							{drawerOpen && <span className='truncate'>Settings</span>}
						</Link>
					</nav>
				</div>
			</aside>

			{/* -------------------------------- Main -------------------------------- */}
			<main className={cn('pt-14 pb-20 transition-[padding] duration-200 ease-in-out md:pb-8', drawerOpen ? MAIN_OPEN : MAIN_CLOSED)}>{children}</main>

			{/* ---------------------------- Mobile bottom nav ---------------------------- */}
			<nav className='fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-sidebar md:hidden'>
				<button
					type='button'
					onClick={() => navigate('/items')}
					className={cn(
						'flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors [&_svg]:size-5',
						mobileNavValue === 0 ? 'text-primary' : 'text-muted-foreground'
					)}
				>
					<GiftIcon />
					Items
				</button>

				{profile?.enable_lists && (
					<TourHint title={tourListNav()} placement='top' open={!isDesktop && listNavHint}>
						<button
							type='button'
							onClick={() => {
								if (!tour?.list_nav) {
									updateTour.mutateAsync({
										list_nav: true,
									});
								}
								navigate('/lists');
							}}
							className={cn(
								'flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors [&_svg]:size-5',
								mobileNavValue === 1 ? 'text-primary' : 'text-muted-foreground'
							)}
						>
							<ClipboardList />
							Lists
						</button>
					</TourHint>
				)}

				<TourHint title={tourGroupNav()} placement='top' open={!isDesktop && groupNavHint}>
					<button
						type='button'
						onClick={() => {
							if (!tour?.group_nav) {
								updateTour.mutateAsync({
									group_nav: true,
								});
							}
							navigate('/groups');
						}}
						className={cn(
							'flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors [&_svg]:size-5',
							mobileNavValue === 2 ? 'text-primary' : 'text-muted-foreground'
						)}
					>
						<Users />
						Groups
					</button>
				</TourHint>

				<TourHint title={tourShoppingNav()} placement='top' open={!isDesktop && shoppingNavHint}>
					<button
						type='button'
						onClick={() => {
							if (!tour?.shopping_nav) {
								updateTour.mutateAsync({
									shopping_nav: true,
								});
							}
							navigate('/shopping');
						}}
						className={cn(
							'flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors [&_svg]:size-5',
							mobileNavValue === 3 ? 'text-primary' : 'text-muted-foreground'
						)}
					>
						<ShoppingCart />
						Shopping
					</button>
				</TourHint>
			</nav>
		</div>
	);
};

export default Navigation;
