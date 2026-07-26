import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useSupabase } from '../lib/useSupabase';
import { GroupType } from '../lib/useSupabase/types';
import { useCreateList, useGetGroups } from '../lib/useSupabase/hooks';

import { useSnackbar } from '../lib/snackbar';

import { ListPlus, Plus } from 'lucide-react';

import GroupSelector from './GroupSelector';
import ImageCropper from './ImageCropper';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { LabeledSwitch } from './ui/switch';

export default function CreateList() {
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const { user } = useSupabase();

	const createList = useCreateList();
	const { data: groups } = useGetGroups();

	const open = location.hash === '#new-list';

	const [name, setName] = React.useState('');
	const [selectedGroups, setSelectedGroups] = React.useState<Omit<GroupType, 'image_token' | 'my_membership'>[]>([]);
	const [childList, setChildList] = React.useState<boolean>(false);
	const [image, setImage] = React.useState<string | undefined>();
	const [bio, setBio] = React.useState('');

	const handleCreate = async () => {
		console.log(selectedGroups);

		await createList
			.mutateAsync({ user_id: user.id, name: name.trim(), child_list: childList, image: image, bio: bio, groups: selectedGroups })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to create list! ${err.message}`, { variant: 'error' });
			});
	};

	const handleClose = async () => {
		setName('');
		setSelectedGroups([]);
		setChildList(false);
		setImage(undefined);
		setBio('');

		navigate('#'); // close dialog
	};

	return (
		<>
			<button
				type='button'
				aria-label='add'
				onClick={() => navigate('#new-list')}
				className='fixed right-2 bottom-20 z-30 flex size-14 cursor-pointer items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-all outline-none hover:bg-primary-hover hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95 md:right-4 md:bottom-4'
			>
				<ListPlus className='size-6' />
			</button>

			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (!next && !createList.isLoading) handleClose();
				}}
			>
				<DialogContent fullScreenOnMobile dismissible={!createList.isLoading}>
					<DialogHeader>
						<DialogTitle>Create List</DialogTitle>
						<DialogDescription>Organize your wishlist into categories, making it easier for others to find the perfect gift for you.</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						{childList && (
							<div className='flex justify-center'>
								<ImageCropper value={image} onChange={setImage} aspectRatio={1} />
							</div>
						)}

						<FormField label='Name' required>
							<Input required value={name} onChange={(e) => setName(e.target.value)} disabled={createList.isLoading} />
						</FormField>

						<GroupSelector
							groups={groups?.filter((g) => g.my_membership[0].invite === false) as Omit<GroupType, 'image_token' | 'my_membership'>[]}
							value={selectedGroups}
							onChange={setSelectedGroups}
							disabled={createList.isLoading}
						/>

						<div className='flex flex-col gap-1'>
							<LabeledSwitch label='Display Separately in Groups' checked={childList} onCheckedChange={(checked) => setChildList(checked === true)} disabled={createList.isLoading} />
							<p className='text-xs text-status-planned'>This can only be set when creating a new list.</p>
						</div>

						{childList && (
							<FormField label='Bio' helperText={`${bio.length} / 250`}>
								<Textarea rows={3} maxLength={250} value={bio} onChange={(e) => setBio(e.target.value)} />
							</FormField>
						)}

						<div className='flex justify-end gap-2'>
							<Button variant='ghost' onClick={handleClose} disabled={createList.isLoading}>
								Cancel
							</Button>

							<Button onClick={handleCreate} disabled={name.trim().length === 0} loading={createList.isLoading}>
								Create
								<Plus />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
