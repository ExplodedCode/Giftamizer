import * as React from 'react';

import { useSupabase, SUPABASE_URL } from '../lib/useSupabase';
import { GroupType } from '../lib/useSupabase/types';

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
import moment from 'moment';

type InvitesDialogProps = {
	groups: GroupType[];
};

export type InvitesDialogRefs = {
	handleClickOpen: () => void;
};

const AlertDialog: React.ForwardRefRenderFunction<InvitesDialogRefs, InvitesDialogProps> = (props, forwardedRef) => {
	const theme = useTheme();

	const { user, client } = useSupabase();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState<string[]>([]);

	React.useImperativeHandle(forwardedRef, () => ({
		handleClickOpen,
	}));

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const handleAccept = async (group_id: string) => {
		setLoading([...loading, group_id]);

		const { error } = await client.from('group_members').update({ invite: false }).eq('group_id', group_id).eq('user_id', user.id);
		if (error) console.log(error);

		setLoading([...loading.splice(loading.indexOf(group_id), 1)]);
	};

	const handleDecline = async (group_id: string) => {
		setLoading([...loading, group_id]);

		const { error } = await client.from('group_members').delete().eq('group_id', group_id).eq('user_id', user.id);
		if (error) console.log(error);

		setLoading([...loading.splice(loading.indexOf(group_id), 1)]);
	};

	return (
		<>
			<Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Group Invitations</DialogTitle>
				<DialogContent>
					<List>
						{props.groups
							.filter((g) => g.my_membership[0].invite)
							.map((group, i) => (
								<>
									<ListItem
										key={group.id}
										secondaryAction={
											<Stack direction='row' spacing={2}>
												<IconButton color='error' onClick={() => handleDecline(group.id)} disabled={loading.includes(group.id)}>
													{loading.includes(group.id) ? <CircularProgress size={20} /> : <Clear />}
												</IconButton>
												<IconButton color='primary' onClick={() => handleAccept(group.id)} disabled={loading.includes(group.id)}>
													{loading.includes(group.id) ? <CircularProgress size={20} /> : <Check />}
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
									{i !== props.groups.filter((g) => g.my_membership[0].invite).length - 1 && <Divider />}
								</>
							))}

						{props.groups.filter((g) => g.my_membership[0].invite).length === 0 && (
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
