import { Link } from 'react-router-dom';
import { useSupabase } from '../lib/useSupabase';

import { Typography, Link as MUILink } from '@mui/material';

export default function NotFound() {
	const { user } = useSupabase();

	return (
		<>
			{user ? (
				<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
					Page not found!
				</Typography>
			) : (
				<>
					<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
						Page not found!
					</Typography>

					<Typography variant='body1' style={{ textAlign: 'center' }}>
						<MUILink component={Link} to='/groups'>
							Go Back
						</MUILink>
					</Typography>
				</>
			)}
		</>
	);
}
