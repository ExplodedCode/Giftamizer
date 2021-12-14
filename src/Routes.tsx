import { useState, useEffect, Component } from 'react';

import { Navigate, Route, Routes } from 'react-router-dom';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './lib/api';

import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import UpdatePassword from './pages/UpdatePassword';

function AppRoutes() {
	const [user, setUser] = useState<User | undefined>();

	useEffect(() => {
		initAuth();
	}, [user]);

	const initAuth = async () => {
		const { data, error } = await supabase.auth.getSession();

		console.log('initAuth', data, error);

		if (!user) setUser(data?.session?.user ?? undefined);

		supabase.auth.onAuthStateChange((event, session) => {
			console.log(event, session);

			setUser(session?.user ?? undefined);
		});
	};

	return (
		<>
			<Routes>
				<Route path='/' element={user ? <Navigate to='/gift' /> : <Landing />} />
				<Route path='/signin' element={user ? <Navigate to='/gift' /> : <SignIn />} />
				<Route path='/signup' element={user ? <Navigate to='/gift' /> : <SignUp />} />

				<Route path='/update-password' element={user && <UpdatePassword />} />
				<Route path='/gift' element={user ? <SignIn /> : <Navigate to='/signin' />} />
			</Routes>
		</>
	);
}

export default AppRoutes;
