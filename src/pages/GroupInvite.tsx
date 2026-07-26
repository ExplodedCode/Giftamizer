import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../lib/snackbar';

import { FakeDelay, useSupabase } from '../lib/useSupabase';

import { Button } from '../components/ui/button';
import { Backdrop } from '../components/ui/spinner';
import { SimpleTooltip } from '../components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

type GroupInvite = {
	name: string;
	image_token: number | null;
	image?: string;
	members: Users[];
};

type Users = {
	user_id: string;
	first_name: string;
	avatar_token: number | null;
	image?: string;
};

var randomImage = Math.floor(Math.random() * 10) + 1;
export default function GroupInvitePage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { client, user } = useSupabase();

	const { group: groupID } = useParams();

	const [invite, setInvite] = React.useState<GroupInvite>();

	React.useEffect(() => {
		const getGroup = async () => {
			await FakeDelay();

			const { data, error } = await client.functions.invoke('invite/preview', { body: { group_id: groupID } });
			if (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
				navigate('/');
			} else {
				if ((data as GroupInvite)?.name?.length > 0) {
					setInvite(data as GroupInvite);
				}
			}
		};

		getGroup();
	}, [client, groupID, enqueueSnackbar, navigate]);

	const acceptInvite = async () => {
		if (user?.id) {
			const { error } = await client.rpc('accept_link_invite', { _group_id: groupID, _user_id: user.id }).single();
			if (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} else {
				navigate('/groups/' + groupID);
			}
		} else {
			enqueueSnackbar('Not logged in!', { variant: 'error' });
		}
	};

	const alreadyJoined = invite?.members.find((u) => u.user_id === user?.id) !== undefined;

	return (
		<>
			{!invite ? (
				<Backdrop open={true} />
			) : (
				<div className='flex min-h-dvh'>
					{/* Hero image side */}
					<div
						className='hidden bg-cover bg-center sm:block sm:w-1/3 md:w-7/12'
						style={{ backgroundImage: 'url(/images/signin/' + randomImage + '.jpg)' }}
					/>

					{/* Invite panel */}
					<div className='flex w-full flex-col items-center bg-card px-6 py-16 sm:w-2/3 md:w-5/12'>
						<div className='flex size-[150px] items-center justify-center overflow-hidden rounded-3xl bg-primary'>
							{invite.image ? (
								<img src={invite.image} alt={invite.name} className='size-full object-cover' />
							) : (
								<span className='text-8xl font-medium text-primary-foreground'>{Array.from(String(invite.name).toUpperCase())[0]}</span>
							)}
						</div>

						<p className='mt-4 text-sm text-muted-foreground'>You've been invited to join</p>
						<h1 className='text-2xl font-semibold tracking-tight'>{invite.name}</h1>

						<div className='mt-3 flex items-center -space-x-2'>
							{invite.members.slice(0, 4).map((member) => (
								<SimpleTooltip key={member.user_id} title={member.first_name}>
									<Avatar className='ring-2 ring-card'>
										{member.image && <AvatarImage src={member.image} alt={member.first_name} />}
										<AvatarFallback>{Array.from(String(member.first_name).toUpperCase())[0]}</AvatarFallback>
									</Avatar>
								</SimpleTooltip>
							))}
							{invite.members.length > 4 && (
								<div className='flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground ring-2 ring-card'>
									+{invite.members.length - 4}
								</div>
							)}
						</div>

						<div className='mt-8 flex w-full max-w-sm flex-col gap-3'>
							<Button
								className='w-full'
								disabled={!user || alreadyJoined}
								onClick={() => {
									acceptInvite();
								}}
							>
								{alreadyJoined ? 'Already Joined' : 'Accept Invite'}
							</Button>

							{!user && (
								<Button variant='outline' className='w-full' onClick={() => navigate(`/signin?redirectTo=${window.location.pathname}`)}>
									Login or Create Account
								</Button>
							)}
						</div>

						{user && alreadyJoined && (
							<Link to={`/groups/${groupID}`} className='mt-4 text-sm text-primary underline-offset-4 hover:underline'>
								Open Group
							</Link>
						)}
					</div>
				</div>
			)}
		</>
	);
}
