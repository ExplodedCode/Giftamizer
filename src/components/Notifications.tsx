import * as React from 'react';
import { SnackbarKey, useSnackbar } from 'notistack';
import moment from 'moment';

import { groupInviteTourProgress, itemTourProgress, useGetGroups, useGetTour, useSupabase, useUpdateTour } from '../lib/useSupabase';
import { NotificationType } from '../lib/useSupabase/types';

import { TransitionGroup } from 'react-transition-group';
import {
	IconButton,
	Badge,
	Popover,
	List,
	ListItemButton,
	ListItemAvatar,
	Avatar,
	ListItemText,
	Typography,
	Button,
	Stack,
	ListItem,
	Collapse,
	AppBar,
	Toolbar,
	styled,
	BadgeProps,
	DialogContent,
	DialogTitle,
	useTheme,
} from '@mui/material';
import { Close, Notifications as NotificationsIcon } from '@mui/icons-material';
import * as muiIcons from '@mui/icons-material';

import InvitesDialog, { InvitesDialogRefs } from './InvitesDialog';
import TourTooltip from './TourTooltip';
import HtmlTooltip from './HtmlTooltip';
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom';
import { GiftIcon } from './SvgIcons';

type IconLookupProps = {
	icon: string | undefined | null;
};
function IconLookup(props: IconLookupProps) {
	try {
		const Icon = {
			// @ts-ignore
			icon: muiIcons?.[props?.icon],
		};
		if (Icon && Icon.icon) {
			// eslint-disable-next-line react/jsx-pascal-case
			return <Icon.icon />;
		} else {
			return <NotificationsIcon />;
		}
	} catch (error) {
		console.log(error);
		return <NotificationsIcon />;
	}
}

interface RenderItemOptions {
	notification: NotificationType;
	invitesDialogRef: React.RefObject<InvitesDialogRefs>;
	dismissNotification: (id: string) => void;
	handleClose: () => void;
	navigate: NavigateFunction;
}
function renderItem({ notification, invitesDialogRef, dismissNotification, handleClose, navigate }: RenderItemOptions) {
	return (
		<ListItem
			key={notification.id}
			secondaryAction={
				<>
					<IconButton edge='end' aria-label='delete' onClick={() => dismissNotification(notification.id)}>
						<Close />
					</IconButton>
				</>
			}
			disablePadding
		>
			<ListItemButton
				onClick={() => {
					if (notification.action === 'openInvite') {
						invitesDialogRef.current?.handleClickOpen();
					}

					if (notification.action?.startsWith('openGroup_')) {
						navigate('/groups/' + notification.action!.split('_')[1]);
					}

					dismissNotification(notification.id);
					handleClose();
				}}
			>
				<ListItemAvatar>
					<Avatar sx={{ bgcolor: 'primary.main' }}>
						{(() => {
							switch (notification.icon) {
								default:
									return <IconLookup icon={notification.icon} />;
								case 'gift':
									return <GiftIcon />;
							}
						})()}
					</Avatar>
				</ListItemAvatar>
				<ListItemText
					primary={
						<>
							{notification.title}

							<Typography sx={{ display: 'inline-block', ml: 1 }} color='GrayText'>
								{' — '}
								{moment(notification.created_at).fromNow()}
							</Typography>
						</>
					}
					secondary={notification.body}
				/>
			</ListItemButton>
		</ListItem>
	);
}

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
	'& .MuiBadge-badge': {
		top: 2,
		left: 2,
		padding: '0 4px',
	},
}));

