import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ThemeProvider, StyledEngineProvider, createTheme, adaptV4Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Routes from './Routes';

export default function App() {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

	const theme = React.useMemo(
		() =>
			createTheme(adaptV4Theme({
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
			})),
		[prefersDarkMode]
	);

	return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Routes />
            </ThemeProvider>
        </StyledEngineProvider>
    );
}
