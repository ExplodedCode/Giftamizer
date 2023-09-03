import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AppBar, Toolbar, Grid, Typography, Box, Tab, Tabs, LinearProgress, CircularProgress } from '@mui/material';
import { useGetUser } from '../../../lib/useSupabase';
import Profile from './Profile';
import Items from './Items';
import Lists from './Lists';

interface TabPanelProps {
	children?: React.ReactNode;
	index: string;
	value: string;
}
function CustomTabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role='tabpanel' hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
			{value === index && <Box>{children}</Box>}
		</div>
	);
}

export default function Users() {
	const navigate = useNavigate();
	const { user_id, tab } = useParams();

	const { data: profile, isLoading: loadingProfile } = useGetUser(user_id!);

	return (
		<>
			<AppBar component='div' color='primary' position='static' enableColorOnDark elevation={0} sx={{ zIndex: 0 }}>
				<Toolbar>
					<Grid container alignItems='center' spacing={1}>
						<Grid item xs>
							{loadingProfile ? (
								<LinearProgress color='inherit' />
							) : (
								<Typography color='inherit' variant='h5' component='h1'>
									{profile?.first_name} {profile?.last_name}
								</Typography>
							)}
						</Grid>
					</Grid>
				</Toolbar>
			</AppBar>
			<AppBar component='div' position='static' enableColorOnDark elevation={0} sx={{ zIndex: 0 }}>
				<Tabs value={tab ?? ''} textColor='inherit' onChange={(e, v) => navigate(`/users/${user_id}/${v}`)}>
					<Tab value='' label='Profile' />
					<Tab value='items' label='Items' />
					<Tab value='lists' label='Lists' />
					<Tab value='groups' label='Groups' />
					<Tab value='roles' label='Roles' />
				</Tabs>
			</AppBar>

			<Box component='main' sx={{ flex: 1, py: { xs: 1, sm: 4, md: 6 }, px: { xs: 1, sm: 2, md: 4 } }}>
				{loadingProfile ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
						<CircularProgress />
					</Box>
				) : (
					<>
						<CustomTabPanel value={tab ?? ''} index=''>
							<Profile profile={profile!} />
						</CustomTabPanel>
						<CustomTabPanel value={tab ?? ''} index='items'>
							<Items />
						</CustomTabPanel>
						<CustomTabPanel value={tab ?? ''} index='lists'>
							<Lists />
						</CustomTabPanel>
						<CustomTabPanel value={tab ?? ''} index='groups'>
							Groups
						</CustomTabPanel>
						<CustomTabPanel value={tab ?? ''} index='roles'>
							roles
						</CustomTabPanel>
					</>
				)}
			</Box>
		</>
	);
}
