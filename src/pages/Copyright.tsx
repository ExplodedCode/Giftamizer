import { Link } from 'react-router-dom';

import { Link as MUILink } from '@mui/material';
import Typography from '@mui/material/Typography';

export default function Copyright() {
	return (
		<>
			<Typography variant='body2' color='textSecondary' align='center'>
				{'Copyright © '}
				<MUILink component={Link} to='/' color='inherit'>
					Giftamizer
				</MUILink>{' '}
				{new Date().getFullYear()}
				{'.'}
			</Typography>

			<br />

			<Typography variant='body2' color='textSecondary' align='center'>
				<MUILink component={Link} to='/terms' color='inherit'>
					Terms
				</MUILink>
				{' - '}
				<MUILink component={Link} to='/policy' color='inherit'>
					Policy
				</MUILink>
				{' - '}
				<MUILink href='https://github.com/ExplodedCode/Giftamizer/issues' target='_blank' color='inherit'>
					Support
				</MUILink>
			</Typography>
		</>
	);
}
