import React from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LastLocationProvider } from 'react-router-dom-last-location';
import { useSnackbar } from 'notistack';

import { useGetProfile, useGetSystem, useSupabase } from './lib/useSupabase';

import { Backdrop, Box, CircularProgress, Link as MUILink, Typography } from '@mui/material';

import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import UpdatePassword from './pages/UpdatePassword';
import Navigation from './components/Navigation';

import Items from './pages/Items';
import Lists from './pages/Lists';
import Groups from './pages/Groups';
import Group from './pages/Group';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import Member from './pages/Member';
import ListItems from './pages/ListItems';
import { UserRoles } from './lib/useSupabase/types';

export default function AppRoutes() {
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();

	const { user } = useSupabase();

	React.useEffect(() => {
		if (location.hash.startsWith('#message=')) {
			// decodeURI(location.hash);
			enqueueSnackbar(location.hash.replace('#message=', '').replaceAll('+', ' '), {
				variant: 'info',
			});
		}
	}, [enqueueSnackbar, location.hash]);

	return (
		<>
			{user === undefined ? (
				<Backdrop sx={{ color: '#fff', zIndex: 1000 }} open={true}>
					<CircularProgress color='inherit' />
				</Backdrop>
			) : (
				<LastLocationProvider>
					<Routes>
						<Route
							path='/'
							element={
								user ? (
									<ProtectedRoute>
										<Items />
									</ProtectedRoute>
								) : (
									<Landing />
								)
							}
						/>
						<Route path='/policy' element={<PrivacyPolicy />} />
						<Route path='/terms' element={<TermsConditions />} />

						<Route
							path='/signin'
							element={
								user ? (
									<Navigate to='/' />
								) : (
									<MaintenanceProvider>
										<SignIn />
									</MaintenanceProvider>
								)
							}
						/>
						<Route
							path='/signup'
							element={
								user ? (
									<Navigate to='/' />
								) : (
									<MaintenanceProvider>
										<SignUp />
									</MaintenanceProvider>
								)
							}
						/>
						<Route
							path='/recover'
							element={
								user && (
									<MaintenanceProvider>
										<UpdatePassword />
									</MaintenanceProvider>
								)
							}
						/>

						<Route path='/gift' element={<Navigate to='/' />} />

						<Route
							path='/lists'
							element={
								<ProtectedRoute>
									<Lists />
								</ProtectedRoute>
							}
						/>

						<Route
							path={`/lists/:list`}
							element={
								<ProtectedRoute>
									<ListItems />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/groups'
							element={
								<ProtectedRoute>
									<Groups />
								</ProtectedRoute>
							}
						/>
						<Route
							path={`/groups/:group`}
							element={
								<ProtectedRoute>
									<Group />
								</ProtectedRoute>
							}
						/>
						<Route
							path={`/groups/:group/:user`}
							element={
								<ProtectedRoute>
									<Member />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/shopping'
							element={
								<ProtectedRoute>
									<>Shopping List</>
								</ProtectedRoute>
							}
						/>
						<Route
							path='/archive'
							element={
								<ProtectedRoute>
									<>Archive</>
								</ProtectedRoute>
							}
						/>
						<Route
							path='/trash'
							element={
								<ProtectedRoute>
									<>Trash</>
								</ProtectedRoute>
							}
						/>

						<Route
							path='*'
							element={
								user ? (
									<ProtectedRoute>
										<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
											Page not found!
										</Typography>
									</ProtectedRoute>
								) : (
									<>
										<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
											Page not found!
										</Typography>

										<Typography variant='body1' style={{ textAlign: 'center' }}>
											<MUILink component={Link} to='/groups'>
												Go Back
											</MUILink>
										</Typography>
									</>
								)
							}
						/>
					</Routes>
				</LastLocationProvider>
			)}
		</>
	);
}

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
	const { user, client } = useSupabase();

	const { data: profile } = useGetProfile();
	const { data: system, refetch: refetchSystem } = useGetSystem();

	React.useEffect(() => {
		client
			.channel(`public:system`)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'system' }, (payload) => {
				refetchSystem();
			})
			.subscribe();
	}, [client, refetchSystem]);

	if (!user) {
		// user is not authenticated
		return <Navigate to='/signin' />;
	}
	return system?.maintenance && profile?.role?.role !== UserRoles.admin ? <MaintenanceMessage /> : <Navigation children={children} />;
};

const MaintenanceProvider: React.FC<{ children: JSX.Element }> = ({ children }) => {
	const { client } = useSupabase();

	const { data: system, refetch: refetchSystem } = useGetSystem();

	React.useEffect(() => {
		client
			.channel(`public:system`)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'system' }, (payload) => {
				refetchSystem();
			})
			.subscribe();
	}, [client, refetchSystem]);

	return system?.maintenance ? <MaintenanceMessage /> : children;
};

function MaintenanceMessage() {
	return (
		<Box sx={{ ml: 8, mt: 8 }}>
			<Typography variant='h3' sx={{ fontWeight: 'bold' }} gutterBottom>
				We'll be back soon!
			</Typography>
			<Typography variant='h5' gutterBottom>
				Sorry for the inconvenience but we're performing some maintenance at the moment. We'll be back online shortly!
			</Typography>
			<Typography variant='h5' sx={{ ml: 1.5 }}>
				— Development Team
			</Typography>
		</Box>
	);
}
