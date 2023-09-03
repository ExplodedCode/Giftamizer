import * as React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

import { Box, Grid, IconButton, LinearProgress, Link as MUILink, Typography } from '@mui/material';

import Title from '../../components/Title';

import { useGetCount, useGetUserCreatedAtData } from '../../lib/useSupabase';
import { Refresh } from '@mui/icons-material';

export default function UserCount() {
	const { data: count, isLoading: userCountLoading, isRefetching: userCountRefetching, refetch: refetchUserCount } = useGetCount('profiles');
	const { data: users, isLoading: userCreatedAtLoading, isRefetching: userCreatedAtRefetching, refetch: refetchUserCreatedAt } = useGetUserCreatedAtData();

	return (
		<>
			<Title>Users</Title>
			<Box sx={{ flex: 1 }}>
				{userCountLoading || userCountRefetching || userCreatedAtLoading || userCreatedAtRefetching ? (
					<LinearProgress />
				) : (
					<>
						<Typography component='p' variant='h4'>
							{count?.toLocaleString()}
						</Typography>
						<Typography color='text.secondary' sx={{ flex: 1 }}>
							{moment(users!.filter((u) => u.Users === users![users!.length - 1].Users)[0].prettyTime).format('LL')}
						</Typography>
					</>
				)}
			</Box>

			<Grid container alignItems='flex-end'>
				<Grid item xs>
					<MUILink color='primary' component={Link} to={`/users`} sx={{ mt: 3 }}>
						View Users
					</MUILink>
				</Grid>
				<Grid item>
					<IconButton
						aria-label='refresh'
						size='small'
						onClick={() => {
							refetchUserCount();
							refetchUserCreatedAt();
						}}
						disabled={userCountLoading || userCountRefetching || userCreatedAtLoading || userCreatedAtRefetching}
					>
						<Refresh fontSize='inherit' />
					</IconButton>
				</Grid>
			</Grid>
		</>
	);
}
