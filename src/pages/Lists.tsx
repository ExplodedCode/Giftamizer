import React, { useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useDeleteList, useGetLists, DEFAULT_LIST_ID, useGetTour, useUpdateTour, listTourProgress } from '../lib/useSupabase/hooks';
import { ListType, TourSteps } from '../lib/useSupabase/types';

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
	Alert,
	Paper,
	useTheme,
	DialogTitle,
	DialogContent,
	DialogActions,
	AlertTitle,
	Backdrop,
} from '@mui/material';
import { Delete, Edit, EscalatorWarning, ListAlt, MoreVert } from '@mui/icons-material';
import { TransitionGroup } from 'react-transition-group';

import ListCreate from '../components/ListCreate';
import ListUpdate from '../components/ListUpdate';
import { LoadingButton } from '@mui/lab';
import TourTooltip from '../components/TourTooltip';
import { UseMutationResult } from '@tanstack/react-query';
import HtmlTooltip from '../components/HtmlTooltip';

interface RenderListItemProps {
	index: number;
	list: ListType;
	handleListEdit?: (list: ListType) => void;
	tour: TourSteps | undefined;
	updateTour: UseMutationResult<TourSteps, unknown, TourSteps, unknown>;
}
function RenderListItem({ index, list, handleListEdit, tour, updateTour }: RenderListItemProps) {
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const deleteList = useDeleteList();

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);

		if (!tour?.list_menu) {
			updateTour.mutateAsync({
				list_menu: true,
			});
		}
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleDelete = async (id: string) => {
		await deleteList.mutateAsync(id).catch((err) => {
			enqueueSnackbar(`Unable to delete list! ${err.message}`, { variant: 'error' });
		});
	};

	//
	// user tour
	const [showTour, setShowTour] = React.useState<boolean>(false);
	useEffect(() => {
		if (open) {
			setTimeout(() => {
				setShowTour(true);
			}, 250);
		} else {
			setShowTour(false);
		}
	}, [open]);

	return (
		<ListItem
			secondaryAction={
				<>
					<IconButton onClick={handleClick} tour-element={index === 0 ? 'list_menu' : undefined}>
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
						<HtmlTooltip
							title={<DialogTitle>Edit your {list.name} list and add it to one more more groups!</DialogTitle>}
							arrow
							open={showTour && listTourProgress(tour ?? {}) === 'list_edit' && location.hash === ''}
							placement='top-end'
						>
							<MenuItem
								onClick={() => {
									if (!tour?.list_edit) {
										updateTour.mutateAsync({
											list_edit: true,
										});
									}

									if (handleListEdit !== undefined) handleListEdit(list);
									handleClose();
								}}
								tour-element={index === 0 ? 'list_edit' : undefined}
							>
								<ListItemIcon>
									<Edit fontSize='small' />
								</ListItemIcon>
								<ListItemText>Edit</ListItemText>
							</MenuItem>
						</HtmlTooltip>

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
							<Box sx={{ ml: 1, mt: 0.5 }}>
								<Box sx={{ color: 'warning.main' }}>
									<b>This list is not assigned any groups!</b>
								</Box>
								<i>Add this list to a groups for the items to be visible to others.</i>
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
	const theme = useTheme();

	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const { data: lists, isLoading, isError, error } = useGetLists();
	const [listEdit, setListEdit] = React.useState<ListType | null>(null);

	useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get lists! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	//
	// User tour
	const [showTour, setShowTour] = React.useState<boolean>(false);
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	useEffect(() => {
		if (!isLoading) {
			setTimeout(() => {
				setShowTour(true);
			}, 100);
		}
	}, [isLoading]);

	return (
		<>
			<AppBar position='static' sx={{ marginBottom: 2 }} color='default'>
				<Toolbar variant='dense'>
					<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
						<Typography color='text.primary'>Lists</Typography>
					</Breadcrumbs>
				</Toolbar>
			</AppBar>

			{listTourProgress(tour ?? {}) === 'list_intro' && location.hash === '' && (
				<Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={true}>
					<Paper
						elevation={12}
						sx={{
							backgroundColor: theme.palette.primary.main,
							maxWidth: 550,
							margin: 2,
						}}
					>
						<DialogTitle>Get Started with Lists!</DialogTitle>
						<DialogContent>
							<Typography gutterBottom>Lists allow you to have more control over who can see specific items. Even create seperate managed lists for your kids or pets.</Typography>

							<Alert severity='warning'>
								<AlertTitle sx={{ fontWeight: 'bold' }}>Item Assignment</AlertTitle>
								<Typography variant='body2' gutterBottom>
									To ensure that your items are visible to others in a group, you must assign your lists to a group, <b>and</b> items must be assigned to a list
								</Typography>
							</Alert>
						</DialogContent>
						<DialogActions>
							<LoadingButton
								variant='outlined'
								color='inherit'
								onClick={() => {
									if (!tour?.list_intro) {
										updateTour.mutateAsync({
											list_nav: true,
											list_intro: true,
										});
									}
								}}
								loading={updateTour.isLoading}
							>
								Get Started
							</LoadingButton>
						</DialogActions>
					</Paper>
				</Backdrop>
			)}

			<Container maxWidth='sm' sx={{ pt: 4, pb: 12 }}>
				<Grid container spacing={2}>
					{lists && (
						<>
							<TransitionGroup component={List} sx={{ width: '100%' }} dense>
								{[...lists.filter((l) => l.id === DEFAULT_LIST_ID)!, ...lists.filter((l) => l.id !== DEFAULT_LIST_ID)!]?.map((list, index) => (
									<Collapse key={list.id}>
										<RenderListItem
											index={index}
											list={list}
											handleListEdit={(l) => {
												setListEdit(l);
												navigate('#list-edit'); // close dialog
											}}
											tour={tour}
											updateTour={updateTour}
										/>
									</Collapse>
								))}
							</TransitionGroup>

							{showTour && tour && (
								<>
									<TourTooltip
										open={listTourProgress(tour ?? {}) === 'list_menu' && location.hash === ''}
										anchorEl={document.querySelector('[tour-element="list_menu"]')}
										placement='bottom-end'
										content={
											<>
												<DialogTitle>Edit your {lists?.find((l) => l.id === DEFAULT_LIST_ID)?.name} list add it to a group!</DialogTitle>
											</>
										}
										backgroundColor={theme.palette.primary.main}
										color={theme.palette.primary.contrastText}
										mask
										allowClick
									/>
								</>
							)}
						</>
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
