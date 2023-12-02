import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Collapse,
	Paper,
	ButtonBase,
	Tooltip,
	Box,
	Alert,
	Dialog,
	Slide,
	useMediaQuery,
	DialogActions,
	ListItemAvatar,
	Avatar,
	ListItem,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Archive, Close, Delete, DeleteForever, Edit, MoreVert, Restore, Unarchive } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import ItemUpdate from '../components/ItemUpdate';

import {
	ExtractDomain,
	FakeDelay,
	SUPABASE_URL,
	StandardizeURL,
	groupTourProgress,
	useArchiveItem,
	useDeleteItem,
	useGetProfile,
	useGetTour,
	useRefreshItem,
	useRestoreItem,
	useSupabase,
	useUpdateItemStatus,
	useUpdateTour,
} from '../lib/useSupabase';
import { ItemStatuses, ItemType, MemberItemType } from '../lib/useSupabase/types';
import HtmlTooltip from './HtmlTooltip';

const Transition = React.forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement<any, any>;
	},
	ref: React.Ref<unknown>
) {
	return <Slide direction='up' ref={ref} {...props} />;
});

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
		await deleteItem.mutateAsync({ id: id, deleted: deleted, shopping_item: item.shopping_item !== null }).catch((err) => {
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

				{profile?.enable_archive && !item.deleted && !item.shopping_item && (
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
						<ListItemIcon>{profile?.enable_trash && !item.shopping_item ? <Delete fontSize='small' /> : <DeleteForever fontSize='small' />}</ListItemIcon>
						<ListItemText>{profile?.enable_trash && !item.shopping_item ? 'Trash' : 'Delete'}</ListItemText>
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

			{itemEdit && (
				<ItemUpdate
					item={itemEdit}
					onClose={() => {
						navigate('#'); // close dialog
						setItemEdit(null);
					}}
					shoppingItem={item.shopping_item !== null}
				/>
			)}
		</>
	);
}

interface ItemStatusProps {
	index: number;
	item: MemberItemType;
	claimError: string | undefined;
	setClaimError(claimError: string | undefined): void;
}
function ItemStatus({ index, item, claimError, setClaimError }: ItemStatusProps) {
	const theme = useTheme();
	const location = useLocation();

	const { enqueueSnackbar } = useSnackbar();
	const { user } = useSupabase();

	const { group: groupID, user: userID } = useParams();
	const user_id = userID?.split('_')[0] ?? userID!;
	const list_id = userID?.split('_')[1] ?? undefined;

	const refreshItem = useRefreshItem(groupID!, user_id, list_id);
	const updateItemStatus = useUpdateItemStatus(groupID!, user_id, list_id, item.shopping_item !== null);
	const handleUpdateItemStatus = async (status: ItemStatuses) => {
		await updateItemStatus.mutateAsync({ item_id: item.id, user_id: user.id, status: status }).catch(async (err) => {
			switch (err.code) {
				case '42501':
					enqueueSnackbar(`This item was just claimed by someone else!`, { variant: 'error' });
					setClaimError(`This item was just claimed by someone else!`);
					await FakeDelay(4000);
					await refreshItem.mutateAsync(item.id);
					break;

				default:
					enqueueSnackbar(`Unable to update item status! ${err.message}`, { variant: 'error' });
					break;
			}
		});
	};

	// user tour
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const claimButton = () => {
		return (
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
				disabled={claimError !== undefined || (item.status?.user_id !== undefined && item.status?.user_id !== user.id)}
				sx={
					item.status?.user_id !== user.id && !claimError
						? {
								'&.Mui-disabled': {
									color: (() => {
										switch (item.status?.status) {
											default:
												return theme.palette.success.main + 80;
											case ItemStatuses.planned:
												return theme.palette.warning.main + 80;
											case ItemStatuses.unavailable:
												return theme.palette.error.main + 80;
										}
									})(),
									border: (() => {
										switch (item.status?.status) {
											default:
												return `1px solid ${theme.palette.success.main}80`;
											case ItemStatuses.planned:
												return `1px solid ${theme.palette.warning.main}80`;
											case ItemStatuses.unavailable:
												return `1px solid ${theme.palette.error.main}80`;
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
								return 'Purchased';
						}
					})()}
				</span>
			</LoadingButton>
		);
	};

	return (
		<>
			{index === 0 &&
			location.hash === '' &&
			location.pathname.startsWith('/groups/') &&
			(groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status' || groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status_taken') ? (
				<HtmlTooltip
					title={
						<>
							{groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status' && (
								<>
									<Typography variant='h6' gutterBottom>
										Item Claim Status:
									</Typography>

									<Paper elevation={6} sx={{ p: 1 }}>
										<Grid>
											<Grid item xs={12} sx={{ mb: 1 }}>
												<Button
													size='small'
													variant='outlined'
													color='success'
													sx={{
														'&.Mui-disabled': {
															border: `1px solid ${theme.palette.success.main}80`,
															color: theme.palette.success.main,
														},
														pointer: 'not-allowed',
														pointerEvents: 'all',
													}}
													disabled
												>
													Available
												</Button>
												<Typography sx={{ ml: 0.5, mt: 0.5, display: 'inline' }}> - Available for purchase</Typography>
											</Grid>
											<Grid item xs={12} sx={{ mb: 1 }}>
												<Button
													size='small'
													variant='outlined'
													color='warning'
													disabled
													sx={{
														'&.Mui-disabled': {
															border: `1px solid ${theme.palette.warning.main}80`,
															color: theme.palette.warning.main,
														},
													}}
												>
													Planned
												</Button>
												<Typography sx={{ ml: 0.5, mt: 0.5, display: 'inline' }}> - Planned for purchase</Typography>
											</Grid>
											<Grid
												item
												xs={12}
												//  sx={{ mb: 1 }}
											>
												<Button
													size='small'
													variant='outlined'
													color='error'
													disabled
													sx={{
														'&.Mui-disabled': {
															border: `1px solid ${theme.palette.error.main}80`,
															color: theme.palette.error.main,
														},
													}}
												>
													Purchased
												</Button>
												<Typography sx={{ ml: 0.5, mt: 0.5, display: 'inline' }}> - Purchased</Typography>
											</Grid>
										</Grid>
									</Paper>
									<DialogActions>
										<LoadingButton
											variant='outlined'
											color='inherit'
											onClick={() => {
												if (!tour?.group_member_item_status) {
													updateTour.mutateAsync({
														group_member_item_status: true,
													});
												}
											}}
											loading={updateTour.isLoading}
										>
											Next
										</LoadingButton>
									</DialogActions>
								</>
							)}

							{groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status_taken' && (
								<>
									<Typography variant='body1' gutterBottom>
										Disabled Buttons will indicate that the item has been claimed by someone else.
									</Typography>

									<Paper elevation={6} sx={{ p: 1 }}>
										<Grid>
											<Grid item xs={12} sx={{ mb: 1 }}>
												<Button
													size='small'
													variant='outlined'
													color='warning'
													disabled
													sx={{
														'&.Mui-disabled': {
															color: theme.palette.warning.main + 80,
														},
													}}
												>
													Planned
												</Button>
												<Typography sx={{ ml: 0.5, mt: 0.5, display: 'inline' }}> - Planned by someone else</Typography>
											</Grid>
											<Grid item xs={12}>
												<Button
													size='small'
													variant='outlined'
													color='error'
													disabled
													sx={{
														'&.Mui-disabled': {
															color: theme.palette.error.main + 80,
														},
													}}
												>
													Purchased
												</Button>
												<Typography sx={{ ml: 0.5, mt: 0.5, display: 'inline' }}> - Purchased by someone else</Typography>
											</Grid>
										</Grid>
									</Paper>
									<DialogActions>
										<LoadingButton
											variant='outlined'
											color='inherit'
											onClick={() => {
												if (!tour?.group_member_item_status_taken) {
													updateTour.mutateAsync({
														group_member_item_status_taken: true,
													});
												}
											}}
											loading={updateTour.isLoading}
										>
											Got it
										</LoadingButton>
									</DialogActions>
								</>
							)}
						</>
					}
					placement='bottom-start'
					arrow
					open
				>
					{claimButton()}
				</HtmlTooltip>
			) : (
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
					arrow
				>
					{claimButton()}
				</Tooltip>
			)}
		</>
	);
}

export type ItemCardProps = {
	index: number;
	item: ItemType | MemberItemType;
	editable?: boolean;
};
export default function ItemCard({ index, item, editable }: ItemCardProps) {
	const theme = useTheme();

	const { user } = useSupabase();
	const { data: profile } = useGetProfile();

	const navigate = useNavigate();

	const [dialogImage, setDialogImage] = React.useState<string | null>(null);
	const [dialogPrevImage, setDialogPrevImage] = React.useState<string | null>(null);

	const [claimError, setClaimError] = React.useState<string | undefined>();

	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<>
			<Grid item xs={12}>
				{!isMobile ? (
					<Paper>
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
										<ButtonBase onClick={() => setDialogImage(item.image ?? null)} sx={{ cursor: 'zoom-in' }}>
											<img alt={item.name} src={item.image} style={{ objectFit: 'cover', width: 150, height: 150, borderRadius: 4 }} />
										</ButtonBase>
									</Grid>
								)}
								<Grid item xs={12} sm container>
									<Grid item xs container direction='column' spacing={2}>
										<Grid item xs>
											{'profile' in item && (
												<ListItem sx={{ p: 0 }}>
													{item.profile && (
														<ListItemAvatar>
															<Avatar
																alt={item.items_lists?.[0]?.lists.child_list ? item.items_lists?.[0]?.lists.name : item.profile.first_name}
																src={
																	item.items_lists?.[0]?.lists.child_list
																		? item.items_lists?.[0]?.lists.avatar_token
																			? `${SUPABASE_URL}/storage/v1/object/public/lists/${item.items_lists?.[0]?.lists.id}?${item.items_lists?.[0]?.lists.avatar_token}`
																			: '/defaultAvatar.png'
																		: item.profile.avatar_token && item.profile.avatar_token !== -1
																		? `${SUPABASE_URL}/storage/v1/object/public/avatars/${item.profile.user_id}?${item.profile.avatar_token}`
																		: '/defaultAvatar.png'
																}
															/>
														</ListItemAvatar>
													)}

													<ListItemText
														primary={item.items_lists?.[0]?.lists.child_list ? item.items_lists?.[0]?.lists.name : `${item.profile?.first_name} ${item.profile?.last_name}`}
													/>
												</ListItem>
											)}

											<Typography component='div' variant='h6'>
												{item.name}
											</Typography>
											<Typography variant='body1' gutterBottom>
												{item.description}
											</Typography>
											{item.custom_fields?.map((c) => (
												<Typography key={`${item.id}-field-${c.id}`} variant='body2' color='text.secondary'>
													{c.name}: <b>{c.value}</b>
												</Typography>
											))}
											{profile?.enable_lists && (
												<Stack direction='row' justifyContent='flex-start' useFlexGap flexWrap='wrap' spacing={1} sx={{ mt: 0.5 }}>
													{item.lists?.map((l) => (
														<Chip key={`${item.id}-list-${l.list_id}`} label={l.list.name} size='small' clickable onClick={() => navigate(`/lists/${l.list_id}`)} />
													))}
												</Stack>
											)}
										</Grid>
										{(!editable || item.shopping_item || (item.links && item.links.length > 0)) && (
											<Grid item>
												<Stack direction='row' justifyContent='flex-start' spacing={1} useFlexGap flexWrap='wrap'>
													{((!editable && item.user_id !== user.id) || item.shopping_item) && (
														<ItemStatus index={index} item={item as MemberItemType} claimError={claimError} setClaimError={setClaimError} />
													)}

													{item.links?.map((link, i) => (
														<Button key={`${item.id + i}-link-${i}`} href={StandardizeURL(link)} target='_blank' color='info' size='small'>
															{item.domains?.[i] ?? ExtractDomain(link)}
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

						<ItemUnassignedAlert open={profile?.enable_lists && item.lists?.length === 0 && !item.shopping_item} />
						<ItemAlert alert={claimError} setAlert={setClaimError} />
					</Paper>
				) : (
					<Card>
						{'profile' in item && (
							<ListItem sx={{ p: 1 }}>
								{item.profile?.image && (
									<ListItemAvatar>
										<Avatar src={item.profile?.image} />
									</ListItemAvatar>
								)}

								<ListItemText primary={`${item.profile?.first_name} ${item.profile?.last_name}`} />
							</ListItem>
						)}

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
									{item.custom_fields?.map((c) => (
										<Typography key={`${item.id}-field-${c.id}`} variant='body2' color='text.secondary'>
											{c.name}: <b>{c.value}</b>
										</Typography>
									))}
								</Grid>
								{editable && (
									<Grid item>
										<VertMenu item={item} />
									</Grid>
								)}
								{profile?.enable_lists && editable && (
									<Grid item xs={12}>
										<Stack direction='row' justifyContent='flex-start' useFlexGap flexWrap='wrap' spacing={1}>
											{item.lists?.map((l, i) => (
												<Chip key={`${item.id + i}-list-${l.list_id}`} label={l.list.name} size='small' clickable onClick={() => navigate(`/lists/${l.list_id}`)} />
											))}
										</Stack>
									</Grid>
								)}

								{(!editable || item.shopping_item || (item.links && item.links.length > 0)) && (
									<Grid item xs={12}>
										<Stack direction='row' justifyContent='flex-start' spacing={1} useFlexGap flexWrap='wrap'>
											{((!editable && item.user_id !== user.id) || item.shopping_item) && (
												<ItemStatus index={index} item={item as MemberItemType} claimError={claimError} setClaimError={setClaimError} />
											)}

											{item.links?.map((link, i) => (
												<Button key={`${item.id + i}-link-${i}`} href={StandardizeURL(link)} target='_blank' color='info' size='small'>
													{item.domains?.[i] ?? ExtractDomain(link)}
												</Button>
											))}
										</Stack>
									</Grid>
								)}
							</Grid>
						</CardContent>
						<ItemUnassignedAlert open={profile?.enable_lists && item.lists?.length === 0 && !item.shopping_item} />
						<ItemAlert alert={claimError} setAlert={setClaimError} />
					</Card>
				)}
			</Grid>
			<Dialog
				maxWidth='md'
				fullWidth
				TransitionComponent={Transition}
				onClose={() => {
					setDialogPrevImage(dialogImage);
					setDialogImage(null);
				}}
				open={dialogImage !== null}
			>
				<Tooltip title='Click to hide image' arrow placement='top'>
					<img
						src={dialogImage ?? dialogPrevImage ?? ''}
						alt='dialog-img'
						style={{ width: '100%', cursor: 'zoom-out' }}
						onClick={() => {
							setDialogPrevImage(dialogImage);
							setDialogImage(null);
						}}
					/>
				</Tooltip>
			</Dialog>
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
