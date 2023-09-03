import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
	Tooltip,
	Box,
	Alert,
	AlertTitle,
} from '@mui/material';
import { Archive, Close, Delete, DeleteForever, Edit, ExpandMore, MoreVert, Restore, Unarchive } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import ItemUpdate from '../components/ItemUpdate';

import { ExtractDomain, useArchiveItem, useDeleteItem, useGetProfile, useRefreshItem, useRestoreItem, useSupabase, useUpdateItemStatus } from '../lib/useSupabase';
import { ItemStatuses, ItemType, MemberItemType } from '../lib/useSupabase/types';

interface VertMenuProps {
	item: ItemType | MemberItemType;
}
function VertMenu({ item }: VertMenuProps) {
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();

	const { data: profile } = useGetProfile();

	const [itemEdit, setItemEdit] = React.useState<ItemType | null>(null);
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

	const open = Boolean(anchorEl);

	const handleVertMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleVertMenuClose = () => {
		setAnchorEl(null);
	};

	const archiveItem = useArchiveItem();
	const handleArchive = async (id: string, archive: boolean) => {
		await archiveItem.mutateAsync({ id: id, archive: archive }).catch((err) => {
			enqueueSnackbar(`Unable to ${archive ? '' : 'un'}archive item! ${err.message}`, { variant: 'error' });
		});
	};

	const deleteItem = useDeleteItem();
	const handleDelete = async (id: string, deleted: boolean) => {
		await deleteItem.mutateAsync({ id: id, deleted: deleted }).catch((err) => {
			enqueueSnackbar(`Unable to delete item! ${err.message}`, { variant: 'error' });
		});
	};

	const restoreItem = useRestoreItem();
	const handleRestore = async (id: string) => {
		await restoreItem.mutateAsync(id).catch((err) => {
			enqueueSnackbar(`Unable to restore item! ${err.message}`, { variant: 'error' });
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
				{!item.archived && !item.deleted && (
					<MenuItem
						onClick={() => {
							setItemEdit(item);
							navigate('#item-edit'); // open dialog
							handleVertMenuClose();
						}}
					>
						<ListItemIcon>
							<Edit fontSize='small' />
						</ListItemIcon>
						<ListItemText>Edit</ListItemText>
					</MenuItem>
				)}

				{profile?.enable_archive && !item.deleted && (
					<MenuItem
						onClick={() => {
							handleArchive(item.id, !item.archived);
							handleVertMenuClose();
						}}
					>
						<ListItemIcon>{item.archived ? <Unarchive fontSize='small' /> : <Archive fontSize='small' />}</ListItemIcon>
						<ListItemText>{item.archived ? 'Unarchive' : 'Archive'}</ListItemText>
					</MenuItem>
				)}
				{!item.deleted ? (
					<MenuItem
						onClick={() => {
							handleDelete(item.id, item.deleted);
							handleVertMenuClose();
						}}
					>
						<ListItemIcon>{profile?.enable_trash ? <Delete fontSize='small' /> : <DeleteForever fontSize='small' />}</ListItemIcon>
						<ListItemText>{profile?.enable_trash ? 'Trash' : 'Delete'}</ListItemText>
					</MenuItem>
				) : (
					<>
						<MenuItem
							onClick={() => {
								handleRestore(item.id);
								handleVertMenuClose();
							}}
						>
							<ListItemIcon>
								<Restore fontSize='small' />
							</ListItemIcon>
							<ListItemText>Restore</ListItemText>
						</MenuItem>
						<MenuItem
							onClick={() => {
								handleDelete(item.id, item.deleted);
								handleVertMenuClose();
							}}
						>
							<ListItemIcon>
								<DeleteForever fontSize='small' />
							</ListItemIcon>
							<ListItemText>Delete</ListItemText>
						</MenuItem>
					</>
				)}
			</Menu>

			<ItemUpdate
				item={itemEdit}
				onClose={() => {
					navigate('#'); // close dialog
					setItemEdit(null);
				}}
			/>
		</>
	);
}

interface ItemStatusProps {
	item: MemberItemType;
	claimError: string | undefined;
	setClaimError(claimError: string | undefined): void;
}
function ItemStatus({ item, claimError, setClaimError }: ItemStatusProps) {
	const theme = useTheme();

	const { enqueueSnackbar } = useSnackbar();
	const { user } = useSupabase();

	const { group: groupID, user: userID } = useParams();
	const user_id = userID?.split('_')[0] ?? userID!;
	const list_id = userID?.split('_')[1] ?? undefined;

	const refreshItem = useRefreshItem(groupID!, user_id, list_id);
	const updateItemStatus = useUpdateItemStatus(groupID!, user_id, list_id);
	const handleUpdateItemStatus = async (status: ItemStatuses) => {
		await updateItemStatus.mutateAsync({ item_id: item.id, user_id: user.id, status: status }).catch(async (err) => {
			switch (err.code) {
				case '42501':
					enqueueSnackbar(`This item was just claimed by someone else!`, { variant: 'error' });
					setClaimError(`This item was just claimed by someone else!`);
					await refreshItem.mutateAsync(item.id);
					break;

				default:
					enqueueSnackbar(`Unable to update item status! ${err.message}`, { variant: 'error' });
					break;
			}
		});
	};
	return (
		<>
			<Tooltip
				title={(() => {
					switch (item.status?.status) {
						default:
							return 'Mark as Planned';
						case ItemStatuses.planned:
							return 'Mark as Purchased';
						case ItemStatuses.unavailable:
							return 'Mark as Available';
					}
				})()}
				placement='right'
			>
				<LoadingButton
					className={claimError && 'error-shake'}
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
						item.status?.user_id !== user.id && !claimError
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
									pointer: 'not-allowed',
									pointerEvents: 'all',
							  }
							: {}
					}
				>
					<span style={claimError ? { textDecoration: 'line-through' } : {}}>
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
					</span>
				</LoadingButton>
			</Tooltip>
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
	const [claimError, setClaimError] = React.useState<string | undefined>();

	const handleExpand = (event: React.MouseEvent<HTMLElement>) => {
		setExpanded(!expanded);
	};

	return (
		<>
			<Grid item xs={12}>
				<Paper
					sx={{
						display: { sm: 'block', xs: 'none' },
					}}
				>
					<Box
						sx={{
							p: 2,
							margin: 'auto',
							flexGrow: 1,
							display: 'flex',
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
												{!editable && item.user_id !== user.id && <ItemStatus item={item as MemberItemType} claimError={claimError} setClaimError={setClaimError} />}

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
					</Box>

					<ItemUnassignedAlert open={profile?.enable_lists && item.lists?.length === 0} />
					<ItemAlert alert={claimError} setAlert={setClaimError} />
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
										{!editable && item.user_id !== user.id && <ItemStatus item={item as MemberItemType} claimError={claimError} setClaimError={setClaimError} />}

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

					<ItemUnassignedAlert open={profile?.enable_lists && item.lists?.length === 0} />
					<ItemAlert alert={claimError} setAlert={setClaimError} />
				</Card>
			</Grid>
		</>
	);
}

interface ItemAlertProps {
	alert: string | undefined;
	setAlert(claimError: string | undefined): void;
}
function ItemAlert({ alert, setAlert }: ItemAlertProps) {
	return (
		<Box sx={{ width: '100%' }}>
			<Collapse in={alert !== undefined}>
				<Alert
					severity='error'
					action={
						<IconButton
							aria-label='close'
							color='inherit'
							size='small'
							onClick={() => {
								setAlert(undefined);
							}}
						>
							<Close fontSize='inherit' />
						</IconButton>
					}
				>
					{alert}
				</Alert>
			</Collapse>
		</Box>
	);
}

interface ItemUnassignedAlertProps {
	open?: boolean;
}
function ItemUnassignedAlert({ open }: ItemUnassignedAlertProps) {
	return (
		<Box sx={{ width: '100%' }}>
			<Collapse in={open}>
				<Collapse in={alert !== undefined}>
					<Alert severity='warning'>This item is not assigned to a list!</Alert>
				</Collapse>
			</Collapse>
		</Box>
	);
}
