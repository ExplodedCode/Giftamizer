import * as React from 'react';
import { Link } from 'react-router-dom';

import { useGetRecentItems } from '../../lib/useSupabase';
import moment from 'moment';
import { Box, Grid, IconButton, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Link as MUILink } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import Title from '../../components/Title';

export default function RecentItems() {
	const { data, isLoading, isRefetching, refetch } = useGetRecentItems();

	return (
		<React.Fragment>
			<Title>Recent Items</Title>
			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell>Date</TableCell>
						<TableCell>User</TableCell>
						<TableCell>Name</TableCell>
						<TableCell>Description</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{data?.map((item) => (
						<TableRow key={item.id}>
							<TableCell>
								<Tooltip title={moment(item.created_at).format('L hh:MM:ss a')}>
									<Box>{moment(item.created_at).format('L')}</Box>
								</Tooltip>
							</TableCell>
							<TableCell>
								<MUILink color='primary' component={Link} to={`/users/${item.user_id}`} sx={{ mt: 3 }}>
									{item.user.first_name} {item.user.last_name}
								</MUILink>
							</TableCell>
							<TableCell>{item.name}</TableCell>

							<TableCell>
								<Tooltip title={item.description}>
									<Box sx={{ display: 'block', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</Box>
								</Tooltip>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{(isLoading || isRefetching) && <LinearProgress />}

			<Grid container alignItems='flex-end'>
				<Grid item xs>
					<MUILink color='primary' component={Link} to={`/items`} sx={{ mt: 3 }}>
						See all items
					</MUILink>
				</Grid>
				<Grid item>
					<IconButton aria-label='refresh' size='small' onClick={() => refetch()} disabled={isLoading || isRefetching}>
						<Refresh fontSize='inherit' />
					</IconButton>
				</Grid>
			</Grid>
		</React.Fragment>
	);
}
