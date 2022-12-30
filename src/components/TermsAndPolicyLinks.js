import React from 'react';

import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

export default function Copyright() {
	return (
		<Typography variant='body2' color='textSecondary' align='center'>
			<Link color='inherit' href='https://giftamizer.com/terms'>
				Terms
			</Link>
			{' - '}
			<Link color='inherit' href='https://giftamizer.com/policy'>
				Policy
			</Link>
		</Typography>
	);
}
