import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { useSupabase, SUPABASE_URL } from '../lib/useSupabase';
import { GroupType, Member } from '../lib/useSupabase/types';
import { TransitionGroup } from 'react-transition-group';

import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';
import {
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	FormControl,
	Grid,
	IconButton,
	List,
	ListItem,
	ListItemAvatar,
	ListItemSecondaryAction,
	ListItemText,
	MenuItem,
	Select,
	Stack,
	TextField,
	Typography,
	useMediaQuery,
} from '@mui/material';

import LoadingButton from '@mui/lab/LoadingButton';

import AvatarEditor from './AvatarEditor';
import UserSearch, { InviteUserType } from './UserSearch';
import { Delete, Save, Send, Settings } from '@mui/icons-material';

export interface MemberEdit extends Member {
	deleted: boolean;
	external: boolean;
}

type GroupAdminSettingsDialogProps = {
	group: GroupType;
	members: Member[];
};

interface RenderItemOptions {
	member: MemberEdit;
	handleMemberEdit: (member: MemberEdit) => void;
}

function renderItem({ member, handleMemberEdit }: RenderItemOptions) {
	return (
		<ListItem>
			<ListItemAvatar>
				<Avatar
					alt={member.profile.name}
					src={
						member.profile.avatar_token && member.profile.avatar_token !== -1
							? `${SUPABASE_URL}/storage/v1/object/public/avatars/${member.user_id}?${member.profile.avatar_token}`
							: '/defaultAvatar.png'
					}
				/>
			</ListItemAvatar>
			<ListItemText
				primary={
					<>
						{member.profile.name}

						{member.invite && (
							<Typography sx={{ display: 'inline-block', ml: 1 }} color='GrayText'>
								{' — '}
								Pending
							</Typography>
						)}
					</>
				}
				secondary={member.profile.email}
			/>
			<ListItemSecondaryAction>
				<FormControl fullWidth>
					<Select
						value={member.owner ? 1 : 0}
						onChange={(e) => {
							if (e.target.value === -1) {
								handleMemberEdit({ ...member, deleted: true });
							} else {
								handleMemberEdit({ ...member, owner: e.target.value === 1 ? true : false });
							}
						}}
						size='small'
					>
						<MenuItem value={0}>Member</MenuItem>
						<MenuItem value={1}>Owner</MenuItem>
						<Divider />
						<MenuItem value={-1}>Remove Access</MenuItem>
					</Select>
				</FormControl>
			</ListItemSecondaryAction>
		</ListItem>
	);
}

