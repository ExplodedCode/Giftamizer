import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { signInWithFacebook, signInWithGoogle, useSupabase, validateEmail } from '../lib/useSupabase';

import { GoogleIcon, FacebookIcon } from '../components/SvgIcons';
import {
	Grid,
	CssBaseline,
	Paper,
	Box,
	Avatar,
	Typography,
	Stack,
	IconButton,
	TextField,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Link as MUILink,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

var randomImage = Math.floor(Math.random() * 10) + 1;

export default function SignIn() {
	const { client, setUser } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();
	let [searchParams] = useSearchParams();

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
		if (window.location.hostname.split('.').length === 2) {
			const { error: firebaseAuthError } = await client.functions.invoke('firebase-auth', {
				body: {
					email: email,
					password: password,
				},
			});
			if (firebaseAuthError) {
				console.log(firebaseAuthError);
				enqueueSnackbar(String(firebaseAuthError.message), {
					variant: 'error',
				});
			}
		}

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
							<LockOutlined />
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
								}}
							>
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
									<MUILink
										component='button'
										variant='body2'
										onClick={() => {
											setForgotDialogOpen(true);
										}}
									>
										Forgot password?
									</MUILink>
								</Grid>
								<Grid item>
									<MUILink component={Link} to='/signup' variant='body2'>
										Don't have an account? Create Account
									</MUILink>
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
				}}
			>
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
						color='inherit'
					>
						Cancel
					</Button>
					<LoadingButton
						onClick={() => {
							handlePasswordReset();
						}}
						disabled={!validateEmail(resetEmail)}
						loading={passwordResetLoading}
					>
						Send Reset
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</>
	);
}
