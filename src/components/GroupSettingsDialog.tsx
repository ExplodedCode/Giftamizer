import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { useQueryClient } from '@tanstack/react-query';
import {
	useSupabase,
	SUPABASE_URL,
	useDeleteGroup,
	useGetGroupMembers,
	GROUPS_QUERY_KEY,
	useUpdateGroup,
	useInviteToGroup,
	useGetProfile,
	useLeaveGroup,
	useGetTour,
	useUpdateTour,
	groupSettingsTourProgress,
} from '../lib/useSupabase';
import { GroupType, Member, Profile, SecretSanta, SecretSantaStatus } from '../lib/useSupabase/types';
import { TransitionGroup } from 'react-transition-group';

import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';
import {
	Avatar,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
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
	Switch,
	TextField,
	Tooltip,
	Typography,
	useMediaQuery,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Share, Delete, DeleteForever, Email, EscalatorWarning, Logout, Save, Send, Settings } from '@mui/icons-material';

import UserSearch from './UserSearch';
import ImageCropper from './ImageCropper';
import TourTooltip from './TourTooltip';

interface RenderItemOptionsProps {
	member: Member;
	handleMemberEdit: (member: Member) => void;
	owner: boolean;
}

function renderItem({ member, handleMemberEdit, owner }: RenderItemOptionsProps) {
	return (
		<ListItem>
			<ListItemAvatar>
				{!member.external ? (
					<Avatar alt={`${member.profile.first_name} ${member.profile.last_name}`} src={member.profile.image ?? '/defaultAvatar.png'} />
				) : (
					<Avatar sx={{ bgcolor: 'primary.main' }}>
						{member.child_list && <EscalatorWarning />}
						{member.external && <Email />}
					</Avatar>
				)}
			</ListItemAvatar>
			<ListItemText
				primary={
					<>
						{member.external ? member.profile.email : `${member.profile.first_name} ${member.profile.last_name}`}

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
				{member.child_list ? (
					owner && (
						<>
							<Button variant='outlined' color='error' onClick={() => handleMemberEdit({ ...member, deleted: true })}>
								Remove
							</Button>
						</>
					)
				) : (
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
				)}
			</ListItemSecondaryAction>
		</ListItem>
	);
}

type GroupSettingsDialogProps = {
	group: GroupType;
	owner: boolean;
};
export default function GroupSettingsDialog({ group, owner }: GroupSettingsDialogProps) {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();

	const { group: groupID } = useParams();

	const { user } = useSupabase();
	const { data: profile } = useGetProfile();

	const queryClient = useQueryClient();
	const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useGetGroupMembers(groupID!);

	const open = location.hash.startsWith('#group-settings');

	const [name, setName] = React.useState('');
	const [inviteLink, setInviteLink] = React.useState<boolean>(true);
	const [image, setImage] = React.useState<string | undefined>();

	const [secretSanta, setSecretSanta] = React.useState<SecretSanta>();

	const [selectedInviteUsers, setSelectedInviteUsers] = React.useState<Profile[]>([]);
	const [inviteUsersOwner, setInviteUsersOwner] = React.useState(false);

	const confirmLeaveOpen = location.hash === '#group-settings-leave';
	const confirmDeleteOpen = location.hash === '#group-settings-delete';
	const confirmSecretSantaOpen = location.hash === '#group-settings-secret-santa';

	const [stateUpdater, setStateUpdater] = React.useState('');

	const inviteToGroup = useInviteToGroup();
	const handleInvite = async () => {
		const mem = queryClient.getQueryData<Member[]>([...GROUPS_QUERY_KEY, groupID, 'members']);
		inviteToGroup
			.mutateAsync({
				group: { ...group, name: name, invite_link: inviteLink, image: image },
				members: mem!.filter((m) => !m.user_id.includes('_')),
				invites: selectedInviteUsers,
				inviteUsersOwner: inviteUsersOwner,
			})
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
			.mutateAsync({ group: { ...group, name: name, invite_link: inviteLink, image: image }, members: mem! })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				console.log(err);
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
		setInviteLink(group.invite_link);
		setImage(group.image);

		setSecretSanta(group.secret_santa);

		navigate('#group-settings'); // open dialog

		if (!tour?.group_settings) {
			updateTour.mutateAsync({
				group_settings: true,
			});
		}
	};

	React.useEffect(() => {
		setName(group.name);
		setInviteLink(group.invite_link);
		setImage(group.image);

		setSecretSanta(group.secret_santa);

		if (!open) setTourStart(false);
		setTimeout(() => {
			if (open) setTourStart(true);
		}, 250);
	}, [group, open]);

	const handleClose = async () => {
		navigate('#'); // close dialog

		setSelectedInviteUsers([]);
		if (changed) refetchMembers();

		if (!tour?.group_settings || !tour?.group_settings_add_people || !tour?.group_settings_permissions) {
			updateTour.mutateAsync({
				group_settings: true,
				group_settings_add_people: true,
				group_settings_permissions: true,
			});
		}
	};

	const handleLeaveOpen = () => {
		navigate('#group-settings-leave'); // open dialog
	};
	const handleLeaveClose = () => {
		navigate('#group-settings'); // close dialog
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
		navigate('#group-settings-delete'); // open dialog
	};
	const handleDeleteClose = () => {
		navigate('#group-settings'); // close dialog
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

	const handleSecretSantaOpen = () => {
		navigate('#group-settings-secret-santa'); // open dialog
	};
	const handleSecretSantaClose = () => {
		navigate('#group-settings'); // close dialog
	};
	const handleSecretSantaRemove = async () => {
		await updateGroup
			.mutateAsync({
				group: {
					...group,
					secret_santa: {
						status: SecretSantaStatus.Off,
					},
				},
			})
			.then(() => {
				navigate('#'); // close dialog
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to update group! ${err.message}`, { variant: 'error' });
			});
	};

	const handleSecretSantaEnable = async () => {
		await updateGroup
			.mutateAsync({
				group: {
					...group,
					secret_santa: {
						status: SecretSantaStatus.Init,
					},
				},
			})
			.then(() => {
				navigate('#secret-santa');
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to update group! ${err.message}`, { variant: 'error' });
			});
	};

	const changed = name !== group.name || inviteLink !== group.invite_link || image !== group.image || stateUpdater !== '';

	//
	// User tour
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const [tourStart, setTourStart] = React.useState(false);

	//
	// link invite
	const inviteURL = `https://${window.location.host}/group-invite/${group.id}`;
	const handleSharing = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					url: inviteURL,
					text: `Join Giftamizer! An online gift registry and shopping platform. Giftamizer makes it easy for friends and family to find the perfect gifts for your special occasions.`,
				});
			} catch (error) {
				if (String(error).includes('Share canceled')) return;
				enqueueSnackbar(`Oops! I couldn't share to the world because: ${error}`, { variant: 'error' });
			}
		} else {
			enqueueSnackbar(`Web share is currently not supported on this browser. `, { variant: 'error' });
		}
	};

	return (
		<>
			{useMediaQuery(theme.breakpoints.up('md')) ? (
				<Button tour-element='group_settings' variant='outlined' color='primary' size='small' onClick={handleOpen}>
					Manage
				</Button>
			) : (
				<IconButton tour-element='group_settings' onClick={handleOpen}>
					<Settings />
				</IconButton>
			)}

			<Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Group Settings</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>Share your gift lists with your friends and family.</DialogContentText>

							<Grid container spacing={2}>
								<Grid item xs={12}>
									<ImageCropper value={image} onChange={setImage} aspectRatio={1} disabled={!owner} />
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
											<FormControl fullWidth tour-element='group_settings_permissions'>
												<Select value={inviteUsersOwner ? 1 : 0} onChange={(e) => setInviteUsersOwner(e.target.value === 1 ? true : false)} disabled={!owner}>
													<MenuItem value={0}>Member</MenuItem>
													<MenuItem value={1}>Owner</MenuItem>
												</Select>
											</FormControl>
										</Grid>
									</>
								)}

								<Grid item xs={12}>
									<FormControlLabel
										control={<Switch checked={inviteLink} onChange={(e) => setInviteLink(e.target.checked)} />}
										label='Join by Link'
										disabled={!owner}
										sx={{ mb: 1 }}
									/>

									<Collapse in={inviteLink}>
										<Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
											<TextField
												label='Invitation Link'
												variant='outlined'
												size='small'
												fullWidth
												InputLabelProps={{
													shrink: true,
												}}
												disabled
												value={inviteURL.replace('https://', '')}
											/>

											<Tooltip title='Share Invitation' placement='bottom-end' arrow enterDelay={500}>
												<IconButton aria-label='delete' sx={{ ml: 0.5 }} onClick={() => handleSharing()}>
													<Share />
												</IconButton>
											</Tooltip>
										</Box>
									</Collapse>
								</Grid>

								{owner && secretSanta?.status === SecretSantaStatus.Off && (
									<Grid item xs={12}>
										<Button variant='contained' disabled={changed} onClick={handleSecretSantaEnable}>
											Enable Secret Santa
										</Button>
									</Grid>
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
									<Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
										{owner && (
											<LoadingButton onClick={handleDeleteOpen} endIcon={<Delete />} loading={membersLoading} loadingPosition='end' variant='contained' color='error'>
												Delete
											</LoadingButton>
										)}

										{!changed && (members?.filter((m) => m.owner).length !== 0 || !owner) && (
											<LoadingButton onClick={handleLeaveOpen} endIcon={<Logout />} loading={leaveGroup.isLoading} loadingPosition='end' variant='contained' color='error'>
												Leave Group
											</LoadingButton>
										)}

										{secretSanta?.status === SecretSantaStatus.On && owner && (
											<Grid item xs={12}>
												<Button onClick={handleSecretSantaOpen} variant='contained' color='error' endIcon={<Delete />} disabled={changed}>
													Secret Santa
												</Button>
											</Grid>
										)}
									</Stack>
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
														disabled={!changed || name.length <= 0}
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

			<Dialog open={confirmDeleteOpen} onClose={handleDeleteClose}>
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

			<Dialog open={confirmSecretSantaOpen} onClose={handleSecretSantaClose}>
				<DialogTitle>Remove Secret Santa from the group?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to secret santa this group?
						<br />
						<br />
						This effects to all group members.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleSecretSantaClose}>
						Cancel
					</Button>
					<LoadingButton onClick={() => handleSecretSantaRemove()} endIcon={<Delete />} color='error' loading={leaveGroup.isLoading} loadingPosition='end' variant='contained'>
						Remove
					</LoadingButton>
				</DialogActions>
			</Dialog>

			{tour && tourStart && (
				<>
					<TourTooltip
						open={groupSettingsTourProgress(tour) === 'group_settings_add_people'}
						anchorEl={document.querySelector('[tour-element="group_settings_add_people"]')}
						placement='top'
						content={
							<>
								<DialogContent>
									<Typography>Invite existing Giftamizer users or send anyone an invite via email.</Typography>
								</DialogContent>
								<DialogActions>
									<LoadingButton
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												group_settings_add_people: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Next
									</LoadingButton>
								</DialogActions>
							</>
						}
						backgroundColor={theme.palette.primary.main}
						color={theme.palette.primary.contrastText}
						mask
					/>

					<TourTooltip
						open={groupSettingsTourProgress(tour) === 'group_settings_permissions'}
						anchorEl={document.querySelector('[tour-element="group_settings_permissions"]')}
						placement='top'
						content={
							<>
								<DialogContent sx={{ p: 1.5 }}>
									<Typography gutterBottom>Members can only view other member and either items.</Typography>
									<Typography>Owners can manage groups settings and members.</Typography>
								</DialogContent>
								<DialogActions>
									<LoadingButton
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												group_settings_permissions: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Got it
									</LoadingButton>
								</DialogActions>
							</>
						}
						backgroundColor={theme.palette.primary.main}
						color={theme.palette.primary.contrastText}
						mask
					/>
				</>
			)}
		</>
	);
}
