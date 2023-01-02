import React from 'react';

import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';

import { green, red, blue, orange } from '@mui/material/colors';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Copyright from '../pages/Copyright';

import { supabase } from '../lib/useSupabase';
import { SnackbarAlert } from '../types';
import { useSnackbar } from 'notistack';

function Gift() {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	return (
		<div style={{ flexGrow: 1 }}>
			<AppBar position='static' color='primary' enableColorOnDark>
				<Toolbar>
					<Typography variant='h5' style={{ flexGrow: 1 }}>
						Giftamizer
					</Typography>
					<Button component={Link} to='/signin' color='inherit'>
						Sign In
					</Button>
				</Toolbar>
			</AppBar>

			<Container style={{ paddingTop: isMobile ? 20 : 80, marginBottom: 96 }}>
				<>
					<Button
						variant='contained'
						onClick={() => {
							supabase.auth.signOut();
						}}>
						Logout
					</Button>
					<br />
					<Button
						component={Link}
						to='/gift'
						variant='contained'
						onClick={() => {
							supabase.auth.signOut();
						}}>
						Gifts
					</Button>
					<br />
					<Button
						variant='contained'
						onClick={() => {
							enqueueSnackbar('Test toast', {
								variant: 'error',
								action: (key) => (
									<>
										<Button onClick={() => closeSnackbar(key)}>test</Button>
									</>
								),
							});
						}}>
						toast
					</Button>
				</>
				<br />
				<br />
				<br />
				<Copyright />
			</Container>
		</div>
	);
}

export default Gift;
