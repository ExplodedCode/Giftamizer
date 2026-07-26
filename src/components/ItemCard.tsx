import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Baby, ClipboardList, ExternalLink, Gift, X } from 'lucide-react';

import ItemCardMenu from './ItemCardMenu';
import ItemStatus from './ItemStatus';
import ItemUpdate from '../components/ItemUpdate';

import { ExtractDomain, StandardizeURL, useGetProfile } from '../lib/useSupabase';
import { ItemType, MemberItemType } from '../lib/useSupabase/types';

import { cn } from '../lib/utils';
import { Card } from './ui/card';
import { Chip } from './ui/chip';
import { Collapse } from './ui/collapse';
import { Dialog, DialogContent } from './ui/dialog';
import { Skeleton } from './ui/skeleton';
import { SimpleTooltip } from './ui/tooltip';
import { UserAvatar } from './ui/avatar';

export type ItemCardProps = {
	index: number;
	item: ItemType | MemberItemType;
	editable?: boolean;
};
export default function ItemCard({ index, item, editable }: ItemCardProps) {
	const { data: profile } = useGetProfile();

	const navigate = useNavigate();

	const [dialogImage, setDialogImage] = React.useState<string | null>(null);
	const [dialogPrevImage, setDialogPrevImage] = React.useState<string | null>(null);

	const [itemEdit, setItemEdit] = React.useState<ItemType | null>(null);

	const [claimError, setClaimError] = React.useState<string | undefined>();

	// Archived and trashed items keep their menu (Unarchive/Restore) but are not click-to-edit,
	// matching the menu's own Edit guard.
	const canEdit = !!editable && !item.archived && !item.deleted;
	const handleEdit = () => {
		setItemEdit(item);
		navigate('#item-edit'); // open dialog
	};

	// Child lists surface under the list's own name and avatar, not the managing parent's.
	const ownerList = 'profile' in item ? item.items_lists?.[0]?.lists : undefined;
	const ownerProfile = 'profile' in item ? item.profile : undefined;
	const ownerName = ownerList?.child_list ? ownerList.name : ownerProfile ? `${ownerProfile.first_name} ${ownerProfile.last_name}` : undefined;
	const ownerImage = (ownerList?.child_list ? ownerList.image : ownerProfile?.image) ?? '/defaultAvatar.png';

	const showClaim = !editable || !!item.shopping_item;
	const showChips = !!profile?.enable_lists && (item.lists?.length ?? 0) > 0;
	const showActions = showClaim || (item.links?.length ?? 0) > 0;

	const handleChipKey = (e: React.KeyboardEvent, list_id: string) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			navigate(`/lists/${list_id}`);
		}
	};

	const linkButtons = item.links?.map((link, i) => (
		<a
			key={`${item.id}-link-${i}`}
			href={StandardizeURL(link)}
			target='_blank'
			rel='noreferrer'
			className='inline-flex h-8 max-w-48 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
		>
			<ExternalLink className='size-3.5 shrink-0 text-muted-foreground' />
			<span className='truncate'>{item.domains?.[i] ?? ExtractDomain(link)}</span>
		</a>
	));

	return (
		<>
			<Card className={cn('overflow-hidden transition-shadow', canEdit && 'hover:shadow-md')}>
				<div className='relative flex gap-3 p-3 sm:gap-4 sm:p-4'>
					{/* Full-row edit target. A sibling overlay rather than a wrapper: a <button> may not contain
					    the image button, chips, links or menu below it, and this way no descendant needs
					    stopPropagation — they simply paint above it via `relative z-10`. Trade-off: title and
					    description text is not selectable on your own cards. */}
					{canEdit && (
						<button
							type='button'
							data-slot='item-card-edit'
							aria-label={`Edit ${item.name}`}
							onClick={handleEdit}
							className='absolute inset-0 cursor-pointer rounded-xl outline-none focus-visible:inset-ring-2 focus-visible:inset-ring-ring/50'
						/>
					)}

					{item.image ? (
						<button
							type='button'
							aria-label={`View image of ${item.name}`}
							onClick={() => setDialogImage(item.image ?? null)}
							className='relative z-10 size-24 shrink-0 cursor-zoom-in self-start overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:size-30'
						>
							<img alt={item.name} src={item.image} loading='lazy' decoding='async' className='size-full object-cover' />
						</button>
					) : (
						/* Keeps the left rail constant so every title starts at the same x — the strongest
						   scanning cue in a single-column list. */
						<div aria-hidden className='flex size-24 shrink-0 items-center justify-center self-start rounded-lg bg-muted text-muted-foreground sm:size-30'>
							<Gift className='size-8 opacity-40' />
						</div>
					)}

					<div className='flex min-w-0 flex-1 flex-col gap-1.5'>
						{ownerName && (
							<div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
								<UserAvatar alt={ownerName} src={ownerImage} className='size-6' />
								<span className='truncate'>{ownerName}</span>
							</div>
						)}

						<p className='line-clamp-2 font-semibold sm:text-lg'>{item.name}</p>
						{item.description && (
							<p className='line-clamp-2 text-sm text-muted-foreground' title={item.description}>
								{item.description}
							</p>
						)}

						{(item.custom_fields?.length ?? 0) > 0 && (
							<div className='flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground'>
								{item.custom_fields?.map((c) => (
									<span key={`${item.id}-field-${c.id}`}>
										{c.name}: <span className='font-medium text-foreground'>{c.value}</span>
									</span>
								))}
							</div>
						)}

						{showChips && (
							<div className='relative z-10 flex flex-wrap gap-1.5 pt-0.5'>
								{item.lists?.map((l) => (
									<Chip
										key={`${item.id}-list-${l.list_id}`}
										size='sm'
										icon={l.list.child_list ? <Baby /> : <ClipboardList />}
										role='button'
										tabIndex={0}
										onClick={() => navigate(`/lists/${l.list_id}`)}
										onKeyDown={(e) => handleChipKey(e, l.list_id)}
									>
										{l.list.name}
									</Chip>
								))}
							</div>
						)}

						{showActions && (
							<div className='relative z-10 mt-auto flex flex-wrap items-center gap-2 pt-1.5'>
								{showClaim && <ItemStatus index={index} item={item as MemberItemType} claimError={claimError} setClaimError={setClaimError} />}

								{linkButtons}
							</div>
						)}
					</div>

					{editable && (
						<div className='relative z-10 shrink-0 self-start'>
							<ItemCardMenu item={item} onEdit={handleEdit} />
						</div>
					)}
				</div>

				{/* Outside the `relative` wrapper, so the edit overlay can never cover ItemAlert's close button. */}
				<ItemUnassignedAlert open={profile?.enable_lists && item.lists?.length === 0 && !item.shopping_item} />
				<ItemAlert alert={claimError} setAlert={setClaimError} />
			</Card>

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
							alt={item.name}
							className='w-full cursor-zoom-out'
							onClick={() => {
								setDialogPrevImage(dialogImage);
								setDialogImage(null);
							}}
						/>
					</SimpleTooltip>
				</DialogContent>
			</Dialog>

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

/** Matches the ItemCard row so list pages don't reflow when data lands. */
export function ItemCardSkeleton() {
	return (
		<Card className='overflow-hidden'>
			<div className='flex gap-3 p-3 sm:gap-4 sm:p-4'>
				<Skeleton className='size-24 shrink-0 sm:size-30' />

				<div className='flex min-w-0 flex-1 flex-col gap-2'>
					<Skeleton className='h-5 w-1/2' />
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-2/3' />

					<div className='mt-auto flex gap-2 pt-1'>
						<Skeleton className='h-8 w-24' />
						<Skeleton className='h-8 w-20' />
					</div>
				</div>

				<Skeleton className='size-9 shrink-0' />
			</div>
		</Card>
	);
}

export function ItemCardSkeletonList({ count = 4 }: { count?: number }) {
	return (
		<div className='flex flex-col gap-3'>
			{Array.from({ length: count }).map((_, i) => (
				<ItemCardSkeleton key={i} />
			))}
		</div>
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
