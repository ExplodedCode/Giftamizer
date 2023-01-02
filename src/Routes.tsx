import React, { useState, useEffect } from 'react';

import { Navigate, Route, Routes } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './lib/api';

import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Gift from './pages/Gift';

import UpdatePassword from './pages/UpdatePassword';
import Button from '@mui/material/Button';
import { SnackbarAlert } from './types';
import { useSnackbar } from 'notistack';
import Gifts from './components/Gifts';
import Items from './components/Items';
import { SupabaseContext, useSupabase } from './lib/useSupabase';

export default function AppRoutes() {
	const { closeSnackbar } = useSnackbar();

	const { user } = useSupabase();

	return (
		<Routes>
			<Route path='/' element={user ? <Navigate to='/gift' /> : <Landing />} />
			<Route path='/signin' element={user ? <Navigate to='/gift' /> : <SignIn />} />
			<Route path='/signup' element={user ? <Navigate to='/gift' /> : <SignUp />} />

			<Route path='/update-password' element={user && <UpdatePassword />} />
			<Route path='/gift' element={user ? <Gifts /> : <Navigate to='/signin' />}>
				<Route path='items' element={<Items />} />
			</Route>
		</Routes>
	);
}
