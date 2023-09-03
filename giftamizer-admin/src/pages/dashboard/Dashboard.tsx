import * as React from 'react';

import { AppBar, Box, Container, Grid, Paper, Tab, Tabs, Toolbar, Typography } from '@mui/material';

import SignupsChart from './SignupsChart';
import UserCount from './UserCount';
import RecentItems from './RecentItems';
import ItemCount from './ItemCount';
import GroupCount from './GroupCount';
import PendingInvitesCount from './PendingInvitesCount';

export default function Dashboard() {
	return (
		<>
			<AppBar component='div' color='primary' position='static' enableColorOnDark elevation={0} sx={{ zIndex: 0 }}>
				<Toolbar>
					<Grid container alignItems='center' spacing={1}>
						<Grid item xs>
							<Typography color='inherit' variant='h5' component='h1'>
								Dashboard
							</Typography>
						</Grid>
					</Grid>
				</Toolbar>
			</AppBar>

			<AppBar component='div' position='static' enableColorOnDark elevation={0} sx={{ zIndex: 0 }}>
				<Tabs value={0} textColor='inherit'>
					<Tab label='Stats' />
				</Tabs>
			</AppBar>

			<Box component='main' sx={{ flex: 1, py: { xs: 0, sm: 4, md: 6 }, px: { xs: 0, sm: 2, md: 4 } }}>
				<Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
					<Grid container spacing={{ xs: 2, sm: 3 }}>
						{/* User Count */}
						<Grid item xs={12} md={6} lg={3}>
							<Paper
								sx={{
									p: 2,
									display: 'flex',
									flexDirection: 'column',
									height: 180,
								}}
							>
								<UserCount />
							</Paper>
						</Grid>
						{/* Item Count */}
						<Grid item xs={12} md={6} lg={3}>
							<Paper
								sx={{
									p: 2,
									display: 'flex',
									flexDirection: 'column',
									height: 180,
								}}
							>
								<ItemCount />
							</Paper>
						</Grid>
						{/* Group Count */}
						<Grid item xs={12} md={6} lg={3}>
							<Paper
								sx={{
									p: 2,
									display: 'flex',
									flexDirection: 'column',
									height: 180,
								}}
							>
								<GroupCount />
							</Paper>
						</Grid>
						{/* User Count */}
						<Grid item xs={12} md={6} lg={3}>
							<Paper
								sx={{
									p: 2,
									display: 'flex',
									flexDirection: 'column',
									height: 180,
								}}
							>
								<PendingInvitesCount />
							</Paper>
						</Grid>
						{/* Signups Chart */}
						<Grid item xs={12}>
							<Paper
								sx={{
									p: 2,
									display: 'flex',
									flexDirection: 'column',
									height: 320,
								}}
							>
								<SignupsChart />
							</Paper>
						</Grid>
						{/* Recent Items */}
						<Grid item xs={12}>
							<Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
								<RecentItems />
							</Paper>
						</Grid>
					</Grid>
				</Container>
			</Box>
		</>
	);
}
