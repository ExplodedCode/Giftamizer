import React, { useState } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import { Link as domLink } from 'react-router-dom';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { resetPassword } from '../../firebase/auth';

import Alert from '../Alert';
import Snackbar from '@material-ui/core/Snackbar';

function Copyright() {
	return (
		<Typography variant='body2' color='textSecondary' align='center'>
			{'Copyright © '}
			<Link color='inherit' href='https://giftamizer.com/'>
				Giftamizer
			</Link>{' '}
			{new Date().getFullYear()}
			{'.'}
		</Typography>
	);
}

const useStyles = makeStyles((theme) => ({
	root: {
		height: '100vh',
	},
	image: {
		backgroundImage: 'url(/images/signin/' + (Math.floor(Math.random() * 10) + 1) + '.jpg)',
		backgroundRepeat: 'no-repeat',
		backgroundColor: theme.palette.type === 'light' ? theme.palette.grey[50] : theme.palette.grey[900],
		backgroundSize: 'cover',
		backgroundPosition: 'center',
	},
	paper: {
		margin: theme.spacing(8, 4),
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
	},
	avatar: {
		margin: theme.spacing(1),
		backgroundColor: theme.palette.primary.main,
	},
	form: {
		width: '100%', // Fix IE 11 issue.
		marginTop: theme.spacing(1),
	},
	submit: {
		margin: theme.spacing(3, 0, 2),
	},
}));

export default function SignInSide() {
	const classes = useStyles();

	const [email, setEmail] = useState('');

	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	return (
		<Grid container component='main' className={classes.root}>
			<CssBaseline />
			<Grid item xs={false} sm={4} md={7} className={classes.image} />
			<Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
				<div className={classes.paper}>
					<Avatar className={classes.avatar}>
						<LockOutlinedIcon />
					</Avatar>
					<Typography component='h1' variant='h5'>
						Forgot Password
					</Typography>
					<TextField
						variant='outlined'
						margin='normal'
						required
						fullWidth
						label='Email Address'
						autoComplete='email'
						autoFocus
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								resetPassword(email).then((result) => {
									if (result === 'ok') {
										setAlert({ open: true, message: 'Email Sent!', severity: 'success' });
									} else {
										setAlert({ open: true, message: 'Error Sending email!', severity: 'error' });
									}
								});
							}
						}}
					/>
					<Button
						type='submit'
						fullWidth
						variant='contained'
						color='primary'
						className={classes.submit}
						onClick={() => {
							resetPassword(email).then((result) => {
								if (result === 'ok') {
									setAlert({ open: true, message: 'Email Sent!', severity: 'success' });
								} else {
									setAlert({ open: true, message: 'Error Sending email!', severity: 'error' });
								}
							});
						}}
					>
						Send Email
					</Button>
					<Grid container>
						<Grid item>
							<Link component={domLink} to='/signin' variant='body2'>
								{'Back to sign in'}
							</Link>
						</Grid>
					</Grid>
					<Box mt={5}>
						<Copyright />
					</Box>
				</div>
			</Grid>
			<Snackbar open={alert.open} autoHideDuration={3500} onClose={handleClose}>
				<Alert onClose={handleClose} severity={alert.severity}>
					{alert.message}
				</Alert>
			</Snackbar>
		</Grid>
	);
}
