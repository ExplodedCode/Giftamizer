import React from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { useSupabase } from './lib/useSupabase';
import { GroupType } from './lib/useSupabase/types';

import { useSnackbar } from 'notistack';

import { Alert, AlertTitle, Backdrop, Button, CircularProgress, Container, Link as MUILink, Typography } from '@mui/material';

import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import UpdatePassword from './pages/UpdatePassword';
import Navigation from './components/Navigation';
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
	}, [enqueueSnackbar, location.hash]);

	const [groups, setGroups] = React.useState<GroupType[] | undefined>(undefined);

	React.useEffect(() => {
		if (user) {
			const getGroups = async () => {
				const { data, error } = await client
					.from('groups')
					.select(
						`id,
					name,
					image_token,
					my_membership:group_members!inner(*)`
					)
					.eq('my_membership.user_id', user.id);

				console.log(data, error);

				setGroups(data! as GroupType[]);
			};

			client
				.channel(`public:group_members:user_id=eq.${user.id}`)
				.on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` }, (payload) => {
					getGroups();
				})
				.subscribe();

			getGroups();
		}
	}, [client, user]);

	return (
		<>
			{error ? (
				<>
					<Container sx={{ marginTop: 4 }}>
						<Alert severity='error'>
							<AlertTitle>Error</AlertTitle>
							{error}
						</Alert>
						<Button
							variant='contained'
							onClick={() => {
								client.auth.signOut();
								window.location.reload();
							}}
							sx={{ marginTop: 8 }}
						>
							Sign out
						</Button>
					</Container>
				</>
			) : (
				<>
					{user === undefined || groups === undefined ? (
						<Backdrop sx={{ color: '#fff', zIndex: 1000 }} open={true}>
							<CircularProgress color='inherit' />
						</Backdrop>
					) : (
						<Routes>
							<Route
								path='/'
								element={
									user ? (
										<ProtectedRoute groups={groups!}>
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
									<ProtectedRoute groups={groups!}>
										<>Lists</>
									</ProtectedRoute>
								}
							/>
							<Route
								path='/groups'
								element={
									<ProtectedRoute groups={groups!}>
										<Groups groups={groups!} />
									</ProtectedRoute>
								}
							/>

							{groups.map((group) => (
								<>
									<Route
										key={`group-${group.id}`}
										path={`/groups/${group.id}`}
										element={
											<ProtectedRoute groups={groups}>
												<Group group={group} />
											</ProtectedRoute>
										}
									/>
									<Route
										key={`user-${group.id}`}
										path={`/groups/${group.id}/:user`}
										element={
											<ProtectedRoute groups={groups}>
												<Group group={group} />
											</ProtectedRoute>
										}
									/>
								</>
							))}

							{/* <Route
								path='/groups/:group?/:user?'
								element={
									<ProtectedRoute groups={groups!}>
										<Groups groups={groups!} />
									</ProtectedRoute>
								}
							/> */}

							<Route
								path='/shopping'
								element={
									<ProtectedRoute groups={groups!}>
										<>Shopping List</>
									</ProtectedRoute>
								}
							/>
							<Route
								path='/archive'
								element={
									<ProtectedRoute groups={groups!}>
										<>Archive</>
									</ProtectedRoute>
								}
							/>
							<Route
								path='/trash'
								element={
									<ProtectedRoute groups={groups!}>
										<>Trash</>
									</ProtectedRoute>
								}
							/>

							<Route
								path='*'
								element={
									user ? (
										<ProtectedRoute groups={groups!}>
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
					)}
				</>
			)}
		</>
	);
}

const ProtectedRoute: React.FC<{ groups: GroupType[]; children: JSX.Element }> = ({ groups, children }) => {
	const { user } = useSupabase();
	if (!user) {
		// user is not authenticated
		return <Navigate to='/signin' />;
	}
	return <Navigation groups={groups} children={children} />;
};
