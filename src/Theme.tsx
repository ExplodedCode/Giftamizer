import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Routes from './Routes';

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

	const devTheme = React.useMemo(
		() =>
			createTheme({
				palette: {
					mode: prefersDarkMode ? 'dark' : 'light',
					primary: {
						light: '#8561c5',
						main: '#673ab7',
						dark: '#482880',
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
			<ThemeProvider theme={window.location.host === 'giftamizer.com' ? theme : devTheme}>
				<CssBaseline />
				<Routes />
			</ThemeProvider>
		</Router>
	);
}
