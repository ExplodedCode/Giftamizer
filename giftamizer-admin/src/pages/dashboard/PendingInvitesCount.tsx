import * as React from 'react';
import { Link } from 'react-router-dom';

import { Box, Grid, IconButton, LinearProgress, Link as MUILink, Typography } from '@mui/material';

import Title from '../../components/Title';

import { useGetCount } from '../../lib/useSupabase';
import { Refresh } from '@mui/icons-material';

export default function UserCount() {
	const { data: invitesCount, isLoading: invitesLoading, isRefetching: invitesRefetching, refetch: refetchInvites } = useGetCount('group_members', { invite: true });
	const { data: externalInvitesCount, isLoading: externalInvitesLoading, isRefetching: externalInvitesRefetching, refetch: refetchInvitesExternalInvites } = useGetCount('external_invites');

	return (
		<>
			<Title>Pending Invites</Title>
			<Box sx={{ flex: 1 }}>
				{externalInvitesLoading || invitesLoading || invitesRefetching || externalInvitesRefetching ? (
					<LinearProgress />
				) : (
					<>
						<Typography component='p' variant='h4'>
							{((externalInvitesCount ?? 0) + (invitesCount ?? 0)).toLocaleString()}
						</Typography>
					</>
				)}
			</Box>

			<Grid container alignItems='flex-end'>
				<Grid item xs>
					<MUILink color='primary' component={Link} to={`/groups/invites`} sx={{ mt: 3 }}>
						View Invites
					</MUILink>
				</Grid>
				<Grid item>
					<IconButton
						aria-label='refresh'
						size='small'
						onClick={() => {
							refetchInvites();
							refetchInvitesExternalInvites();
						}}
						disabled={externalInvitesLoading || invitesLoading || invitesRefetching || externalInvitesRefetching}
					>
						<Refresh fontSize='inherit' />
					</IconButton>
				</Grid>
			</Grid>
		</>
	);
}
