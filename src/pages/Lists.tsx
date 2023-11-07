import React, { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { useDeleteList, useGetLists, DEFAULT_LIST_ID } from '../lib/useSupabase/hooks';
import { ListType } from '../lib/useSupabase/types';

import { useSnackbar } from 'notistack';
import {
	Container,
	Grid,
	Typography,
	Box,
	CircularProgress,
	IconButton,
	ListItem,
	Avatar,
	ListItemAvatar,
	ListItemText,
	MenuItem,
	Collapse,
	List,
	Menu,
	ListItemIcon,
	ListItemButton,
	Chip,
	Stack,
	AppBar,
	Breadcrumbs,
	Toolbar,
} from '@mui/material';
import { Delete, Edit, EscalatorWarning, ListAlt, MoreVert } from '@mui/icons-material';
import { TransitionGroup } from 'react-transition-group';

import ListCreate from '../components/ListCreate';
import ListUpdate from '../components/ListUpdate';

interface RenderListItemProps {
	list: ListType;
	handleListEdit?: (list: ListType) => void;
}
function RenderListItem({ list, handleListEdit }: RenderListItemProps) {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();

	const deleteList = useDeleteList();

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleDelete = async (id: string) => {
		await deleteList.mutateAsync(id).catch((err) => {
			enqueueSnackbar(`Unable to delete list! ${err.message}`, { variant: 'error' });
		});
	};

	return (
		<ListItem
			secondaryAction={
				<>
					<IconButton onClick={handleClick}>
						<MoreVert />
					</IconButton>

					<Menu
						anchorEl={anchorEl}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right',
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						open={open}
						onClose={handleClose}
					>
						<MenuItem
							onClick={() => {
								if (handleListEdit !== undefined) handleListEdit(list);
								handleClose();
							}}
						>
							<ListItemIcon>
								<Edit fontSize='small' />
							</ListItemIcon>
							<ListItemText>Edit</ListItemText>
						</MenuItem>
						<MenuItem
							onClick={() => {
								handleDelete(list.id);
								handleClose();
							}}
							disabled={list.id === DEFAULT_LIST_ID} // don't allow delete of default list
						>
							<ListItemIcon>
								<Delete fontSize='small' />
							</ListItemIcon>
							<ListItemText>Delete</ListItemText>
						</MenuItem>
					</Menu>
				</>
			}
			disablePadding
		>
			<ListItemButton onClick={() => navigate(`/lists/${list.id}`)}>
				<ListItemAvatar>
					{list.image ? (
						<Avatar alt={list.name} src={list.image} />
					) : (
						<Avatar sx={{ bgcolor: list.id === DEFAULT_LIST_ID ? 'primary.main' : undefined }}>{list.child_list ? <EscalatorWarning /> : <ListAlt />}</Avatar>
					)}
				</ListItemAvatar>

				<ListItemText
					primary={list.name}
					secondary={
						list.groups.length === 0 ? (
							<Box sx={{ color: 'warning.main' }}>
								<b>This list is not assigned any groups!</b>
							</Box>
						) : (
							<Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
								{list.groups.map((g) => (
									<Chip label={g.name} size='small' />
								))}
							</Stack>
						)
					}
				/>
			</ListItemButton>
		</ListItem>
	);
}

export default function Lists() {
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();

	const { data: lists, isLoading, isError, error } = useGetLists();
	const [listEdit, setListEdit] = React.useState<ListType | null>(null);

	useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get lists! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	return (
		<>
			<AppBar position='static' sx={{ marginBottom: 2, bgcolor: 'background.paper' }}>
				<Toolbar variant='dense'>
					<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
						<Typography color='text.primary'>Lists</Typography>
					</Breadcrumbs>
				</Toolbar>
			</AppBar>

			<Container maxWidth='sm' sx={{ paddingTop: 5, paddingBottom: 12 }}>
				<Grid container spacing={2}>
					{lists && (
						<TransitionGroup component={List} sx={{ width: '100%' }} dense>
							{[...lists.filter((l) => l.id === DEFAULT_LIST_ID)!, ...lists.filter((l) => l.id !== DEFAULT_LIST_ID)!]?.map((list) => (
								<Collapse key={list.id}>
									<RenderListItem
										list={list}
										handleListEdit={(l) => {
											setListEdit(l);
											navigate('#list-edit'); // close dialog
										}}
									/>
								</Collapse>
							))}
						</TransitionGroup>
					)}
				</Grid>
				{isLoading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
						<CircularProgress />
					</Box>
				)}
			</Container>

			<ListCreate />
			<ListUpdate
				list={listEdit}
				onClose={() => {
					setListEdit(null);
					navigate('#'); // close dialog
				}}
			/>
		</>
	);
}
