import React from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LastLocationProvider } from 'react-router-dom-last-location';
import { useSnackbar } from 'notistack';

import { useSupabase } from './lib/useSupabase';

import { Backdrop, CircularProgress, Link as MUILink, Typography } from '@mui/material';

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

						<Route path='/signin' element={user ? <Navigate to='/' /> : <SignIn />} />
						<Route path='/signup' element={user ? <Navigate to='/' /> : <SignUp />} />
						<Route path='/recover' element={user && <UpdatePassword />} />

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
							path='/groups'
							element={
								<ProtectedRoute>
									<Groups />
								</ProtectedRoute>
							}
						/>

						<Route
							path={`/groups/:group/:user?`}
							element={
								<ProtectedRoute>
									<Group />
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
	const { user } = useSupabase();
	if (!user) {
		// user is not authenticated
		return <Navigate to='/signin' />;
	}
	return <Navigation children={children} />;
};
