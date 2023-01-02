import * as React from 'react';

import { useNavigate } from 'react-router-dom';

import { supabase } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

var randomImage = Math.floor(Math.random() * 10) + 1;

export default function UpdatePassword() {
	const { enqueueSnackbar } = useSnackbar();

	const [password, setPassword] = React.useState('');

	let navigate = useNavigate();

	const handleSubmit = async () => {
		const { data, error } = await supabase.auth.updateUser({
			password: password,
		});
		console.log('resetPassword', data, error);

		if (error) {
			enqueueSnackbar( error.message,
				 {
					variant: 'error',
				});
		} else {
			navigate('/gift');
		}
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
							<LockOutlinedIcon />
						</Avatar>
						<Typography component='h1' variant='h5'>
							Set a New Password
						</Typography>

						<Box sx={{ mt: 1, maxWidth: 500 }}>
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
							<Button fullWidth variant='contained' sx={{ mt: 3, mb: 2 }} onClick={() => handleSubmit()} disabled={password.length < 8}>
								Reset Password
							</Button>
						</Box>
					</Box>
				</Grid>
			</Grid>
		</>
	);
}