export default function GroupSettingsDialog(props: GroupAdminSettingsDialogProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const groupID = location.pathname.split('/groups/')[1];

	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();

	const { client, user, profile } = useSupabase();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	const [name, setName] = React.useState('');
	const [members, setMembers] = React.useState<MemberEdit[]>([]);

	const [selectedInviteUsers, setSelectedInviteUsers] = React.useState<InviteUserType[]>([]);
	const [inviteUsersOwner, setInviteUsersOwner] = React.useState(false);

	const [confirmOpen, setConfirmOpen] = React.useState(false);

	const getExternalInvites = async () => {
		const { data: invites, error } = await client.from('external_invites').select().eq('group_id', groupID);
		if (error) console.log(error);

		let mem = members;
		console.log(mem);

		if (invites) {
			invites.forEach((invite) => {
				mem.push({
					user_id: invite.invite_id,
					owner: invite.owner,
					invite: true,
					profile: {
						email: '',
						name: invite.email,
						bio: '',
						avatar_token: null,
					},
					deleted: false,
					external: true,
				});
			});
		}

		console.log(mem);

		setMembers([...mem]);
	};

	useEffect(() => {
		if (open) getExternalInvites();
	}, [open]);

	const handleInvite = async () => {
		setLoading(true);

		for (const inviteUser of selectedInviteUsers) {
			try {
				if (inviteUser.user_id) {
					const { error } = await client.from('group_members').insert({ group_id: props.group.id, user_id: inviteUser.user_id, owner: inviteUsersOwner });
					if (error) throw new Error(error?.message);
				} else {
					const { error: inviteError } = await client.from('external_invites').insert({ group_id: props.group.id, email: inviteUser.email, owner: inviteUsersOwner });
					if (inviteError) {
						throw new Error(inviteError?.message);
					} else {
						const { error } = await client.functions.invoke('groups/invite', {
							body: {
								group: {
									name: props.group.name,
									id: props.group.id,
								},
								user: inviteUser,
							},
						});
						if (error) throw new Error(error?.message);
					}
				}
			} catch (error) {
				console.log(error);
				enqueueSnackbar(`Unable to invite user. ${JSON.stringify(inviteUser)}`, {
					variant: 'error',
				});
			}
		}

		handleClose();
	};

	const handleSave = async () => {
		setLoading(true);

		const { error: groupError } = await client.from('groups').update({ name: name }).eq('id', groupID).select();
		if (groupError) console.log(groupError);

		const { error: memberError } = await client
			.from('group_members')
			.upsert(
				members
					.filter((m) => !m.deleted && !m.external)
					.map((m) => {
						return {
							group_id: groupID,
							user_id: m.user_id,
							owner: m.owner,
						};
					})
			)
			.select();
		if (memberError) console.log(memberError);

		const { error: inviteError } = await client
			.from('external_invites')
			.upsert(
				members
					.filter((m) => !m.deleted && m.external)
					.map((m) => {
						return {
							group_id: groupID,
							invite_id: m.user_id,
							email: m.profile.name,
							owner: m.owner,
						};
					})
			)
			.select();
		if (inviteError) console.log(inviteError);

		members
			.filter((m) => m.deleted)
			.forEach(async (deletedUser) => {
				if (!deletedUser.external) {
					const { error } = await client.from('group_members').delete().eq('group_id', groupID).eq('user_id', deletedUser.user_id);
					if (error) console.log(error);
				} else {
					const { error } = await client.from('external_invites').delete().eq('group_id', groupID).eq('invite_id', deletedUser.user_id);
					if (error) console.log(error);
				}
			});

		handleClose();
	};

	const handleMemberEdit = (item: MemberEdit) => {
		let mem = members;

		let index = mem.findIndex((m) => m.user_id === item.user_id);

		mem[index] = item;

		console.log(index, item);
		console.log(mem);

		setMembers([...mem]);
	};

	const handleOpen = async () => {
		setName(props.group.name);

		let mem = props.members.map((m) => {
			return { ...m, deleted: false, external: false };
		});
		setMembers(mem);

		setOpen(true);
	};

	const handleClose = async () => {
		setOpen(false);

		setSelectedInviteUsers([]);
		setMembers([]);
		setLoading(false);
	};

	const handleImageTokenUpdate = async (token: number | null) => {
		const { error } = await client.from('groups').update({ image_token: token }).eq('id', groupID).select();
		if (error) console.log(error);
	};

	const handleDeleteOpen = () => {
		setConfirmOpen(true);
	};
	const handleDeleteClose = () => {
		setConfirmOpen(false);
	};
	const handleDelete = async () => {
		const { error } = await client.from('groups').delete().eq('id', groupID);
		if (error) {
			console.log(error);
		} else {
			navigate('/groups');
			handleClose();
		}
	};

	const changed = name !== props.group.name || members !== props.members;

	return (
		<>
			<Button variant='outlined' color='primary' size='small' sx={{ display: { xs: 'none', sm: 'flex' } }} onClick={handleOpen}>
				Manage
			</Button>
			<IconButton sx={{ display: { xs: 'flex', sm: 'none' } }} onClick={handleOpen}>
				<Settings />
			</IconButton>

			<Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Group Settings</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>TODO: describe what groups do...</DialogContentText>

							<Grid container spacing={2}>
								<Grid item xs={12}>
									<AvatarEditor bucket='groups' filepath={props.group.id} imageToken={props.group.image_token} handleTokenUpdate={handleImageTokenUpdate} />
								</Grid>
								<Grid item xs={12}>
									<TextField label='Group Name' variant='outlined' fullWidth value={name} onChange={(e) => setName(e.target.value)} />
								</Grid>

								<Grid item xs>
									<UserSearch selectedInviteUsers={selectedInviteUsers} setSelectedInviteUsers={setSelectedInviteUsers} members={props.members} />
								</Grid>
								<Grid item>
									<FormControl fullWidth>
										<Select value={inviteUsersOwner ? 1 : 0} onChange={(e) => setInviteUsersOwner(e.target.value === 1 ? true : false)}>
											<MenuItem value={0}>Member</MenuItem>
											<MenuItem value={1}>Owner</MenuItem>
										</Select>
									</FormControl>
								</Grid>

								{selectedInviteUsers.length === 0 && (
									<Grid item xs={12}>
										<Typography variant='h6' gutterBottom>
											People with access
										</Typography>

										<List sx={{ width: '100%' }} dense>
											<ListItem>
												<ListItemAvatar>
													<Avatar
														alt={profile.name}
														src={
															profile.avatar_token && profile.avatar_token !== -1
																? `${SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}?${profile.avatar_token}`
																: '/defaultAvatar.png'
														}
													/>
												</ListItemAvatar>
												<ListItemText primary={profile.name} secondary={profile.email} />
												<ListItemSecondaryAction>{/* <PermissionMenu member={{ owner: true } as MemberEdit} disabled /> */}</ListItemSecondaryAction>
											</ListItem>

											<TransitionGroup>
												{members
													.filter((m) => m?.deleted !== true)
													.map((member) => (
														<Collapse key={member.user_id}>{renderItem({ member, handleMemberEdit })}</Collapse>
													))}
											</TransitionGroup>
										</List>
									</Grid>
								)}
							</Grid>
						</Grid>

						<Grid item xs={12}>
							<Grid container spacing={2}>
								<Grid item xs>
									<LoadingButton onClick={handleDeleteOpen} endIcon={<Delete />} loading={loading} loadingPosition='end' variant='contained' color='error'>
										Delete
									</LoadingButton>
								</Grid>
								<Grid item>
									<Stack direction='row' justifyContent='flex-end' spacing={2}>
										<Button color='inherit' onClick={handleClose}>
											Cancel
										</Button>
										{selectedInviteUsers.length === 0 ? (
											<LoadingButton onClick={handleSave} endIcon={<Save />} loading={loading} loadingPosition='end' variant='contained' disabled={!changed}>
												Save
											</LoadingButton>
										) : (
											<LoadingButton onClick={handleInvite} endIcon={<Send />} loading={loading} loadingPosition='end' variant='contained'>
												Invite
											</LoadingButton>
										)}
									</Stack>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>

			<Dialog open={confirmOpen} onClose={handleDeleteClose}>
				<DialogTitle>Delete {props.group.name} Group?</DialogTitle>
				<DialogContent>
					<DialogContentText>Are you sure you want to delete this group? All members will be removed</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleDeleteClose}>
						Cancel
					</Button>
					<Button onClick={handleDelete} variant='contained' color='error'>
						Yes, Delete it
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
