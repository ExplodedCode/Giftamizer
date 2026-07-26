import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../lib/snackbar';

import { useQueryClient } from '@tanstack/react-query';
import {
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

import { Baby, LogOut, Mail, Save, Send, Settings, Share2, Trash2 } from 'lucide-react';

import UserSearch from './UserSearch';
import ImageCropper from './ImageCropper';
import TourTooltip from './TourTooltip';

import { useMediaQuery } from '../lib/utils';
import { Button } from './ui/button';
import { Collapse } from './ui/collapse';
import { ConfirmDialog } from './ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from './ui/select';
import { LabeledSwitch } from './ui/switch';
import { SimpleTooltip } from './ui/tooltip';
import { UserAvatar } from './ui/avatar';

interface RenderItemOptionsProps {
	member: Member;
	handleMemberEdit: (member: Member) => void;
	owner: boolean;
}

function renderItem({ member, handleMemberEdit, owner }: RenderItemOptionsProps) {
	return (
		<div className='flex items-center gap-3 py-2'>
			{!member.external ? (
				<UserAvatar alt={`${member.profile.first_name} ${member.profile.last_name}`} src={member.profile.image ?? '/defaultAvatar.png'} />
			) : (
				<span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
					{member.child_list && <Baby className='size-5' />}
					{member.external && <Mail className='size-5' />}
				</span>
			)}

			<div className='min-w-0 flex-1'>
				<p className='truncate text-sm font-medium'>
					{member.external ? member.profile.email : `${member.profile.first_name} ${member.profile.last_name}`}
					{member.invite && <span className='ml-1 text-muted-foreground'>— Pending</span>}
				</p>
				{!member.external && member.profile.email && <p className='truncate text-sm text-muted-foreground'>{member.profile.email}</p>}
			</div>

			<div className='shrink-0'>
				{member.child_list ? (
					owner && (
						<Button variant='outline' size='sm' className='border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive' onClick={() => handleMemberEdit({ ...member, deleted: true })}>
							Remove
						</Button>
					)
				) : (
					<Select
						value={member.owner ? '1' : '0'}
						onValueChange={(value) => {
							if (value === '-1') {
								handleMemberEdit({ ...member, deleted: true });
							} else {
								handleMemberEdit({ ...member, owner: value === '1' ? true : false });
							}
						}}
						disabled={!owner}
					>
						<SelectTrigger className='h-8 w-28'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='0'>Member</SelectItem>
							<SelectItem value='1'>Owner</SelectItem>
							<SelectSeparator />
							<SelectItem value='-1' className='text-destructive'>
								Remove Access
							</SelectItem>
						</SelectContent>
					</Select>
				)}
			</div>
		</div>
	);
}

type GroupSettingsDialogProps = {
	group: GroupType;
	owner: boolean;
};
export default function GroupSettingsDialog({ group, owner }: GroupSettingsDialogProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();

	const { group: groupID } = useParams();

	const { data: profile } = useGetProfile();

	const queryClient = useQueryClient();
	const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useGetGroupMembers(groupID!);

	const open = location.hash.startsWith('#group-settings');

	const isDesktop = useMediaQuery('(min-width: 900px)');

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
				group: { ...group, name: name.trim(), invite_link: inviteLink, image: image },
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
			.mutateAsync({ group: { ...group, name: name.trim(), invite_link: inviteLink, image: image }, members: mem! })
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
	const inviteURL = `${window.location.protocol}//${window.location.host}/group-invite/${group.id}`;
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
			{isDesktop ? (
				<Button {...({ 'tour-element': 'group_settings' } as object)} variant='outline' size='sm' onClick={handleOpen}>
					Manage
				</Button>
			) : (
				<button
					type='button'
					{...({ 'tour-element': 'group_settings' } as object)}
					onClick={handleOpen}
					className='flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
				>
					<Settings className='size-5' />
				</button>
			)}

			<Dialog
				open={open && !confirmLeaveOpen && !confirmDeleteOpen && !confirmSecretSantaOpen}
				onOpenChange={(next) => {
					if (!next) handleClose();
				}}
			>
				<DialogContent fullScreenOnMobile>
					<DialogHeader>
						<DialogTitle>Group Settings</DialogTitle>
						<DialogDescription>Share your gift lists with your friends and family.</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						<div className='flex justify-center'>
							<ImageCropper value={image} onChange={setImage} aspectRatio={1} disabled={!owner} />
						</div>

						<FormField label='Group Name'>
							<Input value={name} onChange={(e) => setName(e.target.value)} disabled={!owner} />
						</FormField>

						{owner && (
							<div className='flex items-end gap-2'>
								<div className='min-w-0 flex-1'>
									<UserSearch selectedInviteUsers={selectedInviteUsers} setSelectedInviteUsers={setSelectedInviteUsers} members={members!} disabled={!owner} />
								</div>
								<div {...({ 'tour-element': 'group_settings_permissions' } as object)} className='shrink-0'>
									<Select value={inviteUsersOwner ? '1' : '0'} onValueChange={(value) => setInviteUsersOwner(value === '1' ? true : false)} disabled={!owner}>
										<SelectTrigger className='w-28'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='0'>Member</SelectItem>
											<SelectItem value='1'>Owner</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

						<div>
							<LabeledSwitch label='Join by Link' checked={inviteLink} onCheckedChange={(checked) => setInviteLink(checked === true)} disabled={!owner} className='mb-2' />

							<Collapse in={inviteLink}>
								<div className='flex items-center gap-1 pt-1'>
									<FormField label='Invitation Link' className='min-w-0 flex-1'>
										<Input disabled value={inviteURL.replace(`${window.location.protocol}//`, '')} className='h-8 text-xs' />
									</FormField>
									<SimpleTooltip title='Share Invitation'>
										<button
											type='button'
											aria-label='share'
											onClick={() => handleSharing()}
											className='mt-5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
										>
											<Share2 className='size-5' />
										</button>
									</SimpleTooltip>
								</div>
							</Collapse>
						</div>

						{owner && secretSanta?.status === SecretSantaStatus.Off && (
							<div>
								<Button disabled={changed} onClick={handleSecretSantaEnable}>
									Enable Secret Santa
								</Button>
							</div>
						)}

						{selectedInviteUsers.length === 0 && (
							<div>
								<p className='mb-1 font-semibold'>People with access</p>

								<div className='flex flex-col'>
									{profile && (
										<div className='flex items-center gap-3 py-2'>
											<UserAvatar alt={profile.first_name} src={profile.image ?? '/defaultAvatar.png'} />
											<div className='min-w-0 flex-1'>
												<p className='truncate text-sm font-medium'>{`${profile.first_name} ${profile.last_name}`}</p>
												<p className='truncate text-sm text-muted-foreground'>{profile.email}</p>
											</div>
											<span className='shrink-0 text-sm text-muted-foreground'>{owner ? 'Owner' : 'Member'}</span>
										</div>
									)}

									<div className='h-px bg-border' />
									<TransitionGroup component={null}>
										{members
											?.filter((m) => !m.deleted)
											.map((member) => (
												<Collapse key={member.user_id}>{renderItem({ member: member, handleMemberEdit, owner })}</Collapse>
											))}
									</TransitionGroup>
								</div>
							</div>
						)}

						<div className='flex flex-wrap items-center justify-between gap-2'>
							<div className='flex flex-wrap items-center gap-2'>
								{owner && (
									<Button variant='destructive' onClick={handleDeleteOpen} loading={membersLoading}>
										Delete
										<Trash2 />
									</Button>
								)}

								{!changed && (members?.filter((m) => m.owner).length !== 0 || !owner) && (
									<Button variant='destructive' onClick={handleLeaveOpen} loading={leaveGroup.isLoading}>
										Leave Group
										<LogOut />
									</Button>
								)}

								{secretSanta?.status === SecretSantaStatus.On && owner && (
									<Button variant='destructive' onClick={handleSecretSantaOpen} disabled={changed}>
										Secret Santa
										<Trash2 />
									</Button>
								)}
							</div>

							<div className='flex items-center gap-2'>
								<Button variant='ghost' onClick={handleClose}>
									Cancel
								</Button>
								{owner && (
									<>
										{selectedInviteUsers.length === 0 ? (
											<Button onClick={handleSave} loading={membersLoading || updateGroup.isLoading} disabled={!changed || name.trim().length <= 0}>
												Save
												<Save />
											</Button>
										) : (
											<Button onClick={handleInvite} loading={membersLoading || inviteToGroup.isLoading}>
												Invite
												<Send />
											</Button>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={confirmDeleteOpen}
				onOpenChange={(next) => {
					if (!next) handleDeleteClose();
				}}
				title={`Delete ${group.name} Group?`}
				description={
					<>
						Are you sure you want to delete this group? <b>All members will be removed!</b>
					</>
				}
				confirmText='Yes, Delete it'
				destructive
				loading={deleteGroup.isLoading}
				onConfirm={() => handleDelete(groupID!)}
			/>

			<ConfirmDialog
				open={confirmLeaveOpen}
				onOpenChange={(next) => {
					if (!next) handleLeaveClose();
				}}
				title={`Leave ${group.name} Group?`}
				description='Are you sure you want to leave this group?'
				confirmText='Yes, Leave it'
				destructive
				loading={leaveGroup.isLoading}
				onConfirm={() => handleLeave(groupID!)}
			/>

			<ConfirmDialog
				open={confirmSecretSantaOpen}
				onOpenChange={(next) => {
					if (!next) handleSecretSantaClose();
				}}
				title='Remove Secret Santa from the group?'
				description={
					<>
						Are you sure you want to secret santa this group?
						<br />
						<br />
						This effects to all group members.
					</>
				}
				confirmText='Remove'
				destructive
				loading={leaveGroup.isLoading}
				onConfirm={() => handleSecretSantaRemove()}
			/>

			{tour && tourStart && (
				<>
					<TourTooltip
						open={groupSettingsTourProgress(tour) === 'group_settings_add_people'}
						anchorEl={document.querySelector('[tour-element="group_settings_add_people"]')}
						placement='top'
						content={
							<div>
								<p>Invite existing Giftamizer users or send anyone an invite via email.</p>
								<div className='mt-1 flex justify-end'>
									<Button
										variant='secondary'
										size='sm'
										onClick={() => {
											updateTour.mutateAsync({
												group_settings_add_people: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Next
									</Button>
								</div>
							</div>
						}
						mask
					/>

					<TourTooltip
						open={groupSettingsTourProgress(tour) === 'group_settings_permissions'}
						anchorEl={document.querySelector('[tour-element="group_settings_permissions"]')}
						placement='top'
						content={
							<div>
								<p>Members can only view other member and either items.</p>
								<p>Owners can manage groups settings and members.</p>
								<div className='mt-1 flex justify-end'>
									<Button
										variant='secondary'
										size='sm'
										onClick={() => {
											updateTour.mutateAsync({
												group_settings_permissions: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Got it
									</Button>
								</div>
							</div>
						}
						mask
					/>
				</>
			)}
		</>
	);
}
