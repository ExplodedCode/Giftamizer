import React, { useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useDeleteList, useGetLists, DEFAULT_LIST_ID, useGetTour, useUpdateTour, listTourProgress } from '../lib/useSupabase/hooks';
import { ListType, TourSteps } from '../lib/useSupabase/types';

import { useSnackbar } from '../lib/snackbar';
import { TransitionGroup } from 'react-transition-group';
import { UseMutationResult } from '@tanstack/react-query';
import { Baby, ClipboardList, EllipsisVertical, Pencil, Trash2, TriangleAlert } from 'lucide-react';

import ListCreate from '../components/ListCreate';
import ListUpdate from '../components/ListUpdate';
import TourTooltip, { TourContent } from '../components/TourTooltip';

import { Button } from '../components/ui/button';
import { Chip } from '../components/ui/chip';
import { Collapse } from '../components/ui/collapse';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { PageHeader } from '../components/ui/page-header';
import { Spinner } from '../components/ui/spinner';
import { TourHint } from '../components/ui/tour-hint';
import { UserAvatar } from '../components/ui/avatar';

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

	const [open, setOpen] = React.useState(false);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);

		if (next && !tour?.list_menu) {
			updateTour.mutateAsync({
				list_menu: true,
			});
		}
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
		<div className='group flex items-center gap-1 rounded-xl border border-border bg-card p-2 shadow-xs transition-shadow hover:shadow-sm'>
			<button type='button' onClick={() => navigate(`/lists/${list.id}`)} className='flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50'>
				<UserAvatar
					src={list.image}
					alt={list.name}
					fallback={list.child_list ? <Baby className='size-5' /> : <ClipboardList className='size-5' />}
					className={list.id === DEFAULT_LIST_ID ? 'size-10' : 'size-10 [&_[data-slot=avatar-fallback]]:bg-muted [&_[data-slot=avatar-fallback]]:text-muted-foreground'}
				/>

				<div className='flex min-w-0 flex-col gap-1'>
					<span className='truncate text-sm font-medium'>{list.name}</span>
					{list.groups.length === 0 ? (
						<span className='flex flex-col text-xs'>
							<span className='flex items-center gap-1 font-semibold text-status-planned'>
								<TriangleAlert className='size-3.5' />
								This list is not assigned any groups!
							</span>
							<span className='text-muted-foreground italic'>Add this list to a groups for the items to be visible to others.</span>
						</span>
					) : (
						<span className='flex flex-wrap gap-1'>
							{list.groups.map((g) => (
								<Chip key={g.id} size='sm'>
									{g.name}
								</Chip>
							))}
						</span>
					)}
				</div>
			</button>

			<DropdownMenu open={open} onOpenChange={handleOpenChange}>
				<DropdownMenuTrigger asChild>
					<button
						type='button'
						{...({ 'tour-element': index === 0 ? 'list_menu' : undefined } as object)}
						aria-label='list menu'
						className='flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
					>
						<EllipsisVertical className='size-5' />
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align='end'>
					<TourHint
						title={<p className='font-semibold'>Edit your {list.name} list and add it to one more more groups!</p>}
						placement='top-end'
						open={showTour && listTourProgress(tour ?? {}) === 'list_edit' && location.hash === ''}
					>
						<DropdownMenuItem
							{...({ 'tour-element': index === 0 ? 'list_edit' : undefined } as object)}
							onClick={() => {
								if (!tour?.list_edit) {
									updateTour.mutateAsync({
										list_edit: true,
									});
								}

								if (handleListEdit !== undefined) handleListEdit(list);
							}}
						>
							<Pencil />
							Edit
						</DropdownMenuItem>
					</TourHint>

					<DropdownMenuItem
						onClick={() => {
							handleDelete(list.id);
						}}
						disabled={list.id === DEFAULT_LIST_ID} // don't allow delete of default list
					>
						<Trash2 />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export default function Lists() {
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
			<PageHeader crumbs={[{ label: 'Lists' }]} />

			{listTourProgress(tour ?? {}) === 'list_intro' && location.hash === '' && (
				<div className='fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 p-4'>
					<div className='max-w-[550px] rounded-xl bg-primary p-5 text-primary-foreground shadow-xl'>
						<TourContent title='Get Started with Lists!'>
							<p>Lists allow you to have more control over who can see specific items. Even create seperate managed lists for your kids or pets.</p>

							<div className='mt-1 rounded-lg bg-status-planned/20 p-3 text-sm'>
								<p className='mb-1 flex items-center gap-1.5 font-bold'>
									<TriangleAlert className='size-4' />
									Item Assignment
								</p>
								<p>
									To ensure that your items are visible to others in a group, you must assign your lists to a group, <b>and</b> items must be assigned to a list
								</p>
							</div>

							<div className='mt-2 flex justify-end'>
								<Button
									variant='secondary'
									size='sm'
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
								</Button>
							</div>
						</TourContent>
					</div>
				</div>
			)}

			<div className='mx-auto max-w-xl px-4 pt-6 pb-12'>
				{lists && (
					<>
						<TransitionGroup component={null}>
							{[...lists.filter((l) => l.id === DEFAULT_LIST_ID)!, ...lists.filter((l) => l.id !== DEFAULT_LIST_ID)!]?.map((list, index) => (
								<Collapse key={list.id} className='[&>*]:mb-2'>
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
									content={<p className='font-semibold'>Edit your {lists?.find((l) => l.id === DEFAULT_LIST_ID)?.name} list add it to a group!</p>}
									mask
									allowClick
								/>
							</>
						)}
					</>
				)}

				{isLoading && (
					<div className='mt-32 flex justify-center'>
						<Spinner size={32} />
					</div>
				)}
			</div>

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
