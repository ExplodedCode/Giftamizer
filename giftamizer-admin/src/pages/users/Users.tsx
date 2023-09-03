import * as React from 'react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';

import { Email, Refresh, Search } from '@mui/icons-material';
import { Paper, AppBar, Toolbar, Grid, TextField, Button, IconButton, Typography, Tooltip, Box, Tab, Tabs, useTheme, LinearProgress, Stack } from '@mui/material';
import { DataGrid, GridColDef, GridSortModel } from '@mui/x-data-grid';

import { useGetUsers } from '../../lib/useSupabase';
import { FacebookIcon, GoogleIcon } from '../../components/SvgIcons';

const columns: GridColDef[] = [
	{
		field: 'email',
		headerName: 'Email',
		width: 220,
		filterable: false,
		hideable: false,
	},
	{
		field: 'full_name',
		headerName: 'Full name',
		width: 180,
		filterable: false,
	},
	{
		field: 'raw_app_meta_data',
		headerName: 'Providers',
		filterable: false,
		sortable: false,
		renderCell: (params) => {
			let providers = [params.value.provider];
			if (!providers.includes(params.value.providers[0])) providers.push(params.value.providers[0]);

			return (
				<Stack direction='row' spacing={1}>
					{providers.includes('email') && <Email />}
					{providers.includes('google') && <GoogleIcon />}
					{providers.includes('facebook') && <FacebookIcon />}
				</Stack>
			);
		},
	},
	{
		field: 'created_at',
		headerName: 'Created',
		width: 110,
		filterable: false,
		valueGetter: (params) => {
			return `${moment(params.row.created_at).format('ll')}`;
		},
	},
	{
		field: 'signed_in',
		headerName: 'Signed In',
		width: 110,
		filterable: false,
		valueGetter: (params) => {
			return `${moment(params.row.created_at).format('ll')}`;
		},
	},
	{
		field: 'id',
		headerName: 'UID',
		width: 310,
		filterable: false,
		valueGetter: (params) => {
			return `${params.value.toUpperCase()}`;
		},
	},
];

export default function Users() {
	const theme = useTheme();
	const navigate = useNavigate();

	const [search, setSearch] = React.useState<string | undefined>();
	const onSearchChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		setSearch(e.target.value);
	};

	const [sorting, setSorting] = React.useState<{ field: string | undefined; sort: string | undefined }>({ field: undefined, sort: undefined });

	const [paginationModel, setPaginationModel] = React.useState({
		page: 0,
		pageSize: 50,
	});
	const handleSortModelChange = React.useCallback(
		(sortModel: GridSortModel) => {
			setPaginationModel({
				page: 0,
				pageSize: paginationModel.pageSize,
			});
			setSorting({ field: sortModel[0]?.field, sort: sortModel[0]?.sort as string });
		},
		[paginationModel.pageSize]
	);

	const { data, isLoading, isRefetching, refetch } = useGetUsers(paginationModel.page, paginationModel.pageSize, sorting, search);

	return (
		<>
			<AppBar component='div' color='primary' position='static' enableColorOnDark elevation={0} sx={{ zIndex: 0 }}>
				<Toolbar>
					<Grid container alignItems='center' spacing={1}>
						<Grid item xs>
							<Typography color='inherit' variant='h5' component='h1'>
								Users
							</Typography>
						</Grid>
					</Grid>
				</Toolbar>
			</AppBar>
			<AppBar component='div' position='static' enableColorOnDark elevation={0} sx={{ zIndex: 0 }}>
				<Tabs value={0} textColor='inherit'>
					<Tab label='Profiles' />
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
										placeholder='Search by email address, name, or user UID'
										InputProps={{
											disableUnderline: true,
											sx: { fontSize: 'default' },
										}}
										variant='standard'
										onChange={debounce(onSearchChange, 500)}
									/>
								</Grid>
								<Grid item>
									<Button variant='contained' sx={{ mr: 1 }} disabled>
										Invite user
									</Button>
									<Tooltip title='Reload'>
										<IconButton
											onClick={() => {
												setPaginationModel({
													page: 0,
													pageSize: paginationModel.pageSize,
												});
												refetch();
											}}
										>
											<Refresh color='inherit' sx={{ display: 'block' }} />
										</IconButton>
									</Tooltip>
								</Grid>
							</Grid>
						</Toolbar>
					</AppBar>
					<Box>
						<DataGrid
							rows={data?.users ?? []}
							rowCount={data?.count ?? 10}
							slots={{
								loadingOverlay: LinearProgress,
								noRowsOverlay: CustomNoRowsOverlay,
							}}
							loading={isLoading || isRefetching}
							columns={columns}
							density='compact'
							sx={{ border: 'unset' }}
							onRowClick={(params) => {
								navigate(`/users/${params.id}`);
							}}
							// sorting
							sortingMode='server'
							onSortModelChange={handleSortModelChange}
							// pagination
							pageSizeOptions={[25, 50, 100]}
							paginationMode='server'
							paginationModel={paginationModel}
							onPaginationModelChange={setPaginationModel}
							pagination
						/>
					</Box>
				</Paper>
			</Box>
		</>
	);
}

function CustomNoRowsOverlay() {
	return (
		<Typography sx={{ pt: 5 }} color='text.secondary' align='center'>
			No users for this project yet
		</Typography>
	);
}
