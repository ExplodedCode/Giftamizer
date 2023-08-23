import React from 'react';
import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import {
	Card,
	CardContent,
	CardMedia,
	Grid,
	Typography,
	Button,
	Stack,
	IconButton,
	Chip,
	CardActions,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Collapse,
	TableContainer,
	Table,
	Paper,
	TableRow,
	TableBody,
	TableCell,
	ButtonBase,
} from '@mui/material';
import { Delete, Edit, ExpandMore, MoreVert } from '@mui/icons-material';

import ItemUpdate from '../components/ItemUpdate';

import { ExtractDomain, useDeleteItem, useGetProfile, useSupabase, useUpdateItemStatus } from '../lib/useSupabase';
import { ItemStatuses, ItemType, MemberItemType } from '../lib/useSupabase/types';
import { LoadingButton } from '@mui/lab';
import { useParams } from 'react-router-dom';

interface VertMenuProps {
	item: ItemType | MemberItemType;
}
function VertMenu({ item }: VertMenuProps) {
	const { enqueueSnackbar } = useSnackbar();

	const [itemEdit, setItemEdit] = React.useState<ItemType | null>(null);
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

	const open = Boolean(anchorEl);

	const handleVertMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleVertMenuClose = () => {
		setAnchorEl(null);
	};

	const deleteItem = useDeleteItem();
	const handleDelete = async (id: string) => {
		await deleteItem.mutateAsync(id).catch((err) => {
			enqueueSnackbar(`Unable to delete item! ${err.message}`, { variant: 'error' });
		});
	};

	return (
		<>
			<IconButton onClick={handleVertMenuOpen}>
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
				onClose={handleVertMenuClose}
			>
				<MenuItem
					onClick={() => {
						setItemEdit(item);
						handleVertMenuClose();
					}}
				>
					<ListItemIcon>
						<Edit fontSize='small' />
					</ListItemIcon>
					<ListItemText>Edit</ListItemText>
				</MenuItem>
				<MenuItem
					onClick={() => {
						handleDelete(item.id);
						handleVertMenuClose();
					}}
				>
					<ListItemIcon>
						<Delete fontSize='small' />
					</ListItemIcon>
					<ListItemText>Delete</ListItemText>
				</MenuItem>
			</Menu>

			<ItemUpdate item={itemEdit} onClose={() => setItemEdit(null)} />
		</>
	);
}

interface ItemStatusProps {
	item: MemberItemType;
}
function ItemStatus({ item }: ItemStatusProps) {
	const theme = useTheme();

	const { group: groupID, user: userID } = useParams();
	const user_id = userID!.split('_')[0] ?? userID!;
	const list_id = userID!.split('_')[1] ?? undefined;

	const { enqueueSnackbar } = useSnackbar();
	const { user } = useSupabase();
	const updateItemStatus = useUpdateItemStatus(groupID!, user_id, list_id);

	const handleUpdateItemStatus = async (status: ItemStatuses) => {
		await updateItemStatus.mutateAsync({ item_id: item.id, user_id: user.id, status: status }).catch((err) => {
			enqueueSnackbar(`Unable to update item status! ${err.message}`, { variant: 'error' });
		});
	};
	return (
		<>
			<LoadingButton
				variant='outlined'
				color={(() => {
					switch (item.status?.status) {
						default:
							return 'success';
						case ItemStatuses.planned:
							return 'warning';
						case ItemStatuses.unavailable:
							return 'error';
					}
				})()}
				size='small'
				onClick={() => {
					handleUpdateItemStatus(
						(() => {
							switch (item.status?.status) {
								default:
									return ItemStatuses.planned;
								case ItemStatuses.planned:
									return ItemStatuses.unavailable;
								case ItemStatuses.unavailable:
									return ItemStatuses.available;
							}
						})()
					);
				}}
				loading={updateItemStatus.isLoading}
				disabled={item.status?.user_id !== undefined && item.status?.user_id !== user.id}
				sx={
					item.status?.user_id !== user.id
						? {
								'&.Mui-disabled': {
									// color: theme.palette.warning.main,
									color: (() => {
										switch (item.status?.status) {
											default:
												return theme.palette.success.main;
											case ItemStatuses.planned:
												return theme.palette.warning.main;
											case ItemStatuses.unavailable:
												return theme.palette.error.main;
										}
									})(),
								},
						  }
						: {}
				}
			>
				{(() => {
					switch (item.status?.status) {
						default:
							return 'Available';
						case ItemStatuses.planned:
							return 'Planned';
						case ItemStatuses.unavailable:
							return 'Unavailable';
					}
				})()}
			</LoadingButton>
		</>
	);
}

