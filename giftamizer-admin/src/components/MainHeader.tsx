import * as React from 'react';

import { AppBar, Toolbar, Grid, IconButton, Tooltip } from '@mui/material';
import { Menu, Notifications, Settings } from '@mui/icons-material';

interface HeaderProps {
	onDrawerToggle: () => void;
}

export default function MainHeader({ onDrawerToggle }: HeaderProps) {
	return (
		<AppBar color='primary' position='sticky' enableColorOnDark elevation={0}>
			<Toolbar>
				<Grid container spacing={1} alignItems='center'>
					<Grid sx={{ display: { sm: 'none', xs: 'block' } }} item>
						<IconButton color='inherit' aria-label='open drawer' onClick={onDrawerToggle} edge='start'>
							<Menu />
						</IconButton>
					</Grid>
					<Grid item xs />
					<Grid item>
						<Tooltip title='Alerts • No alerts'>
							<IconButton color='inherit'>
								<Notifications />
							</IconButton>
						</Tooltip>
					</Grid>
					<Grid item>
						<IconButton color='inherit'>
							<Settings />
						</IconButton>
					</Grid>
				</Grid>
			</Toolbar>
		</AppBar>
	);
}
