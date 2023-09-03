import * as React from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';

import { Archive, Delete } from '@mui/icons-material';
import { Typography, LinearProgress, Link as MUILink } from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

import { useGetItems } from '../../lib/useSupabase';

type ItemsTableProps = {
	paginationModel: GridPaginationModel;
	setPaginationModel: (value: GridPaginationModel) => void;
	search: string;
	setSearch: (value: string) => void;
	sorting: { field: string | undefined; sort: string | undefined };
	setSorting: (value: { field: string | undefined; sort: string | undefined }) => void;
	match?: any;
};
export default function ItemsTable({ paginationModel, setPaginationModel, search, setSearch, sorting, setSorting, match }: ItemsTableProps) {
	let columns: GridColDef[] = [
		{
			field: 'name',
			headerName: 'Name',
			width: match?.user_id ? 270 : 220,
			filterable: false,
			hideable: false,
		},
		{
			field: 'description',
			headerName: 'Description',
			width: match?.user_id ? 430 : 300,
			filterable: false,
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
			field: 'archiveDeleted',
			headerName: 'Archive/Deleted',
			width: 120,
			filterable: false,
			sortable: false,
			renderCell: (params) => {
				return params.row.deleted ? <Delete /> : params.row.archived ? <Archive /> : '';
			},
		},
	];

	// only show user if not filtering to user_id
	if (!match?.user_id) {
		columns = [
			{
				field: 'user',
				headerName: 'User',
				width: 180,
				filterable: false,
				hideable: false,
				renderCell: (params) => {
					return (
						<MUILink color='primary' component={Link} to={`/users/${params.row.user_id}`}>
							{params.row.user.first_name} {params.row.user.last_name}
						</MUILink>
					);
				},
			},
			...columns,
		];
	}

	const handleSortModelChange = React.useCallback(
		(sortModel: GridSortModel) => {
			setPaginationModel({
				page: 0,
				pageSize: paginationModel.pageSize,
			});
			setSorting({ field: sortModel[0]?.field, sort: sortModel[0]?.sort as string });
		},
		[setSorting, setPaginationModel, paginationModel.pageSize]
	);

	const { data, isLoading, isRefetching } = useGetItems(paginationModel.page, paginationModel.pageSize, sorting, search, match);

	return (
		<DataGrid
			rows={data?.items ?? []}
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
				// navigate(`/items/${params.id}`);
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
	);
}

function CustomNoRowsOverlay() {
	return (
		<Typography sx={{ pt: 5 }} color='text.secondary' align='center'>
			No items
		</Typography>
	);
}
