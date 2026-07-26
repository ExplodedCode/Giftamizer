import * as React from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import { signInWithGoogle, useSupabase, validateEmail } from '../lib/useSupabase';
import { useSnackbar } from '../lib/snackbar';

import { Lock } from 'lucide-react';

import { GoogleIcon } from '../components/SvgIcons';
import { Button } from '../components/ui/button';
import { FormField } from '../components/ui/form-field';
import { Input } from '../components/ui/input';
import { Stepper } from '../components/ui/stepper';

var randomImage = Math.floor(Math.random() * 10) + 1;

const steps = ['Account', 'Profile', 'Confirm'];

export default function SignUp() {
	const { client, setUser } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();
	const buttonRef = React.useRef<HTMLButtonElement>(null);
	let [searchParams] = useSearchParams();

	const redirectTo = searchParams.get('redirectTo');

	const [activeStep, setActiveStep] = React.useState(0);
	const [canProceed, setCanProceed] = React.useState(false);

	const [firstName, setFirstName] = React.useState('');
	const [lastName, setLastName] = React.useState('');
	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');

	const handleSubmit = async () => {
		const { error, data } = await client.auth.signUp({
			email: email.trim(),
			password: password,
			options: {
				data: {
					email: email.trim(),
					first_name: firstName.trim(),
					last_name: lastName.trim(),
				},
			},
		});

		if (data.user && setUser) {
			setUser(data.user);
		}

		if (error) {
			console.error(error);
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		}
	};

	React.useEffect(() => {
		switch (activeStep) {
			case 0:
				setCanProceed(validateEmail(email.trim()) && password.length > 8);
				break;
			case 1:
				setCanProceed(firstName.trim().length > 0 && lastName.trim().length > 0);
				break;
			case 2:
				setCanProceed(true);
				break;
			default:
				setCanProceed(false);
				break;
		}
	}, [activeStep, firstName, lastName, email, password]);

	const enterAdvances = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && buttonRef.current) buttonRef.current.click();
	};

	return (
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
				<h1 className='mt-3 text-center text-2xl font-semibold tracking-tight'>Create your Giftamizer Account</h1>

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

					<Stepper steps={steps} activeStep={activeStep} className='my-2' />

					{activeStep === 0 && (
						<>
							<FormField label='Email Address' required htmlFor='email'>
								<Input id='email' name='email' autoComplete='email' autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={enterAdvances} />
							</FormField>
							<FormField label='Password' required htmlFor='password'>
								<Input id='password' name='password' type='password' autoComplete='password' required value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={enterAdvances} />
							</FormField>
						</>
					)}
					{activeStep === 1 && (
						<>
							<FormField label='First Name' required htmlFor='fname'>
								<Input id='fname' name='fname' autoComplete='fname' autoFocus required value={firstName} onChange={(e) => setFirstName(e.target.value)} onKeyDown={enterAdvances} />
							</FormField>
							<FormField label='Last Name' required htmlFor='lname'>
								<Input id='lname' name='lname' autoComplete='lname' required value={lastName} onChange={(e) => setLastName(e.target.value)} onKeyDown={enterAdvances} />
							</FormField>
						</>
					)}
					{activeStep === 2 && (
						<>
							<FormField label='Email Address' required>
								<Input value={email} disabled />
							</FormField>
							<FormField label='First Name'>
								<Input value={firstName} disabled />
							</FormField>
							<FormField label='Last Name'>
								<Input value={lastName} disabled />
							</FormField>
						</>
					)}

					<div className='flex items-center justify-between pt-2'>
						<Button variant='ghost' disabled={activeStep === 0} onClick={() => setActiveStep(activeStep - 1)}>
							Back
						</Button>
						<Button onClick={() => (activeStep === 2 ? handleSubmit() : setActiveStep(activeStep + 1))} disabled={!canProceed} ref={buttonRef}>
							{activeStep === 2 ? 'Create Account' : 'Continue'}
						</Button>
					</div>

					<Link to={`/signin${window.location.search}${window.location.hash}`} className='text-sm text-primary underline-offset-4 hover:underline'>
						Already have an account? Login
					</Link>
				</div>

				<p className='mt-auto max-w-md pt-8 text-xs text-muted-foreground'>
					By clicking continue you agree to our{' '}
					<Link to='/terms' className='underline underline-offset-4 hover:text-foreground'>
						Terms of Service
					</Link>{' '}
					and you acknowledge you have read our{' '}
					<Link to='/policy' className='underline underline-offset-4 hover:text-foreground'>
						Privacy Policy
					</Link>
					. You also consent to receive marketing emails and/or emails relating to your account activity. If you choose not to consent disable email notifications in your user profile.
				</p>
			</div>
		</div>
	);
}
