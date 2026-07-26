import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useGetProfile, useSupabase, validateEmail } from '../lib/useSupabase';
import { useSnackbar } from '../lib/snackbar';

import { ArrowRightLeft, Pencil, X } from 'lucide-react';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';

export default function EmailEditor() {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const { client } = useSupabase();
	const { data: profile } = useGetProfile();

	const open = location.hash === '#my-account-email';
	const [loading, setLoading] = React.useState(false);

	const [email, setEmail] = React.useState('');
	const [emailConfirm, setEmailConfirm] = React.useState('');

	const handleClose = () => {
		navigate('#my-account'); // close dialog
		setLoading(false);
		setEmail('');
		setEmailConfirm('');
	};
	const handleUpdateEmail = async () => {
		setLoading(true);

		const { error } = await client.auth.updateUser({ email: email });

		if (error) {
			console.log(error);
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		} else {
			enqueueSnackbar(`Confirmation sent to ${profile?.email} & ${email}`, {
				variant: 'info',
				autoHideDuration: null,
				action: (key) => (
					<>
						<button type='button' aria-label='close' className='cursor-pointer rounded-md p-1 opacity-70 hover:opacity-100' onClick={() => closeSnackbar(key)}>
							<X className='size-4' />
						</button>
					</>
				),
			});
		}

		handleClose();
	};

	return (
		<>
			{/* Email Field with Edit Action */}
			<FormField label='Email'>
				<div className='flex items-center gap-2'>
					<Input value={profile?.email ?? ''} disabled className='flex-1' />
					<Button onClick={() => navigate('#my-account-email')} className='shrink-0'>
						<span className='hidden sm:inline'>Change email</span>
						<Pencil />
					</Button>
				</div>
			</FormField>

			{/* Popup Dialog with Email Updater */}
			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (!next) handleClose();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Update Profile Email</DialogTitle>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						<FormField label='New Email' required error={!validateEmail(email)}>
							<Input required placeholder={profile?.email} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!validateEmail(email)} />
						</FormField>

						<FormField label='Confirm New Email' required error={!validateEmail(emailConfirm) || email !== emailConfirm}>
							<Input
								required
								placeholder={profile?.email}
								value={emailConfirm}
								onChange={(e) => setEmailConfirm(e.target.value)}
								aria-invalid={!validateEmail(emailConfirm) || email !== emailConfirm}
							/>
						</FormField>
					</div>

					<DialogFooter>
						<Button variant='ghost' onClick={handleClose}>
							Cancel
						</Button>

						<Button onClick={handleUpdateEmail} disabled={!(validateEmail(email) && validateEmail(emailConfirm) && email === emailConfirm)} loading={loading}>
							Update Email
							<ArrowRightLeft />
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
