import * as React from 'react';

import { ArrowLeftRight } from 'lucide-react';

import { useSupabase } from '../lib/useSupabase';
import { getDevAdminClient } from '../lib/useSupabase/devAdminClient';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Spinner } from './ui/spinner';

type SwitchableProfile = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
};

// DEV ONLY testing dashboard: lets you jump between any seeded account
// without knowing its password, using the service role key to mint a
// magic-link OTP and immediately redeem it on the app's own client. See
// devAdminClient.ts for why this is safe to leave wired up - Vite strips
// this component (and the service role key it needs) out of production
// builds via import.meta.env.PROD dead-code elimination.
export default function DevAccountSwitcher() {
	const { client, user } = useSupabase();

	const [open, setOpen] = React.useState(false);
	const [profiles, setProfiles] = React.useState<SwitchableProfile[]>([]);
	const [search, setSearch] = React.useState('');
	const [loading, setLoading] = React.useState(false);
	const [switchingTo, setSwitchingTo] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	if (import.meta.env.PROD) return null;

	const handleOpen = async () => {
		setOpen(true);
		setError(null);
		setLoading(true);

		const { data, error } = await client.from('profiles').select('user_id, email, first_name, last_name').order('first_name');
		if (error) {
			setError(error.message);
		} else {
			setProfiles((data ?? []) as SwitchableProfile[]);
		}

		setLoading(false);
	};

	const handleClose = () => {
		if (switchingTo) return; // don't close mid-switch
		setOpen(false);
		setSearch('');
		setError(null);
	};

	const handleSwitch = async (profile: SwitchableProfile) => {
		const adminClient = getDevAdminClient();
		if (!adminClient) {
			setError('Missing REACT_APP_SUPABASE_SERVICE_ROLE_KEY - set it in .env (see .env.example) to use the account switcher.');
			return;
		}

		setSwitchingTo(profile.user_id);
		setError(null);

		try {
			const { data, error } = await adminClient.auth.admin.generateLink({ type: 'magiclink', email: profile.email });
			if (error) throw error;

			const { error: verifyError } = await client.auth.verifyOtp({
				email: profile.email,
				token: data.properties.email_otp,
				type: 'magiclink',
			});
			if (verifyError) throw verifyError;

			window.location.assign('/');
		} catch (err: any) {
			setError(err.message ?? 'Failed to switch accounts');
			setSwitchingTo(null);
		}
	};

	const filtered = profiles.filter((p) => {
		const q = search.trim().toLowerCase();
		if (!q) return true;
		return `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(q);
	});

	return (
		<>
			<button
				type='button'
				onClick={handleOpen}
				className='fixed top-2 left-1/2 z-[1400] flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-lg bg-festive px-3 py-1.5 text-xs font-semibold text-festive-foreground shadow-md transition-all outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring/50'
			>
				<ArrowLeftRight className='size-3.5' />
				SWITCH USER
			</button>

			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (!next) handleClose();
				}}
			>
				<DialogContent size='sm' dismissible={!switchingTo}>
					<DialogHeader>
						<DialogTitle>Switch Test Account</DialogTitle>
					</DialogHeader>

					<Input placeholder='Search by name or email' value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />

					{error && <p className='text-sm text-destructive'>{error}</p>}

					{loading ? (
						<div className='flex justify-center p-4'>
							<Spinner size={28} />
						</div>
					) : (
						<div className='flex max-h-[50vh] flex-col overflow-y-auto'>
							{filtered.map((profile) => {
								const isCurrent = profile.user_id === user?.id;
								return (
									<button
										type='button'
										key={profile.user_id}
										disabled={isCurrent || !!switchingTo}
										onClick={() => handleSwitch(profile)}
										className='flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50'
									>
										<span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground'>
											{(profile.first_name?.[0] ?? '?').toUpperCase()}
										</span>
										<span className='flex min-w-0 flex-1 flex-col'>
											<span className='truncate text-sm font-medium'>{`${profile.first_name} ${profile.last_name}${isCurrent ? ' (current)' : ''}`}</span>
											<span className='truncate text-xs text-muted-foreground'>{profile.email}</span>
										</span>
										{switchingTo === profile.user_id && <Spinner size={18} />}
									</button>
								);
							})}

							{filtered.length === 0 && <p className='p-4 text-center text-sm text-muted-foreground'>No users found</p>}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
