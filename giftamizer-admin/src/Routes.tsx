import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';

import { Box, Link as MUILink, Typography } from '@mui/material';

import Dashboard from './pages/dashboard';

import Users from './pages/users';
import User from './pages/users/user';

import Items from './pages/items';
import Lists from './pages/lists';

export default function AppRoutes() {
	return (
		<Routes>
			<Route path='/' element={<Dashboard />} />

			<Route path='/users' element={<Users />} />
			<Route path='/users/:user_id/:tab?' element={<User />} />

			<Route path='/items' element={<Items />} />

			<Route path='/lists' element={<Lists />} />

			<Route
				path='*'
				element={
					<Box component='main' sx={{ flex: 1, py: 6, px: 4 }}>
						<Typography variant='h5' gutterBottom style={{ textAlign: 'center' }}>
							Page not found!
						</Typography>

						<Typography variant='body1' style={{ textAlign: 'center' }}>
							<MUILink component={Link} to='/groups'>
								Go Back
							</MUILink>
						</Typography>
					</Box>
				}
			/>
		</Routes>
	);
}
