import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../lib/snackbar';

import { Archive, ArchiveRestore, EllipsisVertical, History, Pencil, Trash2, X } from 'lucide-react';

import ItemUpdate from '../components/ItemUpdate';

import {
	ExtractDomain,
	FakeDelay,
	StandardizeURL,
	groupTourProgress,
	useActiveTourLeg,
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

import { cn, useMediaQuery } from '../lib/utils';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Chip } from './ui/chip';
import { Collapse } from './ui/collapse';
import { ConfirmDialog } from './ui/confirm-dialog';
import { Dialog, DialogContent } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Spinner } from './ui/spinner';
import { SimpleTooltip } from './ui/tooltip';
import { TourHint } from './ui/tour-hint';
import { UserAvatar } from './ui/avatar';

interface VertMenuProps {
	item: ItemType | MemberItemType;
}
function VertMenu({ item }: VertMenuProps) {
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();

	const { data: profile } = useGetProfile();

	const [itemEdit, setItemEdit] = React.useState<ItemType | null>(null);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

	const archiveItem = useArchiveItem();
	const handleArchive = async (id: string, archive: boolean) => {
		await archiveItem.mutateAsync({ id: id, archive: archive }).catch((err) => {
			enqueueSnackbar(`Unable to ${archive ? '' : 'un'}archive item! ${err.message}`, { variant: 'error' });
		});
	};

	const deleteItem = useDeleteItem();
	// Mirrors the branch in useDeleteItem: this is the only combination that moves the item to the
	// recoverable trash, every other case destroys it and needs a confirmation first.
	const movesToTrash = !!profile?.enable_trash && !item.deleted && item.shopping_item === null;
	const handleDelete = async (id: string, deleted: boolean) => {
		await deleteItem
			.mutateAsync({ id: id, deleted: deleted, shopping_item: item.shopping_item !== null })
			.then(() => {
				setConfirmDeleteOpen(false);
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to delete item! ${err.message}`, { variant: 'error' });
			});
	};
	const requestDelete = () => {
		if (movesToTrash) {
			handleDelete(item.id, item.deleted);
		} else {
			setConfirmDeleteOpen(true);
		}
	};

	const restoreItem = useRestoreItem();
	const handleRestore = async (id: string) => {
		await restoreItem.mutateAsync(id).catch((err) => {
			enqueueSnackbar(`Unable to restore item! ${err.message}`, { variant: 'error' });
		});
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type='button'
						aria-label='item menu'
						className='flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
					>
						<EllipsisVertical className='size-5' />
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align='end'>
					{!item.archived && !item.deleted && (
						<DropdownMenuItem
							onClick={() => {
								setItemEdit(item);
								navigate('#item-edit'); // open dialog
							}}
						>
							<Pencil />
							Edit
						</DropdownMenuItem>
					)}

					{profile?.enable_archive && !item.deleted && !item.shopping_item && (
						<DropdownMenuItem
							onClick={() => {
								handleArchive(item.id, !item.archived);
							}}
						>
							{item.archived ? <ArchiveRestore /> : <Archive />}
							{item.archived ? 'Unarchive' : 'Archive'}
						</DropdownMenuItem>
					)}
					{!item.deleted ? (
						<DropdownMenuItem onClick={requestDelete}>
							<Trash2 />
							{movesToTrash ? 'Trash' : 'Delete'}
						</DropdownMenuItem>
					) : (
						<>
							<DropdownMenuItem
								onClick={() => {
									handleRestore(item.id);
								}}
							>
								<History />
								Restore
							</DropdownMenuItem>
							<DropdownMenuItem onClick={requestDelete}>
								<Trash2 />
								Delete
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			<ConfirmDialog
				open={confirmDeleteOpen}
				onOpenChange={setConfirmDeleteOpen}
				title={`Delete ${item.name}?`}
				description={`This action is permanent! ${item.deleted ? 'This item will be removed from the trash and cannot be recovered.' : 'This item cannot be recovered.'}`}
				confirmText='Yes, Delete it'
				destructive
				loading={deleteItem.isLoading}
				onConfirm={() => handleDelete(item.id, item.deleted)}
			/>

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

/** Demo status chip used inside the tour legend callouts. */
function DemoStatusButton({ variant, faded, children }: { variant: 'available' | 'planned' | 'purchased'; faded?: boolean; children: React.ReactNode }) {
	return (
		<span
			className={cn(
				'inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium uppercase',
				variant === 'available' && (faded ? 'border-status-available/50 text-status-available/50' : 'border-status-available text-status-available'),
				variant === 'planned' && (faded ? 'border-status-planned/50 text-status-planned/50' : 'border-status-planned text-status-planned'),
				variant === 'purchased' && (faded ? 'border-status-purchased/50 text-status-purchased/50' : 'border-status-purchased text-status-purchased')
			)}
		>
			{children}
		</span>
	);
}

interface ItemStatusProps {
	index: number;
	item: MemberItemType;
	claimError: string | undefined;
	setClaimError(claimError: string | undefined): void;
}
function ItemStatus({ index, item, claimError, setClaimError }: ItemStatusProps) {
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
	const activeTourLeg = useActiveTourLeg();
	const isMobile = useMediaQuery('(max-width: 599.95px)');

	const claimedByOther = item.status?.user_id !== undefined && item.status?.user_id !== user.id;
	const isDisabled = claimError !== undefined || claimedByOther;

	const claimButton = () => {
		const statusStyle = (() => {
			switch (item.status?.status) {
				default:
					return claimedByOther && !claimError ? 'border-status-available/50 text-status-available/50' : 'border-status-available text-status-available hover:bg-status-available/10';
				case ItemStatuses.planned:
					return claimedByOther && !claimError ? 'border-status-planned/50 text-status-planned/50' : 'border-status-planned text-status-planned hover:bg-status-planned/10';
				case ItemStatuses.unavailable:
					return claimedByOther && !claimError ? 'border-status-purchased/50 text-status-purchased/50' : 'border-status-purchased text-status-purchased hover:bg-status-purchased/10';
			}
		})();

		return (
			<button
				type='button'
				className={cn(
					'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold tracking-wide uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
					statusStyle,
					claimError && 'error-shake',
					isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
				)}
				onClick={() => {
					if (isDisabled || updateItemStatus.isLoading) return;
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
			>
				{updateItemStatus.isLoading && <Spinner size={14} className='text-current' />}
				<span className={cn(claimError && 'line-through')}>
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
			</button>
		);
	};

	return (
		<>
			{index === 0 &&
			location.hash === '' &&
			location.pathname.startsWith('/groups/') &&
			activeTourLeg === 'group' &&
			(groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status' || groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status_taken') ? (
				<TourHint
					placement='bottom-start'
					open
					title={
						<>
							{groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status' && (
								<div className='flex flex-col gap-2'>
									<p className='text-base font-semibold'>Claim an item</p>
									<p>Click the status button to cycle it, so nobody buys the same gift twice.</p>

									<div className='flex flex-col gap-2 rounded-lg bg-card p-2.5 text-card-foreground'>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='available'>Available</DemoStatusButton>
											<span className='text-sm'>— nobody has claimed it</span>
										</div>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='planned'>Planned</DemoStatusButton>
											<span className='text-sm'>— you intend to buy it</span>
										</div>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='purchased'>Purchased</DemoStatusButton>
											<span className='text-sm'>— you've bought it</span>
										</div>
									</div>

									<div className='flex justify-end'>
										<Button
											variant='secondary'
											size='sm'
											loading={updateTour.isLoading}
											onClick={() => {
												if (!tour?.group_member_item_status) {
													updateTour.mutateAsync({
														group_member_item_status: true,
													});
												}
											}}
										>
											Next
										</Button>
									</div>
								</div>
							)}

							{groupTourProgress(tour ?? {}, isMobile) === 'group_member_item_status_taken' && (
								<div className='flex flex-col gap-2'>
									<p>A faded, unclickable button means someone else got there first.</p>

									<div className='flex flex-col gap-2 rounded-lg bg-card p-2.5 text-card-foreground'>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='planned' faded>
												Planned
											</DemoStatusButton>
											<span className='text-sm'>— someone else plans to buy it</span>
										</div>
										<div className='flex items-center gap-2'>
											<DemoStatusButton variant='purchased' faded>
												Purchased
											</DemoStatusButton>
											<span className='text-sm'>— someone else already bought it</span>
										</div>
									</div>

									<div className='flex justify-end'>
										<Button
											variant='secondary'
											size='sm'
											loading={updateTour.isLoading}
											onClick={() => {
												if (!tour?.group_member_item_status_taken) {
													updateTour.mutateAsync({
														group_member_item_status_taken: true,
													});
												}
											}}
										>
											Got it
										</Button>
									</div>
								</div>
							)}
						</>
					}
				>
					{claimButton()}
				</TourHint>
			) : (
				<SimpleTooltip
					side='right'
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
				>
					{claimButton()}
				</SimpleTooltip>
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
	const { user } = useSupabase();
	const { data: profile } = useGetProfile();

	const navigate = useNavigate();

	const [dialogImage, setDialogImage] = React.useState<string | null>(null);
	const [dialogPrevImage, setDialogPrevImage] = React.useState<string | null>(null);

	const [claimError, setClaimError] = React.useState<string | undefined>();

	const isMobile = useMediaQuery('(max-width: 599.95px)');

	const linkButtons = item.links?.map((link, i) => (
		<a
			key={`${item.id + i}-link-${i}`}
			href={StandardizeURL(link)}
			target='_blank'
			rel='noreferrer'
			className='inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-sky-600 transition-colors hover:bg-sky-500/10 dark:text-sky-400'
		>
			{item.domains?.[i] ?? ExtractDomain(link)}
		</a>
	));

	const customFields = item.custom_fields?.map((c) => (
		<p key={`${item.id}-field-${c.id}`} className='text-sm text-muted-foreground'>
			{c.name}: <b className='text-foreground'>{c.value}</b>
		</p>
	));

	return (
		<>
			{!isMobile ? (
				/* ------------------------------ Desktop card ------------------------------ */
				<Card className='overflow-hidden'>
					<div className='flex gap-4 p-4'>
						{item.image && (
							<button type='button' onClick={() => setDialogImage(item.image ?? null)} className='shrink-0 cursor-zoom-in self-start outline-none focus-visible:ring-2 focus-visible:ring-ring/50'>
								<img alt={item.name} src={item.image} className='size-[150px] rounded-lg object-cover' />
							</button>
						)}

						<div className='flex min-w-0 flex-1 flex-col gap-2'>
							{'profile' in item && (
								<div className='flex items-center gap-2.5'>
									{item.profile && (
										<UserAvatar
											alt={item.items_lists?.[0]?.lists.child_list ? item.items_lists?.[0]?.lists.name : item.profile.first_name}
											src={(item.items_lists?.[0]?.lists.child_list ? item.items_lists?.[0]?.lists.image : item.profile.image) ?? '/defaultAvatar.png'}
											className='size-9'
										/>
									)}
									<span className='text-sm font-medium'>
										{item.items_lists?.[0]?.lists.child_list ? item.items_lists?.[0]?.lists.name : `${item.profile?.first_name} ${item.profile?.last_name}`}
									</span>
								</div>
							)}

							<div className='flex flex-col gap-1'>
								<p className='text-lg font-semibold'>{item.name}</p>
								{item.description && <p className='text-sm text-muted-foreground'>{item.description}</p>}
								{customFields}
							</div>

							{profile?.enable_lists && (item.lists?.length ?? 0) > 0 && (
								<div className='flex flex-wrap gap-1.5'>
									{item.lists?.map((l) => (
										<Chip key={`${item.id}-list-${l.list_id}`} size='sm' onClick={() => navigate(`/lists/${l.list_id}`)}>
											{l.list.name}
										</Chip>
									))}
								</div>
							)}

							{(!editable || item.shopping_item || (item.links && item.links.length > 0)) && (
								<div className='mt-auto flex flex-wrap items-center gap-2 pt-1'>
									{(!editable || item.shopping_item) && <ItemStatus index={index} item={item as MemberItemType} claimError={claimError} setClaimError={setClaimError} />}

									{linkButtons}
								</div>
							)}
						</div>

						{editable && (
							<div className='shrink-0'>
								<VertMenu item={item} />
							</div>
						)}
					</div>

					<ItemUnassignedAlert open={profile?.enable_lists && item.lists?.length === 0 && !item.shopping_item} />
					<ItemAlert alert={claimError} setAlert={setClaimError} />
				</Card>
			) : (
				/* ------------------------------- Mobile card ------------------------------- */
				<Card className='overflow-hidden'>
					{'profile' in item && (
						<div className='flex items-center gap-2.5 p-2.5'>
							{item.profile?.image && <UserAvatar src={item.profile?.image} alt={item.profile?.first_name} className='size-9' />}
							<span className='text-sm font-medium'>{`${item.profile?.first_name} ${item.profile?.last_name}`}</span>
						</div>
					)}

					{item.image && <img alt={item.name} src={item.image} className='h-[220px] w-full cursor-zoom-in object-cover' onClick={() => setDialogImage(item.image ?? null)} />}

					<div className='flex flex-col gap-3 p-4'>
						<div className='flex justify-between gap-2'>
							<div className='min-w-0 flex-1'>
								<p className='text-lg font-semibold'>{item.name}</p>
								{item.description && <p className='text-sm text-muted-foreground'>{item.description}</p>}
								{customFields}
							</div>
							{editable && (
								<div className='shrink-0'>
									<VertMenu item={item} />
								</div>
							)}
						</div>

						{profile?.enable_lists && editable && (item.lists?.length ?? 0) > 0 && (
							<div className='flex flex-wrap gap-1.5'>
								{item.lists?.map((l, i) => (
									<Chip key={`${item.id + i}-list-${l.list_id}`} size='sm' onClick={() => navigate(`/lists/${l.list_id}`)}>
										{l.list.name}
									</Chip>
								))}
							</div>
						)}

						{(!editable || item.shopping_item || (item.links && item.links.length > 0)) && (
							<div className='flex flex-wrap items-center gap-2'>
								{((!editable && item.user_id !== user.id) || item.shopping_item) && (
									<ItemStatus index={index} item={item as MemberItemType} claimError={claimError} setClaimError={setClaimError} />
								)}

								{linkButtons}
							</div>
						)}
					</div>

					<ItemUnassignedAlert open={profile?.enable_lists && item.lists?.length === 0 && !item.shopping_item} />
					<ItemAlert alert={claimError} setAlert={setClaimError} />
				</Card>
			)}

			{/* Image lightbox */}
			<Dialog
				open={dialogImage !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDialogPrevImage(dialogImage);
						setDialogImage(null);
					}
				}}
			>
				<DialogContent size='lg' hideCloseButton className='overflow-hidden p-0'>
					<SimpleTooltip title='Click to hide image' side='top'>
						<img
							src={dialogImage ?? dialogPrevImage ?? ''}
							alt='dialog-img'
							className='w-full cursor-zoom-out'
							onClick={() => {
								setDialogPrevImage(dialogImage);
								setDialogImage(null);
							}}
						/>
					</SimpleTooltip>
				</DialogContent>
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
		<Collapse in={alert !== undefined}>
			<div className='flex items-center justify-between gap-2 bg-destructive/10 px-4 py-2.5 text-sm text-destructive'>
				<span>{alert}</span>
				<button
					type='button'
					aria-label='close'
					className='cursor-pointer rounded-md p-1 transition-colors hover:bg-destructive/15'
					onClick={() => {
						setAlert(undefined);
					}}
				>
					<X className='size-4' />
				</button>
			</div>
		</Collapse>
	);
}

interface ItemUnassignedAlertProps {
	open?: boolean;
}
function ItemUnassignedAlert({ open }: ItemUnassignedAlertProps) {
	return (
		<Collapse in={!!open}>
			<div className='bg-status-planned/10 px-4 py-2.5 text-sm text-status-planned'>This item is not assigned to a list!</div>
		</Collapse>
	);
}
