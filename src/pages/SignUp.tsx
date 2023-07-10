import * as React from 'react';

import { Link } from 'react-router-dom';

import { signInWithFacebook, signInWithGoogle, useSupabase, validateEmail } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { GoogleIcon, FacebookIcon } from '../components/SvgIcons';
import { Grid, CssBaseline, Paper, Box, Avatar, Typography, Stack, IconButton, TextField, Button, Stepper, Step, StepLabel, Link as MUILink } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

var randomImage = Math.floor(Math.random() * 10) + 1;

const steps = ['Account', 'Profile', 'Confirm'];

export default function SignUp() {
	const { client } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const [activeStep, setActiveStep] = React.useState(0);
	const [canProceed, setCanProceed] = React.useState(false);

	const [firstName, setFirstName] = React.useState('');
	const [lastName, setLastName] = React.useState('');
	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');

	const handleSubmit = async () => {
		const { error } = await client.auth.signUp({
			email: email,
			password: password,
			options: {
				data: {
					email: email,
					first_name: firstName,
					last_name: lastName,
				},
			},
		});

		if (error) {
			console.log(error);

			enqueueSnackbar(error.message, {
				variant: 'error',
			});
		}
	};

	React.useEffect(() => {
		switch (activeStep) {
			case 0:
				setCanProceed(validateEmail(email) && password.length > 8);
				break;
			case 1:
				setCanProceed(firstName.length > 0 && lastName.length > 0);
				break;
			case 2:
				setCanProceed(true);
				break;
			default:
				setCanProceed(false);

				break;
		}
	}, [activeStep, firstName, lastName, email, password]);

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
						py: 8,
						px: 4,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						height: '100%',
					}}
				>
					<Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
						<LockOutlined />
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
								<IconButton onClick={signInWithGoogle}>
									<GoogleIcon />
								</IconButton>
								<IconButton onClick={signInWithFacebook}>
									<FacebookIcon />
								</IconButton>
							</Stack>
						</Box>

						<Stepper activeStep={activeStep} sx={{ mt: 2 }}>
							{steps.map((label, index) => {
								const stepProps: { completed?: boolean } = {};
								const labelProps: {
									optional?: React.ReactNode;
								} = {};

								return (
									<Step key={label} {...stepProps}>
										<StepLabel {...labelProps}>{label}</StepLabel>
									</Step>
								);
							})}
						</Stepper>

						{activeStep === 0 && (
							<>
								<TextField
									margin='normal'
									required
									fullWidth
									id='email'
									label='Email Address'
									name='email'
									autoComplete='email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
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
							</>
						)}
						{activeStep === 1 && (
							<>
								<TextField
									margin='normal'
									required
									fullWidth
									id='fname'
									label='First Name'
									name='fname'
									autoComplete='fname'
									autoFocus
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
								/>
								<TextField
									margin='normal'
									required
									fullWidth
									id='lname'
									label='Last Name'
									name='lname'
									autoComplete='lname'
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
								/>
							</>
						)}
						{activeStep === 2 && (
							<>
								<TextField margin='normal' required fullWidth id='email' label='Email Address' value={email} disabled />
								<TextField margin='normal' fullWidth label='First Name' value={firstName} disabled />
								<TextField margin='normal' fullWidth label='Last Name' value={lastName} disabled />
							</>
						)}

						<Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, pb: 2 }}>
							<Button color='inherit' disabled={activeStep === 0} onClick={() => setActiveStep(activeStep - 1)} sx={{ mr: 1 }}>
								Back
							</Button>
							<Box sx={{ flex: '1 1 auto' }} />
							<Button variant='contained' onClick={() => (activeStep === 2 ? handleSubmit() : setActiveStep(activeStep + 1))} disabled={!canProceed}>
								{activeStep === 2 ? 'Create Account' : 'Continue'}
							</Button>
						</Box>

						<Grid container>
							<Grid item>
								<MUILink component={Link} to='/signin' variant='body2'>
									{'Already have an account? Login'}
								</MUILink>
							</Grid>
						</Grid>
					</Box>
					<Box sx={{ marginTop: 'auto' }}>
						<Typography variant='subtitle2' color='GrayText'>
							By clicking continue you agree to our{' '}
							<MUILink component={Link} to='/terms' color='inherit'>
								Terms of Service
							</MUILink>{' '}
							and you acknowledge you have read our{' '}
							<MUILink component={Link} to='/policy' color='inherit'>
								Privacy Policy
							</MUILink>
							. You also consent to receive marketing emails and/or emails relating to your account activity. If you choose not to consent disable notifications in your user profile.
						</Typography>
					</Box>
				</Box>
			</Grid>
		</Grid>
	);
}
