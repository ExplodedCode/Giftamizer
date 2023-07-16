import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { useQueryClient } from '@tanstack/react-query';
import { useSupabase, SUPABASE_URL, useDeleteGroup, useGetGroupMembers, GROUPS_QUERY_KEY, useUpdateGroup, useInviteToGroup, useGetProfile, useLeaveGroup } from '../lib/useSupabase';
import { GroupType, Member, Profile } from '../lib/useSupabase/types';
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
import { Delete, DeleteForever, Logout, Save, Send, Settings } from '@mui/icons-material';

import AvatarEditor from './AvatarEditor';
import UserSearch from './UserSearch';

interface RenderItemOptionsProps {
	member: Member;
	handleMemberEdit: (member: Member) => void;
	owner: boolean;
}

function renderItem({ member, handleMemberEdit, owner }: RenderItemOptionsProps) {
	// console.log(member);

	return (
		<ListItem>
			<ListItemAvatar>
				<Avatar
					alt={`${member.profile.first_name} ${member.profile.last_name} `}
					src={
						member.profile.avatar_token && member.profile.avatar_token !== -1
							? `${SUPABASE_URL}/storage/v1/object/public/avatars/${member.user_id}?${member.profile.avatar_token}`
							: member.external
							? '/email.png'
							: '/defaultAvatar.png'
					}
				/>
			</ListItemAvatar>
			<ListItemText
				primary={
					<>
						{member.external ? member.profile.email : `${member.profile.first_name} ${member.profile.last_name} `}

						{member.invite && (
							<Typography sx={{ display: 'inline-block', ml: 1 }} color='GrayText'>
								{' — '}
								Pending
							</Typography>
						)}
					</>
				}
				secondary={!member.external && member.profile.email}
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
						disabled={!owner}
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

type GroupSettingsDialogProps = {
	group: GroupType;
	owner: boolean;
};
export default function GroupSettingsDialog({ group, owner }: GroupSettingsDialogProps) {
	const { group: groupID } = useParams();

	const theme = useTheme();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();

	const { client, user } = useSupabase();
	const { data: profile } = useGetProfile();

	const queryClient = useQueryClient();
	const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useGetGroupMembers(groupID!);

	const [open, setOpen] = React.useState(false);
	const [name, setName] = React.useState('');

	const [selectedInviteUsers, setSelectedInviteUsers] = React.useState<Profile[]>([]);
	const [inviteUsersOwner, setInviteUsersOwner] = React.useState(false);

	const [confirmLeaveOpen, setConfirmLeaveOpen] = React.useState(false);
	const [confirmOpen, setConfirmOpen] = React.useState(false);

	const [stateUpdater, setStateUpdater] = React.useState('');

	const inviteToGroup = useInviteToGroup();
	const handleInvite = async () => {
		const mem = queryClient.getQueryData<Member[]>([...GROUPS_QUERY_KEY, groupID, 'members']);
		inviteToGroup
			.mutateAsync({ group: { ...group, name: name }, members: mem!, invites: selectedInviteUsers, inviteUsersOwner: inviteUsersOwner })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to invite to group! ${err.message}`, { variant: 'error' });
			});
	};

	const updateGroup = useUpdateGroup();
	const handleSave = async () => {
		const mem = queryClient.getQueryData<Member[]>([...GROUPS_QUERY_KEY, groupID, 'members']);
		updateGroup
			.mutateAsync({ group: { ...group, name: name }, members: mem! })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to update group! ${err.message}`, { variant: 'error' });
			});
	};

	const handleMemberEdit = (item: Member) => {
		let mem = queryClient.getQueryData<Member[]>([...GROUPS_QUERY_KEY, groupID, 'members']);
		if (mem) {
			let index = mem?.findIndex((m) => m.user_id === item.user_id);
			mem[index] = item;
			queryClient.setQueryData<Member[]>([...GROUPS_QUERY_KEY, groupID, 'members'], [...mem]);
		}
		setStateUpdater(Math.random().toString());
	};

	const handleOpen = async () => {
		setName(group.name);
		setOpen(true);
	};

	const handleClose = async () => {
		setOpen(false);

		setSelectedInviteUsers([]);
		if (changed) refetchMembers();
	};

	const handleImageTokenUpdate = async (token: number | null) => {
		const { error } = await client.from('groups').update({ image_token: token }).eq('id', groupID).select();
		if (error) console.log(error);
	};

	const handleLeaveOpen = () => {
		setConfirmLeaveOpen(true);
	};
	const handleLeaveClose = () => {
		setConfirmLeaveOpen(false);
	};
	const leaveGroup = useLeaveGroup();
	const handleLeave = async (id: string) => {
		leaveGroup
			.mutateAsync(id)
			.then(() => {
				navigate('/groups');
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to leave group! ${err.message}`, { variant: 'error' });
			});
	};

	const handleDeleteOpen = () => {
		setConfirmOpen(true);
	};
	const handleDeleteClose = () => {
		setConfirmOpen(false);
	};
	const deleteGroup = useDeleteGroup();
	const handleDelete = async (id: string) => {
		await deleteGroup
			.mutateAsync(id)
			.then(() => {
				navigate('/groups');
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to delete group! ${err.message}`, { variant: 'error' });
			});
	};

	const changed = name !== group.name || stateUpdater !== '';

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
									<AvatarEditor bucket='groups' filepath={group.id} imageToken={group.image_token} handleTokenUpdate={handleImageTokenUpdate} disabled={!owner} />
								</Grid>
								<Grid item xs={12}>
									<TextField label='Group Name' variant='outlined' fullWidth value={name} onChange={(e) => setName(e.target.value)} disabled={!owner} />
								</Grid>
								{owner && (
									<>
										<Grid item xs>
											<UserSearch selectedInviteUsers={selectedInviteUsers} setSelectedInviteUsers={setSelectedInviteUsers} members={members!} disabled={!owner} />
										</Grid>
										<Grid item>
											<FormControl fullWidth>
												<Select value={inviteUsersOwner ? 1 : 0} onChange={(e) => setInviteUsersOwner(e.target.value === 1 ? true : false)} disabled={!owner}>
													<MenuItem value={0}>Member</MenuItem>
													<MenuItem value={1}>Owner</MenuItem>
												</Select>
											</FormControl>
										</Grid>
									</>
								)}

								{selectedInviteUsers.length === 0 && (
									<Grid item xs={12}>
										<Typography variant='h6' gutterBottom>
											People with access
										</Typography>

										<List sx={{ width: '100%' }} dense>
											{profile && (
												<ListItem>
													<ListItemAvatar>
														<Avatar
															alt={profile.first_name}
															src={
																profile.avatar_token && profile.avatar_token !== -1
																	? `${SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}?${profile.avatar_token}`
																	: '/defaultAvatar.png'
															}
														/>
													</ListItemAvatar>
													<ListItemText primary={`${profile.first_name} ${profile.last_name}`} secondary={profile.email} />
													<ListItemSecondaryAction>
														<Button variant='text' size='large' disabled sx={{ textTransform: 'none' }}>
															{owner ? 'Owner' : 'Member'}
														</Button>
													</ListItemSecondaryAction>
												</ListItem>
											)}

											<Divider />
											{/* {JSON.stringify(members)} */}
											<TransitionGroup>
												{members
													?.filter((m) => !m.deleted)
													.map((member) => (
														<Collapse key={member.user_id}>{renderItem({ member: member, handleMemberEdit, owner })}</Collapse>
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
									{owner ? (
										<LoadingButton onClick={handleDeleteOpen} endIcon={<Delete />} loading={membersLoading} loadingPosition='end' variant='contained' color='error'>
											Delete
										</LoadingButton>
									) : (
										<LoadingButton onClick={handleLeaveOpen} endIcon={<Logout />} loading={leaveGroup.isLoading} loadingPosition='end' variant='contained' color='error'>
											Leave Group
										</LoadingButton>
									)}
								</Grid>
								<Grid item>
									<Stack direction='row' justifyContent='flex-end' spacing={2}>
										<Button color='inherit' onClick={handleClose}>
											Cancel
										</Button>
										{owner && (
											<>
												{selectedInviteUsers.length === 0 ? (
													<LoadingButton
														onClick={handleSave}
														endIcon={<Save />}
														loading={membersLoading || updateGroup.isLoading}
														loadingPosition='end'
														variant='contained'
														disabled={!changed}
													>
														Save
													</LoadingButton>
												) : (
													<LoadingButton
														onClick={handleInvite}
														endIcon={<Send />}
														loading={membersLoading || inviteToGroup.isLoading}
														loadingPosition='end'
														variant='contained'
													>
														Invite
													</LoadingButton>
												)}
											</>
										)}
									</Stack>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>

			<Dialog open={confirmOpen} onClose={handleDeleteClose}>
				<DialogTitle>Delete {group.name} Group?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete this group? <b>All members will be removed!</b>
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleDeleteClose}>
						Cancel
					</Button>
					<LoadingButton onClick={() => handleDelete(groupID!)} endIcon={<DeleteForever />} color='error' loading={deleteGroup.isLoading} loadingPosition='end' variant='contained'>
						Yes, Delete it
					</LoadingButton>
				</DialogActions>
			</Dialog>

			<Dialog open={confirmLeaveOpen} onClose={handleLeaveClose}>
				<DialogTitle>Leave {group.name} Group?</DialogTitle>
				<DialogContent>
					<DialogContentText>Are you sure you want to leave this group?</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleLeaveClose}>
						Cancel
					</Button>
					<LoadingButton onClick={() => handleLeave(groupID!)} endIcon={<Logout />} color='error' loading={leaveGroup.isLoading} loadingPosition='end' variant='contained'>
						Yes, Leave it
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</>
	);
}
