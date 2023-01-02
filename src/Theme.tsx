import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { SnackbarAction, useSnackbar } from 'notistack';

import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import Routes from './Routes';
import { SnackbarAlert } from './types';

export default function Theme() {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

	const theme = React.useMemo(
		() =>
			createTheme({
				palette: {
					mode: prefersDarkMode ? 'dark' : 'light',
					primary: {
						light: '#6fbf73',
						main: '#4caf50',
						dark: '#357a38',
						contrastText: '#fff',
					},
					secondary: {
						light: '#f6685e',
						main: '#f44336',
						dark: '#aa2e25',
						contrastText: '#fff',
					},
				},
			}),
		[prefersDarkMode]
	);

	return (
		<Router>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Routes />
			</ThemeProvider>
		</Router>
	);
}
