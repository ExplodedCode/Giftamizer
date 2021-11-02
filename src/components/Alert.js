import React from 'react';

import MuiAlert from '@mui/material/Alert';

export default function Alert(props) {
	return <MuiAlert elevation={6} variant='filled' {...props} />;
}
