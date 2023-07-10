import React, { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { useSupabase } from '../lib/useSupabase';
import { useDeleteList, useGetLists } from '../lib/useSupabase/hooks';
import { GroupType, ListType } from '../lib/useSupabase/types';

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
} from '@mui/material';
import { Delete, Edit, EscalatorWarning, ListAlt, MoreVert } from '@mui/icons-material';
import { TransitionGroup } from 'react-transition-group';

import ListCreate from '../components/ListCreate';
import ListUpdate from '../components/ListUpdate';

interface RenderListItemProps {
	list: ListType;
	handleListEdit: (list: ListType) => void;
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
								handleListEdit(list);
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
					<Avatar>{list.child_list ? <EscalatorWarning /> : <ListAlt />}</Avatar>
				</ListItemAvatar>

				<ListItemText
					primary={list.name}
					secondary={
						list.groups.length === 0 ? (
							<b>This list assigned to a group!</b>
						) : (
							<Stack direction='row' spacing={1}>
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

type Lists = {
	// groups: GroupType[];
};
export default function Lists(props: Lists) {
	const { client } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const { data: lists, isLoading, isError, error } = useGetLists();
	const [listEdit, setListEdit] = React.useState<ListType | null>(null);

	useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get lists! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError]);

	return (
		<>
			<Container maxWidth='sm' sx={{ paddingTop: 5, paddingBottom: 12 }}>
				<Grid container spacing={2}>
					<TransitionGroup component={List} sx={{ width: '100%' }} dense>
						{lists?.map((list) => (
							<Collapse key={list.id}>
								<RenderListItem list={list} handleListEdit={setListEdit} />
							</Collapse>
						))}
					</TransitionGroup>

					{lists?.length === 0 && !isLoading && (
						<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
							<Typography variant='h5' gutterBottom>
								You don't have any lists!
							</Typography>
							<Typography variant='body1' gutterBottom>
								Add some gift ideas to share with your friends and family!
							</Typography>
						</Box>
					)}
				</Grid>
				{isLoading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
						<CircularProgress />
					</Box>
				)}
			</Container>

			<ListCreate />
			<ListUpdate list={listEdit} onClose={() => setListEdit(null)} />
		</>
	);
}
