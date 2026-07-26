import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSnackbar } from '../lib/snackbar';

import { ExtractURLFromText, useGetProfile, useSupabase, useUpdateItems } from '../lib/useSupabase';
import { CustomField, ItemType, ListType, MemberItemType, Profile } from '../lib/useSupabase/types';

import { Link2, Plus, Save, Trash2 } from 'lucide-react';

import ListSelector from './ListSelector';
import ImageCropper from './ImageCropper';
import UserSearchSingle from './UserSearchSingle';

import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Collapse } from './ui/collapse';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { LinearProgress } from './ui/spinner';
import { SimpleTooltip } from './ui/tooltip';

type ItemUpdateProps = {
	item: ItemType | MemberItemType;
	onClose: () => void;
	shoppingItem?: boolean;
};

export default function ItemUpdate({ item, onClose, shoppingItem }: ItemUpdateProps) {
	const { enqueueSnackbar } = useSnackbar();
	const location = useLocation();

	const open = location.hash === '#item-edit';

	const { user, client } = useSupabase();
	const { data: profile } = useGetProfile();

	const [image, setImage] = React.useState<string | undefined>();
	const [availableImages, setAvailableImages] = React.useState<string[]>([]);
	const [name, setName] = React.useState('');
	const [description, setDescription] = React.useState('');
	const [links, setLinks] = React.useState<string[]>(['']);
	const [customFields, setCustomFields] = React.useState<CustomField[]>([]);
	const [lists, setLists] = React.useState<ListType[]>([]);

	// @ts-ignore
	const [selectedUser, setSelectedUser] = React.useState<Profile | undefined>(item?.profile);

	const updateItems = useUpdateItems();
	const handleSave = async () => {
		if (item) {
			await updateItems
				.mutateAsync({
					user_id: user.id,
					id: item.id,
					image: image,
					name: name.trim(),
					description: description,
					links: links.map((l) => l.trim()).filter((l) => l.trim().length !== 0),
					custom_fields: customFields,
					lists: item.lists,
					newLists: profile?.enable_lists ? lists : [],
					shopping_item: selectedUser?.user_id ?? null,
				})
				.then(() => {
					onClose();
				})
				.catch((err) => {
					enqueueSnackbar(`Unable to update item! ${err.message}`, { variant: 'error' });
				});
		}
	};

	useEffect(() => {
		if (item) {
			setImage(item.image);
			setMetaImage(item.image);
			setAvailableImages([]);

			setName(item.name);
			setDescription(item.description);
			setLinks(item?.links?.length === 0 ? [''] : item?.links ?? ['']);
			setCustomFields(item?.custom_fields ?? []);
			setLists(
				item.lists?.map((l) => {
					return {
						id: l.list_id,
						user_id: user.id,
						name: l.list.name,
						child_list: l.list.child_list,
						groups: [],
					};
				}) ?? []
			);
		}
	}, [item, user, open]);

	const [metaImage, setMetaImage] = React.useState<string | undefined>();
	const [metaLoading, setMetaloading] = React.useState(false);
	const getUrlMetadata = async (url: string) => {
		const { data, error } = await client.functions.invoke('url-metadata', {
			body: {
				url: url,
			},
		});

		if (error) {
			console.log(error);
			enqueueSnackbar(`Unable to get item information.`, {
				variant: 'error',
			});
			setMetaloading(false);
		} else if (data.name === '' && data.description === '' && data.image === null) {
			enqueueSnackbar(`No item information found.`, {
				variant: 'warning',
			});
			setMetaloading(false);
		} else {
			if (data?.title) setName(data?.title);
			if (data?.description) setDescription(data?.description);
			if (data?.images) {
				setImage(data?.images[0]);
				setMetaImage(data?.images[0]);
				setAvailableImages(data?.images);
			}

			if (data?.price) {
				setCustomFields([
					...customFields,
					{
						id: customFields.length,
						name: 'Price',
						value: data.price,
					},
				]);
			}

			setMetaloading(false);
		}
	};

	return (
		<Dialog
			open={item !== null && open}
			onOpenChange={(next) => {
				if (!next && !updateItems.isLoading) onClose();
			}}
		>
			<DialogContent fullScreenOnMobile dismissible={!updateItems.isLoading}>
				<DialogHeader>
					<DialogTitle>Edit Item</DialogTitle>
				</DialogHeader>

				<div className='flex flex-col gap-4'>
					<div className='flex justify-center'>
						<ImageCropper value={image} onChange={setImage} square importedImage={metaImage} />
					</div>

					<Collapse in={availableImages.length > 0}>
						<div className='flex gap-2 overflow-x-auto py-1'>
							{availableImages.map((img, index) => (
								<SimpleTooltip key={index} title='Use this image'>
									<button
										type='button'
										onClick={() => {
											setImage(img);
											setMetaImage(img);
										}}
										className={cn(
											'size-[100px] shrink-0 cursor-pointer overflow-hidden rounded-full border-2 transition-colors',
											image === img ? 'border-primary' : 'border-border hover:border-primary/60'
										)}
									>
										<img src={img} alt={`Image-${index}`} className='size-full object-cover' />
									</button>
								</SimpleTooltip>
							))}
						</div>
					</Collapse>

					{shoppingItem && item && <UserSearchSingle selectedUser={selectedUser!} setSelectedUser={setSelectedUser} label='Gift For' required />}

					<FormField label='Name' required>
						<Input required value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
					</FormField>

					<FormField label='Description'>
						<Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={250} />
					</FormField>

					{links.map((link, index) => (
						<div key={index}>
							<FormField label='URL'>
								<div className='relative'>
									<Input
										value={link}
										maxLength={2000}
										className='pr-10'
										onChange={(e) => {
											let value = e.target.value;
											let extractedUrl = ExtractURLFromText(value)[0];

											setLinks(links.map((l, i) => (i === index ? value : l)));

											// @ts-ignore
											if (e.nativeEvent.inputType === 'insertFromPaste' && index === 0 && extractedUrl.startsWith('http')) {
												setLinks(links.map((l, i) => (i === index ? extractedUrl : l)));

												setMetaloading(true);
												getUrlMetadata(extractedUrl);
											}
										}}
									/>
									<SimpleTooltip title={index === 0 ? 'Add another URL' : 'Remove URL'} side='left'>
										<button
											type='button'
											onClick={() => {
												if (index === 0) {
													setLinks([...links, '']);
												} else {
													setLinks(links.filter((l, i) => i !== index));
												}
											}}
											disabled={links.length === 5 && index === 0}
											className='absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40'
										>
											{index === 0 ? <Link2 className='size-4' /> : <Trash2 className='size-4' />}
										</button>
									</SimpleTooltip>
								</div>
							</FormField>
							{index === 0 && metaLoading && <LinearProgress className='mt-1' />}
						</div>
					))}

					{customFields.map((field, index) => (
						<div key={index} className='grid grid-cols-12 gap-3'>
							<FormField label={`Custom Field ${index + 1}`} className='col-span-5'>
								<Input
									value={customFields.find((f) => f.id === field.id)?.name}
									maxLength={25}
									onChange={(e) => {
										setCustomFields(customFields.map((f, i) => (f.id === field.id ? { ...f, name: e.target.value } : f)));
									}}
								/>
							</FormField>

							<FormField label='Value' className='col-span-7'>
								<div className='relative'>
									<Input
										value={customFields.find((f) => f.id === field.id)?.value}
										maxLength={50}
										className='pr-10'
										onChange={(e) => {
											setCustomFields(customFields.map((f, i) => (f.id === field.id ? { ...f, value: e.target.value } : f)));
										}}
									/>
									<SimpleTooltip title='Remove Field' side='left'>
										<button
											type='button'
											onClick={() => {
												setCustomFields(customFields.filter((f) => f.id !== field.id));
											}}
											className='absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
										>
											<Trash2 className='size-4' />
										</button>
									</SimpleTooltip>
								</div>
							</FormField>
						</div>
					))}

					{profile?.enable_lists && !shoppingItem && <ListSelector value={lists} onChange={(v) => setLists(v)} />}

					<div className='flex items-center justify-between gap-2'>
						<Button variant='outline' size='sm' onClick={() => setCustomFields([...customFields, { id: customFields.length, name: '', value: '' }])} disabled={customFields.length === 10}>
							<Plus />
							Field
						</Button>

						<div className='flex items-center gap-2'>
							<Button variant='ghost' onClick={onClose} disabled={updateItems.isLoading}>
								Cancel
							</Button>

							<Button onClick={handleSave} disabled={name.trim().length === 0} loading={updateItems.isLoading}>
								Save
								<Save />
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
