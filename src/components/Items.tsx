import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import Button from '@mui/material/Button';

import Container from '@mui/material/Container';

import Copyright from '../pages/Copyright';

import { supabase } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

function Gift() {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	return (
		<div style={{ flexGrow: 1 }}>
			<Container style={{ paddingTop: isMobile ? 20 : 80, marginBottom: 96 }}>
				<>
					<Button
						variant='contained'
						onClick={() => {
							supabase.auth.signOut();
						}}
					>
						Logout
					</Button>
					<br />
					<Button component={Link} to='/' variant='contained'>
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
						}}
					>
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
