import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSnackbar } from '../lib/snackbar';

import { signInWithGoogle, useSupabase, validateEmail } from '../lib/useSupabase';

import { Lock } from 'lucide-react';

import { GoogleIcon } from '../components/SvgIcons';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { FormField } from '../components/ui/form-field';
import { Input } from '../components/ui/input';

var randomImage = Math.floor(Math.random() * 10) + 1;

export default function SignIn() {
	const { client, setUser } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();
	let [searchParams] = useSearchParams();

	const redirectTo = searchParams.get('redirectTo');
	const accessToken = searchParams.get('accessToken');
	const refreshToken = searchParams.get('refreshToken');

	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');

	const [forgotDialogOpen, setForgotDialogOpen] = React.useState(false);
	const [passwordResetLoading, setPasswordResetLoading] = React.useState(false);
	const [resetEmail, setResetEmail] = React.useState('');

	React.useEffect(() => {
		const loginWithTokens = async (accessToken: string, refreshToken: string) => {
			console.log(accessToken, refreshToken);

			const { error } = await client.auth.setSession({
				access_token: accessToken,
				refresh_token: refreshToken,
			});

			if (error) {
				console.error('setSession Error', error);
				enqueueSnackbar(String(error.message), {
					variant: 'error',
				});
			}
		};

		if (accessToken && refreshToken) {
			loginWithTokens(accessToken, refreshToken);
		}
	}, [enqueueSnackbar, client, accessToken, refreshToken]);

	const handleSubmit = async () => {
		const { error, data } = await client.auth.signInWithPassword({
			email: email,
			password: password,
		});

		if (data.user && setUser) {
			setUser(data.user);
		}

		if (error) {
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		}
	};

	const handlePasswordReset = async () => {
		setPasswordResetLoading(true);
		const { error } = await client.auth.resetPasswordForEmail(resetEmail, {
			redirectTo: window.location.origin + '/recover',
		});

		if (error) {
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
			setPasswordResetLoading(false);
		} else {
			enqueueSnackbar(`Reset link sent to: ${resetEmail}`, {
				variant: 'success',
			});

			setForgotDialogOpen(false);
			setPasswordResetLoading(false);
		}

		setResetEmail('');
	};

	return (
		<>
			<div className='flex min-h-dvh'>
				{/* Hero image side */}
				<div className='relative hidden sm:block sm:w-1/3 md:w-7/12'>
					<div className='absolute inset-0 bg-cover bg-center' style={{ backgroundImage: 'url(/images/signin/' + randomImage + '.jpg)' }} />
					<div className='absolute inset-0 bg-gradient-to-tr from-primary/50 via-primary/10 to-transparent' />
				</div>

				{/* Form side */}
				<div className='flex w-full flex-col items-center bg-card px-6 py-12 sm:w-2/3 md:w-5/12'>
					<span className='flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground'>
						<Lock className='size-5' />
					</span>
					<h1 className='mt-3 text-2xl font-semibold tracking-tight'>Sign in</h1>

					<div className='mt-4 flex w-full max-w-sm flex-col gap-4'>
						<div className='flex justify-center'>
							<button
								type='button'
								onClick={() => signInWithGoogle(redirectTo ?? '/')}
								disabled={window.location.host !== 'giftamizer.com'}
								className='flex size-11 cursor-pointer items-center justify-center rounded-full border border-border transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none'
							>
								<GoogleIcon className='size-6' style={window.location.host !== 'giftamizer.com' ? { opacity: 0.15 } : undefined} />
							</button>
						</div>

						<FormField label='Email Address' required htmlFor='email'>
							<Input
								id='email'
								name='email'
								autoComplete='email'
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSubmit();
								}}
							/>
						</FormField>

						<FormField label='Password' required htmlFor='password'>
							<Input
								id='password'
								name='password'
								type='password'
								autoComplete='password'
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSubmit();
								}}
							/>
						</FormField>

						<Button className='w-full' onClick={() => handleSubmit()}>
							Sign in
						</Button>

						<div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
							<button
								type='button'
								className='cursor-pointer text-primary underline-offset-4 hover:underline'
								onClick={() => {
									setForgotDialogOpen(true);
								}}
							>
								Forgot password?
							</button>

							<Link to={`/signup${window.location.search}${window.location.hash}`} className='text-primary underline-offset-4 hover:underline'>
								Don't have an account? Create Account
							</Link>
						</div>
					</div>
				</div>
			</div>

			<Dialog
				open={forgotDialogOpen}
				onOpenChange={(next) => {
					if (!next) {
						setForgotDialogOpen(false);
						setResetEmail('');
					}
				}}
			>
				<DialogContent size='sm'>
					<DialogHeader>
						<DialogTitle>Forgot Password</DialogTitle>
						<DialogDescription>Tell us the email address associated with your Giftamizer account, and we'll send you an email with a link to reset your password.</DialogDescription>
					</DialogHeader>

					<FormField label='Email Address'>
						<Input autoFocus type='email' value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
					</FormField>

					<DialogFooter>
						<Button
							variant='ghost'
							onClick={() => {
								setForgotDialogOpen(false);
								setResetEmail('');
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								handlePasswordReset();
							}}
							disabled={!validateEmail(resetEmail)}
							loading={passwordResetLoading}
						>
							Send Reset
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
