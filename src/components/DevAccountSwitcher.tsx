import * as React from 'react';

import {
	Avatar,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	List,
	ListItemAvatar,
	ListItemButton,
	ListItemText,
	TextField,
	Typography,
} from '@mui/material';
import { Close, SwapHoriz } from '@mui/icons-material';

import { useSupabase } from '../lib/useSupabase';
import { getDevAdminClient } from '../lib/useSupabase/devAdminClient';

type SwitchableProfile = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
};

// DEV ONLY testing dashboard: lets you jump between any seeded account
// without knowing its password, using the service role key to mint a
// magic-link OTP and immediately redeem it on the app's own client. See
// devAdminClient.ts for why this is safe to leave wired up - react-scripts
// strips this component (and the service role key it needs) out of
// production builds.
export default function DevAccountSwitcher() {
	const { client, user } = useSupabase();

	const [open, setOpen] = React.useState(false);
	const [profiles, setProfiles] = React.useState<SwitchableProfile[]>([]);
	const [search, setSearch] = React.useState('');
	const [loading, setLoading] = React.useState(false);
	const [switchingTo, setSwitchingTo] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	if (process.env.NODE_ENV === 'production') return null;

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
			<Button
				variant='contained'
				color='warning'
				size='small'
				startIcon={<SwapHoriz />}
				onClick={handleOpen}
				sx={{
					position: 'absolute',
					top: 8,
					left: '50%',
					transform: 'translateX(-50%)',
					zIndex: (theme) => theme.zIndex.modal + 1,
					boxShadow: 3,
				}}
			>
				Switch User
			</Button>

			<Dialog open={open} onClose={handleClose} fullWidth maxWidth='xs'>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					Switch Test Account
					<IconButton onClick={handleClose} disabled={!!switchingTo}>
						<Close />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						size='small'
						placeholder='Search by name or email'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						sx={{ mb: 2 }}
						autoFocus
					/>

					{error && (
						<Typography color='error' variant='body2' sx={{ mb: 2 }}>
							{error}
						</Typography>
					)}

					{loading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
							<CircularProgress size={28} />
						</Box>
					) : (
						<List dense>
							{filtered.map((profile) => {
								const isCurrent = profile.user_id === user?.id;
								return (
									<ListItemButton key={profile.user_id} disabled={isCurrent || !!switchingTo} onClick={() => handleSwitch(profile)}>
										<ListItemAvatar>
											<Avatar sx={{ bgcolor: 'primary.main' }}>{(profile.first_name?.[0] ?? '?').toUpperCase()}</Avatar>
										</ListItemAvatar>
										<ListItemText primary={`${profile.first_name} ${profile.last_name}${isCurrent ? ' (current)' : ''}`} secondary={profile.email} />
										{switchingTo === profile.user_id && <CircularProgress size={20} />}
									</ListItemButton>
								);
							})}

							{filtered.length === 0 && (
								<Typography variant='body2' sx={{ textAlign: 'center', p: 2 }}>
									No users found
								</Typography>
							)}
						</List>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
