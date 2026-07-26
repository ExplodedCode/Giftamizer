import * as React from 'react';

import { useNavigate } from 'react-router-dom';

import { supabase } from '../lib/useSupabase';
import { useSnackbar } from '../lib/snackbar';

import { Lock } from 'lucide-react';

import { Button } from '../components/ui/button';
import { FormField } from '../components/ui/form-field';
import { Input } from '../components/ui/input';

var randomImage = Math.floor(Math.random() * 10) + 1;

export default function UpdatePassword() {
	const { enqueueSnackbar } = useSnackbar();

	const [password, setPassword] = React.useState('');

	let navigate = useNavigate();

	const handleSubmit = async () => {
		const { error } = await supabase.auth.updateUser({
			password: password,
		});

		if (error) {
			console.log(error);
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		} else {
			navigate('/gift');
		}
	};

	return (
		<div className='flex min-h-dvh'>
			{/* Hero image side */}
			<div className='relative hidden sm:block sm:w-1/3 md:w-7/12'>
				<div className='absolute inset-0 bg-cover bg-center' style={{ backgroundImage: 'url(/images/signin/' + randomImage + '.jpg)' }} />
				<div className='absolute inset-0 bg-gradient-to-tr from-primary/50 via-primary/10 to-transparent' />
			</div>

			{/* Form side */}
			<div className='flex w-full flex-col items-center bg-card px-6 py-16 sm:w-2/3 md:w-5/12'>
				<span className='flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground'>
					<Lock className='size-5' />
				</span>
				<h1 className='mt-3 text-2xl font-semibold tracking-tight'>Set a New Password</h1>

				<div className='mt-6 flex w-full max-w-sm flex-col gap-4'>
					<FormField label='Password' required htmlFor='password'>
						<Input id='password' name='password' type='password' autoComplete='password' required value={password} onChange={(e) => setPassword(e.target.value)} />
					</FormField>

					<Button className='w-full' onClick={() => handleSubmit()} disabled={password.length < 8}>
						Reset Password
					</Button>
				</div>
			</div>
		</div>
	);
}
