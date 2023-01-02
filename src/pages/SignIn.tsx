import * as React from 'react';

import { signInWithFacebook, signInWithGoogle, useSupabase, validateEmail } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

var randomImage = Math.floor(Math.random() * 10) + 1;

export default function SignIn() {
	const { client } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');

	const [forgotDialogOpen, setForgotDialogOpen] = React.useState(false);
	const [resetEmail, setResetEmail] = React.useState('');

	const handleSubmit = async () => {
		const { error: firebaseAuthError } = await client.functions.invoke('firebase/validateAuth', {
			body: {
				email: email,
				password: password,
			},
		});
		if (firebaseAuthError) {
			enqueueSnackbar(String(firebaseAuthError.message), {
				variant: 'error',
			});
		}

		console.log('done');
		const { data, error } = await client.auth.signInWithPassword({
			email: email,
			password: password,
		});

		console.log('signin', data, error);

		if (error) {
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		}
	};

	const handlePasswordReset = async () => {
		const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
			redirectTo: window.location.origin + '/update-password',
		});
		console.log('handlePasswordReset', data, error);

		if (error) {
			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		} else {
			enqueueSnackbar(`Reset link sent to: ${resetEmail}`, {
				variant: 'success',
			});
		}

		setResetEmail('');
	};

	return (
		<>
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
						}}>
						<Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
							<LockOutlinedIcon />
						</Avatar>
						<Typography component='h1' variant='h5'>
							Sign in
						</Typography>

						<Box sx={{ mt: 1, maxWidth: 500 }}>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
								}}>
								<Stack spacing={2} direction='row'>
									<IconButton onClick={signInWithGoogle}>
										<GoogleIcon />
									</IconButton>
									<IconButton onClick={signInWithFacebook}>
										<FacebookIcon />
									</IconButton>
								</Stack>
							</Box>
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
								Sign in
							</Button>
							<Grid container>
								<Grid item xs>
									<Link
										component='button'
										variant='body2'
										onClick={() => {
											setForgotDialogOpen(true);
										}}>
										Forgot password?
									</Link>
								</Grid>
								<Grid item>
									<Link href='/signup' variant='body2'>
										{"Don't have an account? Create Account"}
									</Link>
								</Grid>
							</Grid>
						</Box>
					</Box>
				</Grid>
			</Grid>

			<Dialog
				open={forgotDialogOpen}
				onClose={() => {
					setForgotDialogOpen(false);
					setResetEmail('');
				}}>
				<DialogTitle>Forgot Password</DialogTitle>
				<DialogContent>
					<DialogContentText>Tell us the email address associated with your Giftamizer account, and we'll send you an email with a link to reset your password.</DialogContentText>
					<TextField autoFocus margin='dense' id='name' label='Email Address' type='email' fullWidth variant='standard' value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setForgotDialogOpen(false);
							setResetEmail('');
						}}
						color='inherit'>
						Cancel
					</Button>
					<Button
						onClick={() => {
							handlePasswordReset();
							setForgotDialogOpen(false);
						}}
						disabled={!validateEmail(resetEmail)}>
						Send Reset
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
