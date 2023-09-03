import * as React from 'react';
import { useParams } from 'react-router-dom';
import debounce from 'lodash/debounce';

import { Refresh, Search } from '@mui/icons-material';
import { Paper, AppBar, Toolbar, Grid, TextField, IconButton, Tooltip, Box, useTheme } from '@mui/material';

import { useGetItems } from '../../../lib/useSupabase';

import ListsTable from '../../../components/tables/ListsTable';

export default function Users() {
	const theme = useTheme();
	const { user_id } = useParams();

	const [paginationModel, setPaginationModel] = React.useState({
		page: 0,
		pageSize: 50,
	});

	const [search, setSearch] = React.useState<string>('');
	const onSearchChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		const str = e.target.value;
		setSearch(`name.ilike.%${str}%`);
	};

	const [sorting, setSorting] = React.useState<{ field: string | undefined; sort: string | undefined }>({ field: undefined, sort: undefined });

	const { isLoading, isRefetching, refetch } = useGetItems(paginationModel.page, paginationModel.pageSize, sorting, search, { user_id: user_id });

	return (
		<>
			<Paper
				sx={{ maxWidth: 936, margin: 'auto', overflow: 'hidden', border: theme.palette.mode === 'light' ? 'unset' : 1, borderColor: theme.palette.mode === 'light' ? 'unset' : '#474a53' }}
				elevation={3}
			>
				<AppBar position='static' color='default' elevation={0} sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
					<Toolbar>
						<Grid container spacing={2} alignItems='center'>
							<Grid item>
								<Search color='inherit' sx={{ display: 'block' }} />
							</Grid>
							<Grid item xs>
								<TextField
									fullWidth
									placeholder='Search by name'
									InputProps={{
										disableUnderline: true,
										sx: { fontSize: 'default' },
									}}
									variant='standard'
									onChange={debounce(onSearchChange, 500)}
								/>
							</Grid>
							<Grid item>
								<Tooltip title='Reload'>
									<IconButton
										onClick={() => {
											setPaginationModel({
												page: 0,
												pageSize: paginationModel.pageSize,
											});
											refetch();
										}}
										disabled={isLoading || isRefetching}
									>
										<Refresh color='inherit' sx={{ display: 'block' }} />
									</IconButton>
								</Tooltip>
							</Grid>
						</Grid>
					</Toolbar>
				</AppBar>
				<Box>
					<ListsTable
						paginationModel={paginationModel}
						setPaginationModel={setPaginationModel}
						search={search}
						setSearch={setSearch}
						sorting={sorting}
						setSorting={setSorting}
						match={{ user_id: user_id }}
					/>
				</Box>
			</Paper>
		</>
	);
}
