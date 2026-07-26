import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { listTourProgress, useGetGroups, useGetTour, useUpdateLists, useUpdateTour } from '../lib/useSupabase/hooks';
import { GroupType, ListType } from '../lib/useSupabase/types';

import { useSnackbar } from '../lib/snackbar';

import { Save } from 'lucide-react';

import GroupSelector from './GroupSelector';
import ImageCropper from './ImageCropper';
import TourTooltip from './TourTooltip';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

type ListUpdateProps = {
	list: ListType | null;
	onClose: () => void;
};

export default function ListUpdate({ list, onClose }: ListUpdateProps) {
	const { enqueueSnackbar } = useSnackbar();
	const location = useLocation();

	const open = location.hash === '#list-edit';

	const { data: groups } = useGetGroups();

	const [name, setName] = React.useState('');
	const [selectedGroups, setSelectedGroups] = React.useState<Omit<GroupType, 'image_token' | 'my_membership'>[]>([]);
	const [childList, setChildList] = React.useState<boolean>(false);
	const [image, setImage] = React.useState<string | undefined>();
	const [bio, setBio] = React.useState<string | undefined>();

	const updateLists = useUpdateLists();
	const handleSave = async () => {
		if (list) {
			await updateLists
				.mutateAsync({ id: list.id, name: name.trim(), child_list: childList, image: image, bio: bio, groups: selectedGroups })
				.then(() => {
					onClose();
				})
				.catch((err) => {
					enqueueSnackbar(`Unable to update list! ${err.message}`, { variant: 'error' });
				});
		}
	};

	useEffect(() => {
		if (list) {
			setName(list.name);
			setSelectedGroups(list.groups);
			setChildList(list.child_list);
			setImage(list.image);
			setBio(list.bio);
		}
	}, [list]);

	//
	// User tour
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();

	const [showTour, setShowTour] = React.useState<boolean>(false);
	React.useEffect(() => {
		if (open) {
			setTimeout(() => {
				setShowTour(true);
			}, 250);
		} else {
			setShowTour(false);
		}
	}, [open]);

	return (
		<>
			<Dialog
				open={list !== null && open}
				onOpenChange={(next) => {
					if (!next && !updateLists.isLoading) onClose();
				}}
			>
				<DialogContent fullScreenOnMobile dismissible={!updateLists.isLoading}>
					<DialogHeader>
						<DialogTitle>Edit List</DialogTitle>
						<DialogDescription>Organize your wishlist into categories, making it easier for others to find the perfect gift for you.</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						{childList && (
							<div className='flex justify-center'>
								<ImageCropper value={image} onChange={setImage} aspectRatio={1} />
							</div>
						)}

						<FormField label='Name' required>
							<Input required value={name} onChange={(e) => setName(e.target.value)} disabled={updateLists.isLoading} />
						</FormField>

						<GroupSelector
							groups={groups?.filter((g) => g.my_membership[0].invite === false) as Omit<GroupType, 'image_token' | 'my_membership'>[]}
							value={selectedGroups}
							onChange={setSelectedGroups}
							disabled={updateLists.isLoading}
						/>

						{childList && (
							<FormField label='Bio' helperText={`${bio?.length} / 250`}>
								<Textarea rows={3} maxLength={250} value={bio} onChange={(e) => setBio(e.target.value)} />
							</FormField>
						)}

						<div className='flex justify-end gap-2'>
							<Button variant='ghost' onClick={onClose} disabled={updateLists.isLoading}>
								Cancel
							</Button>

							<Button onClick={handleSave} disabled={name.trim().length === 0} loading={updateLists.isLoading}>
								Save
								<Save />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{showTour && open && tour && groups && (
				<>
					<TourTooltip
						open={listTourProgress(tour ?? {}) === 'list_group_assign'}
						anchorEl={document.querySelector('[tour-element="list_group_assign"]')}
						placement='top'
						content={
							<div>
								<p>Assign your list to a group here.</p>
								<div className='mt-1 flex justify-end'>
									<Button
										variant='secondary'
										size='sm'
										onClick={() => {
											updateTour.mutateAsync({
												list_group_assign: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Got it
									</Button>
								</div>
							</div>
						}
						allowClick
					/>
				</>
			)}
		</>
	);
}
