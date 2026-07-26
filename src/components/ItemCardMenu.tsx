import React from 'react';
import { useSnackbar } from '../lib/snackbar';

import { Archive, ArchiveRestore, EllipsisVertical, History, Pencil, Trash2 } from 'lucide-react';

import { useArchiveItem, useDeleteItem, useGetProfile, useRestoreItem } from '../lib/useSupabase';
import { ItemType, MemberItemType } from '../lib/useSupabase/types';

import { ConfirmDialog } from './ui/confirm-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

export interface ItemCardMenuProps {
	item: ItemType | MemberItemType;
	/** Owned by ItemCard — the card body is an edit target too, so both entry points share one flow. */
	onEdit: () => void;
}
export default function ItemCardMenu({ item, onEdit }: ItemCardMenuProps) {
	const { enqueueSnackbar } = useSnackbar();

	const { data: profile } = useGetProfile();

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
						<DropdownMenuItem onClick={onEdit}>
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

					{item.deleted && (
						<DropdownMenuItem
							onClick={() => {
								handleRestore(item.id);
							}}
						>
							<History />
							Restore
						</DropdownMenuItem>
					)}

					<DropdownMenuSeparator />
					<DropdownMenuItem variant='destructive' onClick={requestDelete}>
						<Trash2 />
						{movesToTrash ? 'Trash' : 'Delete'}
					</DropdownMenuItem>
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
		</>
	);
}