export default function Notifications() {
	const theme = useTheme();
	const location = useLocation();
	const navigate = useNavigate();

	const { client, user } = useSupabase();
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	const { data: groups, isLoading: groupsLoading } = useGetGroups();

	const notificationBtnRef = React.useRef<HTMLButtonElement>(null); // invite dialog ref
	const invitesDialogRef = React.useRef<React.ElementRef<typeof InvitesDialog>>(null); // invite dialog ref

	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
	const [open, setOpen] = React.useState(false);

	const [notifications, setNotifications] = React.useState<NotificationType[] | undefined>(undefined);

	//
	// user tour
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();

	React.useEffect(() => {
		const getNotifications = async () => {
			const { data, error } = await client.from('notifications').select(`*`).eq('user_id', user.id).order('created_at', { ascending: false });

			if (error) console.log(error);

			setNotifications(data! as NotificationType[]);
		};

		client
			.channel(`public:notifications:user_id=eq.${user.id}`)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
				if (payload.eventType === 'INSERT') {
					const action = (snackbarId: SnackbarKey | undefined) => (
						<React.Fragment>
							<Button
								color='secondary'
								size='small'
								onClick={() => {
									notificationBtnRef.current?.click();
									closeSnackbar(snackbarId);
								}}
							>
								View
							</Button>
							<IconButton size='small' aria-label='close' color='inherit' onClick={() => closeSnackbar(snackbarId)}>
								<Close fontSize='small' />
							</IconButton>
						</React.Fragment>
					);

					enqueueSnackbar(payload.new.title, {
						variant: 'default',
						persist: true,
						action: action,
					});
				}

				getNotifications();
			})
			.subscribe();

		getNotifications();
	}, [client, closeSnackbar, enqueueSnackbar, user]);

	const handleOpen = async (event: React.MouseEvent<HTMLButtonElement>) => {
		if (!tour?.group_invite_nav) {
			updateTour.mutateAsync({
				group_invite_nav: true,
			});
		}

		setAnchorEl(event.currentTarget);
		setOpen(!open);

		notifications?.forEach(async (notification) => {
			const { error } = await client.from('notifications').update({ seen: true }).eq('id', notification.id).eq('user_id', user.id);

			if (error) console.log(error);
		});
	};

	const handleClose = () => {
		setAnchorEl(null);
		setOpen(!open);

		if (!tour?.group_invite_button) {
			updateTour.mutateAsync({
				group_invite_nav: false,
			});
		}
	};

	const dismissAllNotifications = async () => {
		const { error } = await client.from('notifications').delete().eq('user_id', user.id);
		if (error) console.log(error);

		handleClose();
	};

	const dismissNotification = async (id: string) => {
		const { error } = await client.from('notifications').delete().eq('id', id);
		if (error) console.log(error);
	};

	return (
		<>
			<IconButton tour-element='group_invite_nav' size='large' ref={notificationBtnRef} color='inherit' onClick={handleOpen}>
				<Badge badgeContent={(notifications?.filter((n) => !n.seen).length || 0) + (groups?.filter((g) => g.my_membership[0].invite)?.length || 0)} color='error'>
					<NotificationsIcon />
				</Badge>
			</IconButton>

			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<List sx={{ bgcolor: 'background.paper', width: { xs: '90vw', sm: 450 }, pt: 0, maxHeight: '40vh' }}>
					<AppBar position='static' sx={{ mb: 1, pt: 0.5, bgcolor: 'background.paper' }}>
						<Toolbar variant='dense'>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<StyledBadge
									badgeContent={groups?.filter((g) => g.my_membership[0].invite).length}
									anchorOrigin={{
										vertical: 'top',
										horizontal: 'left',
									}}
									color='primary'
								>
									<HtmlTooltip
										title={
											<>
												<Typography>Open Group Invites</Typography>
											</>
										}
										arrow
										open={groupInviteTourProgress(tour ?? {}) === 'group_invite_button' && open}
										placement='bottom-end'
									>
										<Button
											variant='outlined'
											size='small'
											color='primary'
											onClick={() => {
												if (!tour?.group_invite_button) {
													updateTour.mutateAsync({
														group_invite_button: true,
													});
												}

												handleClose();
												invitesDialogRef.current?.handleClickOpen();
											}}
										>
											Group Invites
										</Button>
									</HtmlTooltip>
								</StyledBadge>
							</Stack>
						</Toolbar>
					</AppBar>
					<TransitionGroup>
						{notifications?.map((notification) => (
							<Collapse key={notification.id}>{renderItem({ notification, invitesDialogRef, dismissNotification, handleClose, navigate })}</Collapse>
						))}
					</TransitionGroup>
					{notifications?.length === 0 ? (
						<Typography variant='h6' gutterBottom sx={{ mt: 1, textAlign: 'center' }}>
							No notifications
						</Typography>
					) : (
						<Stack direction='row' justifyContent='flex-end' spacing={2} sx={{ mt: 1, mr: 1 }}>
							<Button variant='outlined' size='small' color='primary' onClick={dismissAllNotifications}>
								Clear All
							</Button>
						</Stack>
					)}
				</List>
			</Popover>

			<InvitesDialog ref={invitesDialogRef} />

			{!groupsLoading && tour && itemTourProgress(tour) === null && location.hash === '' && groups?.filter((g) => g.my_membership[0].invite).length !== 0 && (
				<>
					<TourTooltip
						open={groupInviteTourProgress(tour) === 'group_invite_nav'}
						anchorEl={document.querySelector('[tour-element="group_invite_nav"]')}
						placement='bottom'
						content={
							<>
								<DialogTitle>You've been invited to a group!</DialogTitle>
								<DialogContent>
									<Typography>Accept or decline group invites in the notification menu.</Typography>
								</DialogContent>
							</>
						}
						backgroundColor={theme.palette.primary.main}
						color={theme.palette.primary.contrastText}
						mask
						allowClick
					/>
				</>
			)}
		</>
	);
}
