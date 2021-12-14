import * as React from 'react';

import { signInWithSocial, supabase } from '../lib/api';
import { OAuthResponse } from '@supabase/supabase-js';
import { SnackbarAlert } from '../types';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';

import { GoogleIcon, FacebookIcon } from '../components/SvgIcons';

var randomImage = Math.floor(Math.random() * 10) + 1;

export default function SignUp() {
	const [name, setName] = React.useState('');
	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');

	const signInWithGoogle = async () => {
		const response: OAuthResponse = await signInWithSocial('google');

		console.log(response);
	};

	const signInWithFacebook = async () => {
		const response: OAuthResponse = await signInWithSocial('facebook');

		console.log(response);
	};

	const handleSubmit = async () => {
		const { data, error } = await supabase.auth.signUp({
			email: email,
			password: password,
			options: {
				data: {
					name: name,
				},
			},
		});
		console.log('signUp', data, error);

		if (error) {
			window.ReactAPI.emit('alert', {
				text: error.message,
				options: {
					variant: 'error',
				},
			} as SnackbarAlert);
		}
	};

	return (
		<Grid container component='main' sx={{ height: '100vh' }}>
			<CssBaseline />
			<Grid
				item
				xs={false}
				sm={4}
				md={7}
				sx={{
					backgroundImage: 'url(/images/signin/' + randomImage + '.jpg)',
					backgroundRepeat: 'no-repeat',
					backgroundColor: (t) => (t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900]),
					backgroundSize: 'cover',
					backgroundPosition: 'center',
				}}
			/>
			<Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
				<Box
					sx={{
						my: 8,
						mx: 4,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					}}
				>
					<Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
						<LockOutlinedIcon />
					</Avatar>
					<Typography component='h1' variant='h5'>
						Create your Giftamizer Account
					</Typography>

					<Box sx={{ mt: 1, maxWidth: 500 }}>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
							}}
						>
							<Stack spacing={2} direction='row'>
								<IconButton onClick={() => signInWithGoogle()}>
									<GoogleIcon />
								</IconButton>
								<IconButton onClick={() => signInWithFacebook()}>
									<FacebookIcon />
								</IconButton>
							</Stack>
						</Box>
						<TextField margin='normal' required fullWidth id='name' label='Full Name' name='name' autoComplete='name' autoFocus value={name} onChange={(e) => setName(e.target.value)} />
						<TextField margin='normal' required fullWidth id='email' label='Email Address' name='email' autoComplete='email' value={email} onChange={(e) => setEmail(e.target.value)} />
						<TextField
							margin='normal'
							required
							fullWidth
							name='password'
							label='Password'
							type='password'
							id='password'
							autoComplete='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<Button fullWidth variant='contained' sx={{ mt: 3, mb: 2 }} onClick={() => handleSubmit()}>
							Create Account
						</Button>
						<Grid container>
							<Grid item>
								<Link href='/signin' variant='body2'>
									{'Already have an account? Login'}
								</Link>
							</Grid>
						</Grid>
					</Box>
				</Box>
			</Grid>
		</Grid>
	);
}
