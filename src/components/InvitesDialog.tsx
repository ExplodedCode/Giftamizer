import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useSnackbar } from '../lib/snackbar';

import { Check, X } from 'lucide-react';

import { useGetGroups, useAcceptGroupInvite, useDeclineGroupInvite, useGetTour } from '../lib/useSupabase';
import { GroupType } from '../lib/useSupabase/types';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Spinner } from './ui/spinner';
import { UserAvatar } from './ui/avatar';

export type InvitesDialogRefs = {
	handleClickOpen: () => void;
};

const InvitesDialog: React.ForwardRefRenderFunction<InvitesDialogRefs> = (props, forwardedRef) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();

	const { data: groups } = useGetGroups();

	//
	// user tour
	const { data: tour } = useGetTour();

	const open = location.hash === '#group-invitations';

	React.useImperativeHandle(forwardedRef, () => ({
		handleClickOpen,
	}));

	const handleClickOpen = () => {
		navigate('#group-invitations'); // open dialog
	};

	const handleClose = () => {
		navigate('#'); // close dialog
	};

	const acceptGroupInvite = useAcceptGroupInvite();
	const handleAccept = async (group: GroupType) => {
		acceptGroupInvite
			.mutateAsync(group)
			.then(() => {
				handleClose();
				if (tour?.group_nav) {
					navigate(`/groups/${group.id}`);
				}
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to accept group invite! ${err.message}`, { variant: 'error' });
			});
	};

	const declineGroupInvite = useDeclineGroupInvite();
	const handleDecline = async (group_id: string) => {
		declineGroupInvite.mutateAsync(group_id).catch((err) => {
			enqueueSnackbar(`Unable to reject group invite! ${err.message}`, { variant: 'error' });
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) handleClose();
			}}
		>
			<DialogContent fullScreenOnMobile>
				<DialogHeader>
					<DialogTitle>Group Invitations</DialogTitle>
				</DialogHeader>

				<div className='flex flex-col'>
					{groups
						?.filter((g) => g.my_membership[0].invite)
						.map((group, i) => (
							<React.Fragment key={group.id}>
								<div className='flex items-center gap-3 py-2.5'>
									<UserAvatar src={group.image} alt={group.name} fallback={Array.from(String(group.name).toUpperCase())[0]} />

									<div className='min-w-0 flex-1'>
										<p className='truncate text-sm font-medium'>{group.name}</p>
										<p className='text-sm text-muted-foreground'>{moment(group.my_membership[0].created_at).fromNow()}</p>
									</div>

									<div className='flex shrink-0 items-center gap-2'>
										<button
											type='button'
											aria-label='decline'
											onClick={() => handleDecline(group.id)}
											disabled={acceptGroupInvite.isLoading || declineGroupInvite.isLoading}
											className='flex size-9 cursor-pointer items-center justify-center rounded-lg text-destructive transition-colors outline-none hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50'
										>
											{declineGroupInvite.isLoading ? <Spinner size={18} className='text-destructive' /> : <X className='size-5' />}
										</button>
										<button
											type='button'
											aria-label='accept'
											onClick={() => handleAccept(group)}
											disabled={acceptGroupInvite.isLoading || declineGroupInvite.isLoading}
											className='flex size-9 cursor-pointer items-center justify-center rounded-lg text-primary transition-colors outline-none hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50'
										>
											{acceptGroupInvite.isLoading ? <Spinner size={18} /> : <Check className='size-5' />}
										</button>
									</div>
								</div>
								{i !== (groups?.filter((g) => g.my_membership[0].invite).length || 0) - 1 && <div className='h-px bg-border' />}
							</React.Fragment>
						))}

					{groups?.filter((g) => g.my_membership[0].invite).length === 0 && <p className='py-8 text-center text-muted-foreground'>No Group Invitations</p>}
				</div>

				<DialogFooter>
					<Button variant='ghost' onClick={handleClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default React.forwardRef(InvitesDialog);
