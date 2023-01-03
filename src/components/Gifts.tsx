import { Link } from 'react-router-dom';

import Button from '@mui/material/Button';

import Copyright from '../pages/Copyright';

import { supabase } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';
import { useSupabase } from '../lib/useSupabase';
import { Stack } from '@mui/material';

function Gift() {
	const { profile } = useSupabase();

	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	return (
		<>
			{profile.name}
			<Stack direction='row' spacing={2} mt={4} mb={8}>
				<Button
					variant='contained'
					onClick={() => {
						supabase.auth.signOut();
					}}
				>
					Logout
				</Button>
				<Button component={Link} to='/items' variant='contained'>
					Items
				</Button>
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
					Send test toast
				</Button>
			</Stack>
			<Copyright />
		</>
	);
}

export default Gift;
