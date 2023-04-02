import React from 'react';
import { useLocation } from 'react-router-dom';

import { useSupabase, SUPABASE_URL } from '../lib/useSupabase';
import { GroupType, Member } from '../lib/useSupabase/types';
import { TransitionGroup } from 'react-transition-group';

import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';
import {
	Avatar,
	Button,
	Dialog,
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
import { Save, Send, Settings } from '@mui/icons-material';

export interface MemberEdit extends Member {
	deleted: boolean;
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
	const location = useLocation();
	const groupID = location.pathname.split('/groups/')[1];

	const theme = useTheme();

	const { client, user, profile } = useSupabase();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	const [name, setName] = React.useState('');
	const [members, setMembers] = React.useState<MemberEdit[]>([]);

	const [selectedInviteUsers, setSelectedInviteUsers] = React.useState<InviteUserType[]>([]);
	const [inviteUsersOwner, setInviteUsersOwner] = React.useState(false);

	const handleInvite = async () => {
		setLoading(true);

		for (const inviteUsers of selectedInviteUsers) {
			if (inviteUsers.user_id) {
				const { error } = await client.from('group_members').insert({ group_id: props.group.id, user_id: inviteUsers.user_id, owner: inviteUsersOwner });
				if (error) console.log(error);
			} else {
				const { error } = await client.functions.invoke('groups/invite', {
					body: {
						group: {
							name: props.group.name,
							id: props.group.id,
						},
						users: selectedInviteUsers,
					},
				});
				if (error) console.log(error);
			}
		}

		handleClose();
	};

	const handleSave = async () => {
		setLoading(true);

		const { data: groupData, error: groupError } = await client.from('groups').update({ name: name }).eq('id', groupID).select();

		console.log(groupData, groupError);

		const { data: memberData, error: memberError } = await client
			.from('group_members')
			.upsert(
				members
					.filter((m) => !m.deleted)
					.map((m) => {
						return {
							group_id: groupID,
							user_id: m.user_id,
							owner: m.owner,
						};
					})
			)
			.select();
		console.log(memberData, memberError);

		members
			.filter((m) => m.deleted)
			.forEach(async (deletedUser) => {
				const { data, error } = await client.from('group_members').delete().eq('group_id', groupID).eq('user_id', deletedUser.user_id);

				console.log(data, error);
			});

		handleClose();
	};

	const handleMemberEdit = (item: MemberEdit) => {
		let mem = members;

		let index = mem.findIndex((m) => m.user_id === item.user_id);

		mem[index] = item;

		setMembers([...mem]);
	};

	const handleOpen = async () => {
		setName(props.group.name);

		let mem = props.members.map((m) => {
			return { ...m, deleted: false };
		});
		setMembers(mem);

		setOpen(true);
	};

	const handleClose = async () => {
		setOpen(false);

		setSelectedInviteUsers([]);
		setLoading(false);
	};

	const handleImageTokenUpdate = async (token: number | null) => {
		const { error } = await client.from('groups').update({ image_token: token }).eq('id', groupID).select();
		if (error) console.log(error);
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
				</DialogContent>
			</Dialog>
		</>
	);
}
