import React from 'react';
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
						Sign up
					</Typography>
					<Grid container spacing={2} style={{ marginTop: 8 }}>
						<Grid item xs={12} sm={6}>
							<TextField autoComplete='fname' name='firstName' variant='outlined' required fullWidth id='firstName' label='First Name' autoFocus />
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField variant='outlined' required fullWidth id='lastName' label='Last Name' name='lastName' autoComplete='lname' />
						</Grid>
						<Grid item xs={12}>
							<TextField variant='outlined' required fullWidth id='email' label='Email Address' name='email' autoComplete='email' />
						</Grid>
						<Grid item xs={12}>
							<TextField variant='outlined' required fullWidth name='password' label='Password' type='password' id='password' autoComplete='current-password' />
						</Grid>
						{/* <Grid item xs={12}>
							<FormControlLabel control={<Checkbox value='allowExtraEmails' color='primary' />} label='I want to receive inspiration, marketing promotions and updates via email.' />
						</Grid> */}
					</Grid>
					<Button type='submit' fullWidth variant='contained' color='primary' className={classes.submit}>
						Sign Up
					</Button>
					<Grid container justify='flex-end'>
						<Grid item>
							<Link component={domLink} to='/signin' variant='body2'>
								Already have an account? Sign in
							</Link>
						</Grid>
					</Grid>
				</div>
			</Grid>
		</Grid>
	);
}
