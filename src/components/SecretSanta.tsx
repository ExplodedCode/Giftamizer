import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from '../lib/snackbar';
import moment from 'moment';

import { Shuffle } from 'lucide-react';

import { GroupType, Member, SecretSantaDrawings, SecretSantaStatus } from '../lib/useSupabase/types';
import { useGetProfile, useSupabase, useUpdateGroup } from '../lib/useSupabase';
import { getSignedUrl } from '../lib/useSupabase/storageUrls';
import SecretSantaSetup from './SecretSantaSetup';

import { Button } from './ui/button';
import { Chip } from './ui/chip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Spinner } from './ui/spinner';
import { UserAvatar } from './ui/avatar';

interface SecretSantaProps {
	group: GroupType;
	members: Member[];
}

export default function SecretSanta({ group, members }: SecretSantaProps) {
	const navigate = useNavigate();
	const location = useLocation();

	const { enqueueSnackbar } = useSnackbar();
	const { client, user } = useSupabase();

	const { data: profile } = useGetProfile();
	const updateGroup = useUpdateGroup();

	const [myMembership, setMyMembership] = React.useState<Member | undefined>();

	const open = location.hash === '#secret-santa';

	const [loading, setLoading] = React.useState<boolean>(false);
	const [allowCreate, setAllowCreate] = React.useState<boolean>(false);

	const [eventName, setEventName] = React.useState<string>('');
	const [eventDate, setEventDate] = React.useState<moment.Moment | null>(moment());
	const [drawing, setDrawing] = React.useState<SecretSantaDrawings>();

	const setStatus = async (status: SecretSantaStatus) => {
		setLoading(true);
		await updateGroup
			.mutateAsync({ group: { ...group, secret_santa: { ...group.secret_santa, status: status } } })
			.then(() => {
				setLoading(false);
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to update group! ${err.message}`, { variant: 'error' });
				setLoading(false);
			});
	};

	const handleClose = React.useCallback(() => {
		navigate('#');

		setAllowCreate(false);
		setEventName('');
		setEventDate(moment());
		setDrawing(undefined);
	}, [navigate]);

	const enabledSecretSanta = async (drawings: SecretSantaDrawings) => {
		setLoading(true);
		await updateGroup
			.mutateAsync({
				group: {
					...group,
					secret_santa: {
						...group.secret_santa,
						status: SecretSantaStatus.On,
						name: eventName.trim(),
						date: eventDate?.format('LL') ?? '',
						drawing: drawings,
					},
				},
			})
			.then(async () => {
				// send notifications
				for (const drawing in drawings) {
					if (!drawing.includes('_') && drawing !== user.id) {
						const { error } = await client.functions.invoke('invite/secret-santa', {
							body: {
								group: {
									name: group.name,
									id: group.id,
								},
								user: members.find((member) => member.user_id === drawing),
								invited_by: `${profile?.first_name} ${profile?.last_name} `,
							},
						});
						if (error) console.error(error);
					}
				}

				setLoading(false);
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to update group! ${err.message}`, { variant: 'error' });
				setLoading(false);
			});
	};

	React.useEffect(() => {
		let active = true;

		const getMyMembership = async () => {
			const { data, error } = await client
				.from('group_members')
				.select(
					`user_id,
					owner,
					invite,
					profile:profiles(
							email,
							first_name,
							last_name,
							bio,
							enable_lists,
							avatar_token
						)
					)`
				)
				.eq('user_id', user.id)
				.eq('group_id', group.id)
				.single();

			if (!active) return;

			if (error || !data) {
				enqueueSnackbar(`Unable to get your membership for Secret Santa!`, { variant: 'error' });
				setMyMembership(undefined);
				return;
			}

			const membership = data as unknown as Member;
			const image = membership.profile.avatar_token ? await getSignedUrl(client, 'avatars', `${user.id}`) : '';

			if (!active) return;

			setMyMembership({
				...membership,
				profile: {
					...membership.profile,
					// @ts-ignore
					image: image,
				},
			});
		};

		getMyMembership();

		return () => {
			active = false;
		};
	}, [client, enqueueSnackbar, user, group.id]);

	// The members list handed down by the page is a fresh array on every render;
	// everything below reads from this memo so the setup wizard stays stable.
	const allMembers = React.useMemo(() => (myMembership ? [myMembership, ...members] : members), [myMembership, members]);

	const drawingChip = (uid: string, clickable: boolean = true) => {
		let member = allMembers.find((m) => m.user_id === uid);
		let name = `${member?.profile.first_name} ${member?.profile.last_name}`.trim();

		return (
			<Chip
				key={uid}
				icon={<UserAvatar alt={name} src={member?.profile.image} className='size-4' />}
				className='border-transparent bg-white text-zinc-900 hover:bg-white/90'
				onClick={clickable ? () => navigate(`/groups/${group.id}/${uid}`) : undefined}
			>
				{name}
			</Chip>
		);
	};

	return (
		<>
			{group.my_membership[0].owner && group.secret_santa.status === SecretSantaStatus.Init && (
				<div className='mb-6 flex justify-center'>
					<div className='w-full max-w-xl animate-in rounded-xl bg-gradient-to-br from-primary to-primary-hover p-5 text-primary-foreground shadow-lg fade-in zoom-in-95'>
						<p className='mb-3 text-lg font-semibold'>Draw names for your Secret Santa gift exchange!</p>

						<div className='flex flex-wrap justify-end gap-2'>
							<Button variant='ghost' className='text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground' onClick={() => setStatus(SecretSantaStatus.Off)} loading={loading}>
								No thanks
							</Button>
							<Button variant='secondary' onClick={() => navigate('#secret-santa')} loading={loading}>
								Draw Names
							</Button>
						</div>
					</div>
				</div>
			)}

			{group.secret_santa.status === SecretSantaStatus.On && group.secret_santa.drawing?.[user.id] && myMembership && (
				<div className='mb-6 flex justify-center'>
					<div className='w-full max-w-xl animate-in rounded-xl bg-gradient-to-br from-primary to-primary-hover p-5 text-primary-foreground shadow-lg fade-in zoom-in-95'>
						<p className='text-lg font-semibold'>{group.secret_santa.name}</p>
						<p className='mb-3 text-xs opacity-90'>{group.secret_santa.date}</p>

						<p className='mb-1.5 text-sm'>You're getting a gift for:</p>

						<div className='flex flex-wrap gap-1.5'>{group.secret_santa.drawing?.[user.id]?.map((uid) => drawingChip(uid))}</div>

						{(() => {
							// Display drawing result for child lists to list owner
							let listDrawings: React.JSX.Element[] = [];

							for (const drawing in group.secret_santa.drawing) {
								if (drawing !== user.id && drawing.startsWith(user.id)) {
									let listMember = allMembers.find((m) => m.user_id === drawing);

									listDrawings.push(
										<div className='mt-3' key={drawing}>
											<p className='mb-1.5 text-sm'>{`${listMember?.profile.first_name} ${listMember?.profile.last_name}`.trim()} is getting a gift for:</p>
											<div className='flex flex-wrap gap-1.5'>{group.secret_santa.drawing[drawing]?.map((uid) => drawingChip(uid, uid !== user.id))}</div>
										</div>
									);
								}
							}

							return listDrawings;
						})()}
					</div>
				</div>
			)}

			<Dialog
				open={group.my_membership[0].owner && open}
				onOpenChange={(next) => {
					if (!next) handleClose();
				}}
			>
				<DialogContent fullScreenOnMobile>
					<DialogHeader>
						<DialogTitle>Draw names for your Secret Santa gift exchange!</DialogTitle>
					</DialogHeader>

					{myMembership ? (
						<div className='flex flex-col gap-4'>
							<SecretSantaSetup
								members={allMembers}
								eventName={eventName}
								setEventName={setEventName}
								eventDate={eventDate}
								setEventDate={setEventDate}
								setDrawing={setDrawing}
								setAllowCreate={setAllowCreate}
							/>

							<div className='flex justify-end gap-2'>
								<Button variant='ghost' onClick={handleClose} disabled={updateGroup.isLoading}>
									Cancel
								</Button>

								<Button
									onClick={() => {
										if (drawing) enabledSecretSanta(drawing);
									}}
									loading={updateGroup.isLoading}
									disabled={!allowCreate || !drawing}
								>
									Draw Names
									<Shuffle />
								</Button>
							</div>
						</div>
					) : (
						<div className='flex justify-center py-10'>
							<Spinner size={32} />
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
