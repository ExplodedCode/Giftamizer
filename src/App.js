import React from 'react';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import Routes from './Routes';

export default function App() {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

	const theme = React.useMemo(
		() =>
			createMuiTheme({
				palette: {
					type: prefersDarkMode ? 'dark' : 'light',
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
		<ThemeProvider theme={theme}>
			<Routes />
		</ThemeProvider>
	);
}
