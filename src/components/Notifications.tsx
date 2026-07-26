import * as React from 'react';
import { SnackbarKey, useSnackbar } from '../lib/snackbar';
import moment from 'moment';

import { groupInviteTourProgress, itemTourProgress, useGetGroups, useGetTour, useSupabase, useUpdateTour } from '../lib/useSupabase';
import { NotificationType } from '../lib/useSupabase/types';

import { TransitionGroup } from 'react-transition-group';
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';

import InvitesDialog, { InvitesDialogRefs } from './InvitesDialog';
import TourTooltip, { TourContent } from './TourTooltip';
import { GiftIcon } from './SvgIcons';

import { NotificationIcon } from './ui/icon-map';
import { NotificationBadge } from './ui/notification-badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { TourHint } from './ui/tour-hint';
import { Collapse } from './ui/collapse';
import { Button } from './ui/button';

interface RenderItemOptions {
	notification: NotificationType;
	invitesDialogRef: React.RefObject<InvitesDialogRefs | null>;
	dismissNotification: (id: string) => void;
	handleClose: () => void;
	navigate: NavigateFunction;
}
function renderItem({ notification, invitesDialogRef, dismissNotification, handleClose, navigate }: RenderItemOptions) {
	return (
		<div className='group relative flex items-start'>
			<button
				type='button'
				className='flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50'
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
				<span className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground [&_svg]:size-5'>
					{(() => {
						switch (notification.icon) {
							default:
								return <NotificationIcon icon={notification.icon} />;
							case 'gift':
								return <GiftIcon />;
						}
					})()}
				</span>
				<span className='flex min-w-0 flex-col pr-8'>
					<span className='text-sm font-medium'>
						{notification.title}
						<span className='ml-1 text-muted-foreground'>— {moment(notification.created_at).fromNow()}</span>
					</span>
					{notification.body && <span className='text-sm text-muted-foreground'>{notification.body}</span>}
				</span>
			</button>
			<button
				type='button'
				aria-label='delete'
				onClick={() => dismissNotification(notification.id)}
				className='absolute top-2.5 right-2.5 cursor-pointer rounded-md p-1 text-muted-foreground opacity-60 transition-opacity outline-none hover:bg-accent hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50'
			>
				<X className='size-4' />
			</button>
		</div>
	);
}

export default function Notifications() {
	const location = useLocation();
	const navigate = useNavigate();

	const { client, user } = useSupabase();
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	const { data: groups, isLoading: groupsLoading } = useGetGroups();

	const notificationBtnRef = React.useRef<HTMLButtonElement>(null); // invite dialog ref
	const invitesDialogRef = React.useRef<InvitesDialogRefs | null>(null); // invite dialog ref

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
								variant='secondary'
								size='sm'
								onClick={() => {
									notificationBtnRef.current?.click();
									closeSnackbar(snackbarId);
								}}
							>
								View
							</Button>
							<button type='button' aria-label='close' className='cursor-pointer rounded-md p-1 opacity-70 hover:opacity-100' onClick={() => closeSnackbar(snackbarId)}>
								<X className='size-4' />
							</button>
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

	const handleOpen = async () => {
		if (!tour?.group_invite_nav) {
			updateTour.mutateAsync({
				group_invite_nav: true,
			});
		}

		setOpen(true);

		notifications?.forEach(async (notification) => {
			const { error } = await client.from('notifications').update({ seen: true }).eq('id', notification.id).eq('user_id', user.id);

			if (error) console.log(error);
		});
	};

	const handleClose = () => {
		setOpen(false);

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

	const inviteCount = groups?.filter((g) => g.my_membership[0].invite)?.length || 0;
	const badgeCount = (notifications?.filter((n) => !n.seen).length || 0) + inviteCount;

	return (
		<>
			<Popover open={open} onOpenChange={(next) => (next ? handleOpen() : handleClose())}>
				<PopoverTrigger asChild>
					<button
						type='button'
						{...({ 'tour-element': 'group_invite_nav' } as object)}
						ref={notificationBtnRef}
						className='flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
					>
						<NotificationBadge count={badgeCount}>
							<Bell className='size-5' />
						</NotificationBadge>
					</button>
				</PopoverTrigger>

				<PopoverContent align='end' sideOffset={8} className='w-[90vw] p-0 sm:w-[450px]'>
					<div className='flex items-center justify-between border-b border-border px-3 py-2'>
						<p className='text-sm font-semibold'>Notifications</p>
						<NotificationBadge count={inviteCount}>
							<TourHint title='Open Group Invites' placement='bottom-end' open={groupInviteTourProgress(tour ?? {}) === 'group_invite_button' && open}>
								<Button
									variant='outline'
									size='sm'
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
							</TourHint>
						</NotificationBadge>
					</div>

					<div className='max-h-[40vh] overflow-y-auto p-1'>
						<TransitionGroup component={null}>
							{notifications?.map((notification) => (
								<Collapse key={notification.id}>{renderItem({ notification, invitesDialogRef, dismissNotification, handleClose, navigate })}</Collapse>
							))}
						</TransitionGroup>
						{notifications?.length === 0 ? (
							<p className='py-6 text-center text-sm text-muted-foreground'>No notifications</p>
						) : (
							<div className='flex justify-end p-2'>
								<Button variant='outline' size='sm' onClick={dismissAllNotifications}>
									Clear All
								</Button>
							</div>
						)}
					</div>
				</PopoverContent>
			</Popover>

			<InvitesDialog ref={invitesDialogRef} />

			{!groupsLoading && tour && itemTourProgress(tour) === null && location.hash === '' && groups?.filter((g) => g.my_membership[0].invite).length !== 0 && (
				<>
					<TourTooltip
						open={groupInviteTourProgress(tour) === 'group_invite_nav'}
						anchorEl={document.querySelector('[tour-element="group_invite_nav"]')}
						placement='bottom'
						content={<TourContent title="You've been invited to a group!">Accept or decline group invites in the notification menu.</TourContent>}
						mask
						allowClick
					/>
				</>
			)}
		</>
	);
}
