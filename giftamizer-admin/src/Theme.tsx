import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Typography, useMediaQuery, Box, Link as MUILink, CssBaseline } from '@mui/material';
import Routes from './Routes';

import Navigation from './components/Navigation';
import MainHeader from './components/MainHeader';

function Copyright() {
	return (
		<Typography variant='body2' color='text.secondary' align='center'>
			{'Copyright © '}
			<MUILink color='inherit' href='https://explodedcode.com'>
				Exploded Code
			</MUILink>{' '}
			{new Date().getFullYear()}.
		</Typography>
	);
}

const drawerWidth = 256;

export default function Theme() {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

	let theme = React.useMemo(
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
				},
				typography: {
					h5: {
						fontWeight: 500,
						fontSize: 26,
						letterSpacing: 0.5,
					},
				},
				shape: {
					borderRadius: 8,
				},
				components: {
					MuiTab: {
						defaultProps: {
							disableRipple: true,
						},
					},
				},
				mixins: {
					toolbar: {
						minHeight: 48,
					},
				},
			}),
		[prefersDarkMode]
	);

	theme = {
		...theme,
		components: {
			MuiDrawer: {
				styleOverrides: {
					paper: {
						backgroundColor: '#161c24',
					},
				},
			},
			MuiButton: {
				styleOverrides: {
					root: {
						textTransform: 'none',
					},
					contained: {
						boxShadow: 'none',
						'&:active': {
							boxShadow: 'none',
						},
					},
				},
			},
			MuiTabs: {
				styleOverrides: {
					root: {
						marginLeft: theme.spacing(1),
					},
					indicator: {
						height: 3,
						borderTopLeftRadius: 3,
						borderTopRightRadius: 3,
						backgroundColor: theme.palette.common.white,
					},
				},
			},
			MuiTab: {
				styleOverrides: {
					root: {
						textTransform: 'none',
						margin: '0 16px',
						minWidth: 0,
						padding: 0,
						[theme.breakpoints.up('md')]: {
							padding: 0,
							minWidth: 0,
						},
					},
				},
			},
			MuiIconButton: {
				styleOverrides: {
					root: {
						padding: theme.spacing(1),
					},
				},
			},
			MuiTooltip: {
				styleOverrides: {
					tooltip: {
						borderRadius: 4,
					},
				},
			},
			MuiDivider: {
				styleOverrides: {
					root: {
						backgroundColor: 'rgb(255,255,255,0.15)',
					},
				},
			},
			MuiListItemButton: {
				styleOverrides: {
					root: {
						'&.Mui-selected': {
							color: '#5be49b',
						},
					},
				},
			},
			MuiListItemText: {
				styleOverrides: {
					primary: {
						fontSize: 14,
						fontWeight: theme.typography.fontWeightMedium,
					},
				},
			},
			MuiListItemIcon: {
				styleOverrides: {
					root: {
						color: 'inherit',
						minWidth: 'auto',
						marginRight: theme.spacing(2),
						'& svg': {
							fontSize: 20,
						},
					},
				},
			},
			MuiAvatar: {
				styleOverrides: {
					root: {
						width: 32,
						height: 32,
					},
				},
			},
		},
	};

	const [mobileOpen, setMobileOpen] = React.useState(false);
	const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	return (
		<Router>
			<ThemeProvider theme={theme}>
				<Box sx={{ display: 'flex', minHeight: '100vh' }}>
					<CssBaseline />
					<Box component='nav' sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
						{isSmUp ? null : <Navigation PaperProps={{ style: { width: drawerWidth } }} variant='temporary' open={mobileOpen} onClose={handleDrawerToggle} />}
						<Navigation PaperProps={{ style: { width: drawerWidth } }} sx={{ display: { sm: 'block', xs: 'none' } }} />
					</Box>
					<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: theme.palette.mode === 'light' ? '#eaeff1' : 'inherit' }}>
						{/* dark mode bgcolor??? #001b1c */}
						<MainHeader onDrawerToggle={handleDrawerToggle} />
						<Routes />

						<Box component='footer' sx={{ p: 2 }}>
							<Copyright />
						</Box>
					</Box>
				</Box>
			</ThemeProvider>
		</Router>
	);
}
