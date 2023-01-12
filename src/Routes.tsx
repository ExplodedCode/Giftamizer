import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import UpdatePassword from './pages/UpdatePassword';
import { useSupabase } from './lib/useSupabase';
import { useSnackbar } from 'notistack';

import { Alert, AlertTitle, Backdrop, Button, CircularProgress, Container } from '@mui/material';

import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Groups from './pages/Groups';
import Group from './pages/Group';

export default function AppRoutes() {
	const { user, profile, error, client } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const location = useLocation();

	React.useEffect(() => {
		if (location.hash.startsWith('#message=')) {
			// decodeURI(location.hash);
			enqueueSnackbar(location.hash.replace('#message=', '').replaceAll('+', ' '), {
				variant: 'info',
			});
		}
	}, []);

	return (
		<>
			{error ? (
				<>
					<Container sx={{ marginTop: 4 }}>
						<Alert severity='error'>
							<AlertTitle>Error</AlertTitle>
							{error}
						</Alert>
						<Button variant='contained' onClick={() => client.auth.signOut()} sx={{ marginTop: 8 }}>
							Sign out
						</Button>
					</Container>
				</>
			) : (
				<>
					{user === undefined ? (
						<Backdrop sx={{ color: '#fff', zIndex: 1000 }} open={true}>
							<CircularProgress color='inherit' />
						</Backdrop>
					) : (
						<Routes>
							<Route
								path='/'
								element={
									user ? (
										<ProtectedRoute>
											<>Items - {profile.name}</>
										</ProtectedRoute>
									) : (
										<Landing />
									)
								}
							/>

							<Route path='/signin' element={user ? <Navigate to='/' /> : <SignIn />} />
							<Route path='/signup' element={user ? <Navigate to='/' /> : <SignUp />} />
							<Route path='/recover' element={user && <UpdatePassword />} />

							<Route path='/gift' element={<Navigate to='/' />} />

							<Route
								path='/lists'
								element={
									<ProtectedRoute>
										<>Lists</>
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
								path='/groups/:group/:user?'
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
									<img
										style={{ width: '80%', position: 'fixed', bottom: 0, right: 0, left: 0, maxHeight: 350, maxWidth: 790, display: 'block', margin: '0 auto' }}
										src={'/img-404.png'}
										alt={'404'}
									/>
								}
							/>
						</Routes>
					)}
				</>
			)}
		</>
	);
}

// const ProtectedRoute = ({ children: JSX.Element }) => {
const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
	const { user } = useSupabase();
	if (!user) {
		// user is not authenticated
		return <Navigate to='/signin' />;
	}
	return <Navigation children={children} />;
};
