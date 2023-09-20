import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useSnackbar } from 'notistack';

import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	useMediaQuery,
	useTheme,
	Avatar,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Divider,
	IconButton,
	Stack,
	Typography,
	CircularProgress,
} from '@mui/material';
import { Check, Clear } from '@mui/icons-material';

import { SUPABASE_URL, useGetGroups, useAcceptGroupInvite, useDeclineGroupInvite } from '../lib/useSupabase';
import { GroupType } from '../lib/useSupabase/types';

export type InvitesDialogRefs = {
	handleClickOpen: () => void;
};

const AlertDialog: React.ForwardRefRenderFunction<InvitesDialogRefs> = (props, forwardedRef) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();

	const { data: groups } = useGetGroups();

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
				navigate(`/groups/${group.id}`);
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
		<>
			<Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Group Invitations</DialogTitle>
				<DialogContent>
					<List>
						{groups
							?.filter((g) => g.my_membership[0].invite)
							.map((group, i) => (
								<React.Fragment key={i}>
									<ListItem
										key={group.id}
										secondaryAction={
											<Stack direction='row' spacing={2}>
												<IconButton color='error' onClick={() => handleDecline(group.id)} disabled={acceptGroupInvite.isLoading || declineGroupInvite.isLoading}>
													{declineGroupInvite.isLoading ? <CircularProgress size={20} color='error' /> : <Clear />}
												</IconButton>
												<IconButton color='primary' onClick={() => handleAccept(group)} disabled={acceptGroupInvite.isLoading || declineGroupInvite.isLoading}>
													{acceptGroupInvite.isLoading ? <CircularProgress size={20} color='primary' /> : <Check />}
												</IconButton>
											</Stack>
										}
									>
										<ListItemAvatar>
											<Avatar sx={{ bgcolor: 'primary.main' }} src={`${SUPABASE_URL}/storage/v1/object/public/groups/${group.id}?${group.image_token}`}>
												{Array.from(String(group.name).toUpperCase())[0]}
											</Avatar>
										</ListItemAvatar>
										<ListItemText primary={group.name} secondary={moment(group.my_membership[0].created_at).fromNow()} />
									</ListItem>
									{i !== (groups?.filter((g) => g.my_membership[0].invite).length || 0) - 1 && <Divider />}
								</React.Fragment>
							))}

						{groups?.filter((g) => g.my_membership[0].invite).length === 0 && (
							<Typography variant='h6' gutterBottom sx={{ mt: 4, textAlign: 'center' }}>
								No Group Invitations
							</Typography>
						)}
					</List>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} color='inherit'>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default React.forwardRef(AlertDialog);
