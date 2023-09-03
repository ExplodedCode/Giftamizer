import * as React from 'react';
import { Link } from 'react-router-dom';

import { Box, Grid, IconButton, LinearProgress, Link as MUILink, Typography } from '@mui/material';

import Title from '../../components/Title';

import { useGetCount } from '../../lib/useSupabase';
import { Refresh } from '@mui/icons-material';

export default function UserCount() {
	const { data: count, isLoading, isRefetching, refetch } = useGetCount('items', { deleted: false });

	return (
		<>
			<Title>Items</Title>
			<Box sx={{ flex: 1 }}>
				{isLoading || isRefetching ? (
					<LinearProgress />
				) : (
					<>
						<Typography component='p' variant='h4'>
							{count?.toLocaleString()}
						</Typography>
					</>
				)}
			</Box>

			<Grid container alignItems='flex-end'>
				<Grid item xs>
					<MUILink color='primary' component={Link} to={`/items`} sx={{ mt: 3 }}>
						View Items
					</MUILink>
				</Grid>
				<Grid item>
					<IconButton aria-label='refresh' size='small' onClick={() => refetch()} disabled={isLoading || isRefetching}>
						<Refresh fontSize='inherit' />
					</IconButton>
				</Grid>
			</Grid>
		</>
	);
}
