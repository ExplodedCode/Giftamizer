import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import UpdatePassword from './pages/UpdatePassword';
import { useSupabase } from './lib/useSupabase';

import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

import Gifts from './components/Gifts';
import Items from './components/Items';

import { Backdrop, Button, CircularProgress } from '@mui/material';
import Navigation from './components/Navigation';

export default function AppRoutes() {
	const { user } = useSupabase();

	return (
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
									<>items</>
								</ProtectedRoute>
							) : (
								<Landing />
							)
						}
					/>

					<Route path='/signin' element={user ? <Navigate to='/' /> : <SignIn />} />
					<Route path='/signup' element={user ? <Navigate to='/' /> : <SignUp />} />
					<Route path='/update-password' element={user && <UpdatePassword />} />

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
								<>Groups</>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/groups/:id'
						element={
							<ProtectedRoute>
								<>Group view</>
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
