import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { groupTourProgress, useCreateGroup, useGetGroups, useGetTour, useUpdateTour } from '../lib/useSupabase';
import { useSnackbar } from '../lib/snackbar';

import { Plus, UserPlus } from 'lucide-react';

import ImageCropper from './ImageCropper';
import TourTooltip, { TourContent } from './TourTooltip';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';

export default function GroupCreate() {
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const { data: groups } = useGetGroups();

	const open = location.hash === '#new-group';

	const [name, setName] = React.useState('');
	const [image, setImage] = React.useState<string | undefined>();

	const createGroup = useCreateGroup();
	const handleCreate = async () => {
		createGroup
			.mutateAsync({ name: name.trim(), invite_link: true, image: image })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to create group! ${err.message}`, { variant: 'error' });
			});
	};

	const handleClose = async () => {
		setName('');
		navigate('#'); // close dialog

		if (!tour?.group_create_fab || !tour?.group_create_image) {
			updateTour.mutateAsync({
				group_create_fab: true,
				group_create_image: true,
			});
		}
	};

	//
	// User tour
	const addGroupFab = React.useRef(null);
	const [fabLoaded, setFabLoaded] = React.useState<boolean>(false);
	const [dialogOpenedTour, setDialogOpenedTour] = React.useState<boolean>(false);
	const [imageDialogOpen, setImageDialogOpen] = React.useState<boolean>(false);
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();

	React.useEffect(() => {
		if (addGroupFab.current) setFabLoaded(true);
	}, [addGroupFab]);

	React.useEffect(() => {
		if (open) {
			setTimeout(() => {
				setDialogOpenedTour(true);
			}, 250);
		} else {
			setDialogOpenedTour(false);
		}
	}, [open]);

	return (
		<>
			<button
				type='button'
				{...({ 'tour-element': 'group_create_fab' } as object)}
				ref={addGroupFab}
				aria-label='add'
				onClick={() => {
					navigate('#new-group');
					if (!tour?.group_create_fab) {
						updateTour.mutateAsync({
							group_nav: true,
							group_create_fab: true,
						});
					}
				}}
				className='fixed right-2 bottom-20 z-30 flex size-14 cursor-pointer items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-all outline-none hover:bg-primary-hover hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95 md:right-4 md:bottom-4'
			>
				<UserPlus className='size-6' />
			</button>

			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (!next) handleClose();
				}}
			>
				<DialogContent fullScreenOnMobile>
					<DialogHeader>
						<DialogTitle>Create Group</DialogTitle>
						<DialogDescription>Share your gift lists with your friends and family.</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						<div className='flex justify-center'>
							<ImageCropper
								onClick={() => {
									setImageDialogOpen(true);
									if (!tour?.group_create_image) {
										updateTour.mutateAsync({
											group_create_image: true,
										});
									}
								}}
								onClose={() => {
									setImageDialogOpen(false);
								}}
								tour_element='group_create_image'
								value={image}
								onChange={setImage}
								aspectRatio={1}
							/>
						</div>

						<FormField label='Group Name' required>
							<Input required value={name} onChange={(e) => setName(e.target.value)} />
						</FormField>

						<div className='flex justify-end gap-2'>
							<Button variant='ghost' onClick={handleClose}>
								Cancel
							</Button>

							<Button onClick={handleCreate} loading={createGroup.isLoading} disabled={name.trim().length <= 0}>
								Create
								<Plus />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{fabLoaded && groups?.filter((g) => g.my_membership[0].invite).length === 0 && tour && (
				<>
					<TourTooltip
						open={groupTourProgress(tour, false) === 'group_create_fab' && location.hash === ''}
						anchorEl={document.querySelector('[tour-element="group_create_fab"]')}
						placement='top-end'
						content={
							<TourContent title='Start a group here'>
								<p>A group is a circle of people — family, friends, coworkers — who can see each other's items.</p>
								<div className='mt-1 flex justify-end'>
									<Button
										variant='secondary'
										size='sm'
										onClick={() => {
											if (!tour?.group_create_fab) {
												updateTour.mutateAsync({
													group_nav: true,
													group_create_fab: true,
													group_create_image: true,
												});
											}
										}}
										loading={updateTour.isLoading}
									>
										Next
									</Button>
								</div>
							</TourContent>
						}
						mask
						allowClick
					/>
				</>
			)}

			{/* The name field needs no callout - its label says what it is. */}
			{fabLoaded && dialogOpenedTour && !imageDialogOpen && groups?.filter((g) => g.my_membership[0].invite).length === 0 && tour && location.hash === '#new-group' && (
				<TourTooltip
					open={groupTourProgress(tour, false) === 'group_create_image'}
					anchorEl={document.querySelector('[tour-element="group_create_image"]')}
					placement='bottom'
					content={
						<div>
							<p>Add a photo of you and your family or friends so the group is easy to spot.</p>
							<div className='mt-1 flex justify-end'>
								<Button
									variant='secondary'
									size='sm'
									onClick={() => {
										updateTour.mutateAsync({
											group_create_image: true,
										});
									}}
									loading={updateTour.isLoading}
								>
									Got it
								</Button>
							</div>
						</div>
					}
				/>
			)}
		</>
	);
}
