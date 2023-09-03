import * as React from 'react';
import debounce from 'lodash/debounce';

import { Refresh, Search } from '@mui/icons-material';
import { Paper, AppBar, Toolbar, Grid, TextField, IconButton, Typography, Tooltip, Box, Tab, Tabs, useTheme } from '@mui/material';

import { useGetItems } from '../../lib/useSupabase';
import ItemsTable from '../../components/tables/ItemsTable';

export default function Users() {
	const theme = useTheme();

	const [paginationModel, setPaginationModel] = React.useState({
		page: 0,
		pageSize: 50,
	});

	const [search, setSearch] = React.useState<string>('');
	const onSearchChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		const str = e.target.value;
		setSearch(`name.ilike.%${str}%,description.ilike.%${str}%`);
	};

	const [sorting, setSorting] = React.useState<{ field: string | undefined; sort: string | undefined }>({ field: undefined, sort: undefined });

	const { isLoading, isRefetching, refetch } = useGetItems(paginationModel.page, paginationModel.pageSize, sorting, search);

	return (
		<>
			<AppBar component='div' color='primary' position='static' enableColorOnDark elevation={0} sx={{ zIndex: 0 }}>
				<Toolbar>
					<Grid container alignItems='center' spacing={1}>
						<Grid item xs>
							<Typography color='inherit' variant='h5' component='h1'>
								Items
							</Typography>
						</Grid>
					</Grid>
				</Toolbar>
			</AppBar>
			<AppBar component='div' position='static' enableColorOnDark elevation={0} sx={{ zIndex: 0 }}>
				<Tabs value={0} textColor='inherit'>
					<Tab label='Items' />
				</Tabs>
			</AppBar>

			<Box component='main' sx={{ flex: 1, py: { xs: 1, sm: 4, md: 6 }, px: { xs: 1, sm: 2, md: 4 } }}>
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
										placeholder='Search by name, description or user UID'
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
						<ItemsTable paginationModel={paginationModel} setPaginationModel={setPaginationModel} search={search} setSearch={setSearch} sorting={sorting} setSorting={setSorting} />
					</Box>
				</Paper>
			</Box>
		</>
	);
}