interface CustomFieldExpandProps {
	handleExpand: (event: React.MouseEvent<HTMLElement>) => void;
	expanded: boolean;
	item: ItemType | MemberItemType;
}
function CustomFieldExpand({ handleExpand, expanded, item }: CustomFieldExpandProps) {
	const theme = useTheme();

	return (
		<>
			<CardActions disableSpacing>
				<IconButton
					onClick={handleExpand}
					aria-label='show more'
					style={{
						marginLeft: 'auto',
						transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
						transition: theme.transitions.create('transform', {
							duration: theme.transitions.duration.shortest,
						}),
					}}
				>
					<ExpandMore />
				</IconButton>
			</CardActions>
			<Collapse in={expanded} timeout='auto' unmountOnExit sx={{ mr: 2, ml: 2, mb: 1 }}>
				<TableContainer>
					<Table size='small'>
						<TableBody>
							{item.custom_fields?.map((customfield, i) => (
								<TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
									<TableCell padding='checkbox' size='small' align='right'>
										{customfield.name}:
									</TableCell>
									<TableCell size='small' align='left'>
										{customfield.value}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Collapse>
		</>
	);
}

export type ItemCardProps = {
	item: ItemType | MemberItemType;
	editable?: boolean;
};
export default function ItemCard({ item, editable }: ItemCardProps) {
	const { user } = useSupabase();
	const { data: profile } = useGetProfile();

	const [expanded, setExpanded] = React.useState(false);

	const handleExpand = (event: React.MouseEvent<HTMLElement>) => {
		setExpanded(!expanded);
	};

	return (
		<>
			<Grid item xs={12}>
				<Paper
					sx={{
						p: 2,
						margin: 'auto',
						flexGrow: 1,
						display: { sm: 'flex', xs: 'none' },
					}}
				>
					<Grid container spacing={2}>
						{item.image && (
							<Grid item>
								<ButtonBase>
									<img alt={item.name} src={item.image} style={{ objectFit: 'cover', width: 150, height: 150, borderRadius: 4 }} />
								</ButtonBase>
							</Grid>
						)}

						<Grid item xs={12} sm container>
							<Grid item xs container direction='column' spacing={2}>
								<Grid item xs>
									<Typography component='div' variant='h6'>
										{item.name}
									</Typography>
									<Typography variant='body1' gutterBottom>
										{item.description}
									</Typography>
									{item.custom_fields?.map((c) => (
										<Typography variant='body2' color='text.secondary'>
											{c.name}: {c.value}
										</Typography>
									))}
									{profile?.enable_lists && (
										<Stack direction='row' justifyContent='flex-start' spacing={1} sx={{ mt: 0.5 }}>
											{item.lists?.map((l) => (
												<Chip label={l.list.name} size='small' />
											))}
										</Stack>
									)}
								</Grid>
								{(!editable || (item.links && item.links.length > 0)) && (
									<Grid item>
										<Stack direction='row' justifyContent='flex-start' spacing={1} useFlexGap flexWrap='wrap'>
											{!editable && item.user_id !== user.id && <ItemStatus item={item as MemberItemType} />}

											{item.links?.map((link, i) => (
												<Button key={i} href={link} target='_blank' color='info' size='small'>
													{ExtractDomain(link)}
												</Button>
											))}
										</Stack>
									</Grid>
								)}
							</Grid>
							<Grid item>{editable && <VertMenu item={item} />}</Grid>
						</Grid>
					</Grid>
				</Paper>

				{/* Mobile card */}
				<Card sx={{ display: { sm: 'none', xs: 'block' } }}>
					{item.image && <CardMedia component='img' alt={item.name} sx={{ height: 240 }} image={item.image} />}

					<CardContent>
						<Grid container justifyContent='flex-start' spacing={2}>
							<Grid item xs>
								<Typography variant='h5' component='div'>
									{item.name}
								</Typography>
								<Typography gutterBottom variant='body2' color='text.secondary'>
									{item.description}
								</Typography>
							</Grid>
							{editable && (
								<Grid item>
									<VertMenu item={item} />
								</Grid>
							)}
							{profile?.enable_lists && editable && (
								<Grid item xs={12}>
									<Stack direction='row' justifyContent='flex-start' spacing={1}>
										{item.lists?.map((l) => (
											<Chip label={l.list.name} size='small' />
										))}
									</Stack>
								</Grid>
							)}

							{(!editable || (item.links && item.links.length > 0)) && (
								<Grid item xs={12}>
									<Stack direction='row' justifyContent='flex-start' spacing={1} useFlexGap flexWrap='wrap'>
										{!editable && item.user_id !== user.id && <ItemStatus item={item as MemberItemType} />}

										{item.links?.map((link, i) => (
											<Button key={i} href={link} target='_blank' color='info' size='small'>
												{ExtractDomain(link)}
											</Button>
										))}
									</Stack>
								</Grid>
							)}
						</Grid>
					</CardContent>

					{item.custom_fields && item.custom_fields?.length !== 0 && <CustomFieldExpand handleExpand={handleExpand} expanded={expanded} item={item} />}
				</Card>
			</Grid>
		</>
	);
}
