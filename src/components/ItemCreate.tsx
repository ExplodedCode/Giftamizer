import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useSnackbar } from '../lib/snackbar';

import { Link2, Plus, ShoppingCart, Trash2 } from 'lucide-react';

import { useSupabase, useCreateItem, useGetProfile, ExtractURLFromText, useUpdateTour, itemTourProgress, useGetTour, useGetItems, SKIP_ITEM_TOUR } from '../lib/useSupabase';
import { CustomField, ListType, Profile } from '../lib/useSupabase/types';

import ListSelector from './ListSelector';
import ImageCropper from './ImageCropper';
import TourTooltip, { TourContent, TourSkipButton } from './TourTooltip';
import UserSearchSingle from './UserSearchSingle';

import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Collapse } from './ui/collapse';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { LinearProgress } from './ui/spinner';
import { SimpleTooltip } from './ui/tooltip';

interface ItemCreateProps {
	defaultList?: ListType;
	shoppingItem?: boolean;
}
export default function ItemCreate({ defaultList, shoppingItem }: ItemCreateProps) {
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const open = location.hash === '#create-item';

	const [image, setImage] = React.useState<string | undefined>();
	const [availableImages, setAvailableImages] = React.useState<string[]>([]);
	const [name, setName] = React.useState('');
	const [description, setDescription] = React.useState('');
	const [links, setLinks] = React.useState<string[]>(['']);
	const [customFields, setCustomFields] = React.useState<CustomField[]>([]);
	const [lists, setLists] = React.useState<ListType[]>(defaultList ? [defaultList] : []);

	const [selectedUser, setSelectedUser] = React.useState<Profile>();

	const { client } = useSupabase();
	const { data: profile } = useGetProfile();
	const { data: items } = useGetItems();
	const createItem = useCreateItem();

	const handleCreate = async () => {
		createItem
			.mutateAsync({
				image: image,
				name: name.trim(),
				description: description,
				links: links.map((l) => l.trim()).filter((l) => l.trim().length !== 0),
				custom_fields: customFields,
				newLists: profile?.enable_lists ? lists : [],
				shopping_item: selectedUser?.user_id ?? null,
			})
			.then(() => {
				// The item exists now, so the tour has nothing left to demonstrate.
				// Retiring it here rather than in handleClose keeps a plain cancel
				// (or a stray dialog dismiss) from silently ending the tour.
				if (itemTourProgress(tour ?? {}, profile?.enable_lists) !== null) skipTour();

				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to create item! ${err.message}`, { variant: 'error' });
			});
	};

	const handleClose = async () => {
		setImage(undefined);
		setMetaImage(undefined);
		setAvailableImages([]);

		setName('');
		setDescription('');
		setLinks(['']);
		setCustomFields([]);
		setLists(defaultList ? [defaultList] : []);

		setSelectedUser(undefined);

		navigate('#'); // close dialog
	};

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
			enqueueSnackbar(`Unable to get metadata.`, {
				variant: 'error',
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

	//
	// User tour
	const addItemFab = React.useRef(null);
	const [fabLoaded, setFabLoaded] = React.useState<boolean>(false);
	const [dialogOpenedTour, setDialogOpenedTour] = React.useState<boolean>(false);
	const [imageDialogOpen, setImageDialogOpen] = React.useState<boolean>(false);
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();

	const skipTour = async () => {
		updateTour.mutateAsync(SKIP_ITEM_TOUR);
	};

	React.useEffect(() => {
		if (addItemFab.current) setFabLoaded(true);
	}, [addItemFab]);

	React.useEffect(() => {
		if (open) {
			setTimeout(() => {
				setDialogOpenedTour(true);
			}, 250);
		} else {
			setDialogOpenedTour(false);
		}
	}, [open]);

	const welcomeTourContent = (
		<TourContent title='Welcome to Giftamizer!'>
			<p>Items are the gifts you'd like to receive — everyone in your groups can see them.</p>
			{!profile?.enable_lists && (
				<p className='opacity-80'>Want finer control over who sees what? Turn on Lists in your settings — you can even keep separate lists for your kids or pets.</p>
			)}
			<p className='font-medium'>Use the + button to add {items?.length === 0 ? 'your first item' : 'an item'}.</p>
			<div className='mt-1 flex justify-end'>
				<TourSkipButton onClick={skipTour} loading={updateTour.isLoading}>
					Skip Item Tour
				</TourSkipButton>
			</div>
		</TourContent>
	);

	const tourNextButton = (tourKey: string, label: string = 'Next') => (
		<div className='mt-1 flex justify-end'>
			<Button
				variant='secondary'
				size='sm'
				onClick={() => {
					updateTour.mutateAsync({
						[tourKey]: true,
					});
				}}
				loading={updateTour.isLoading}
			>
				{label}
			</Button>
		</div>
	);

	return (
		<>
			<button
				type='button'
				{...({ 'tour-element': shoppingItem ? 'shopping_item_create_fab' : 'item_create_fab' } as object)}
				ref={addItemFab}
				aria-label='add'
				onClick={() => {
					navigate('#create-item');
					if (!tour?.item_create_fab) {
						updateTour.mutateAsync({
							item_create_fab: true,
						});
					}
				}}
				className={cn(
					'fixed right-2 bottom-20 z-30 flex size-14 cursor-pointer items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-all outline-none',
					'hover:bg-primary-hover hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95 md:right-4 md:bottom-4'
				)}
			>
				{shoppingItem ? <ShoppingCart className='size-6' /> : <Plus className='size-7' />}
			</button>

			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (!next) handleClose();
				}}
			>
				<DialogContent fullScreenOnMobile>
					<DialogHeader>
						<DialogTitle>Create Item</DialogTitle>
						<DialogDescription>
							{shoppingItem
								? `Add items you plan on getting for other people even if they don't have it on their list.`
								: `Add items you'd love to receive, whether it's your favorite products, experiences, or anything else you desire.`}
						</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						<div className='flex justify-center'>
							<ImageCropper
								onClick={() => {
									setImageDialogOpen(true);
									if (!tour?.item_image) {
										updateTour.mutateAsync({
											item_image: true,
										});
									}
								}}
								onClose={() => {
									setImageDialogOpen(false);
								}}
								tour_element='item_image'
								value={image}
								onChange={setImage}
								square
								importedImage={metaImage}
							/>
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

						{shoppingItem && <UserSearchSingle selectedUser={selectedUser} setSelectedUser={setSelectedUser} label='Gift For' required />}

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
											{...({ 'tour-element': index === 0 ? 'item_url' : undefined } as object)}
											value={link}
											maxLength={2000}
											className='pr-10'
											onChange={(e) => {
												let value = e.target.value;
												let extractedUrl = ExtractURLFromText(value)[0] ?? '';

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

						{profile?.enable_lists && !shoppingItem && <ListSelector tourElement='item_list_assign' value={lists} onChange={(v) => setLists(v)} />}

						<div className='flex items-center justify-between gap-2'>
							<Button
								{...({ 'tour-element': 'item_custom_fields' } as object)}
								variant='outline'
								size='sm'
								onClick={() => {
									setCustomFields([...customFields, { id: customFields.length, name: '', value: '' }]);

									if (!tour?.item_custom_fields) {
										updateTour.mutateAsync({
											item_custom_fields: true,
										});
									}
								}}
								disabled={customFields.length === 10}
							>
								<Plus />
								Field
							</Button>

							<div className='flex items-center gap-2'>
								<Button variant='ghost' onClick={handleClose}>
									Cancel
								</Button>

								<Button
									{...({ 'tour-element': 'item_create_btn' } as object)}
									onClick={handleCreate}
									disabled={name.trim().length === 0 || (shoppingItem && !selectedUser)}
									loading={createItem.isLoading}
								>
									Create
									<Plus />
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{fabLoaded && !imageDialogOpen && tour && (
				<TourTooltip
					open={itemTourProgress(tour, profile?.enable_lists) === 'item_create_fab' && location.hash === ''}
					anchorEl={document.querySelector('[tour-element="item_create_fab"]')}
					placement='top-end'
					content={welcomeTourContent}
					mask
					allowClick
				/>
			)}

			{/* Steps follow the form top to bottom. The name field is deliberately
			    un-toured: its label already says what it is. */}
			{fabLoaded && dialogOpenedTour && !imageDialogOpen && tour && (
				<>
					<TourTooltip
						open={itemTourProgress(tour, profile?.enable_lists) === 'item_image' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_image"]')}
						placement='bottom'
						content={
							<div>
								<p>A picture is worth a thousand words. Add one so your friends know exactly what you want.</p>
								{tourNextButton('item_image')}
							</div>
						}
					/>
					<TourTooltip
						open={itemTourProgress(tour, profile?.enable_lists) === 'item_url' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_url"]')}
						placement='top'
						content={
							<TourContent title='Paste a link, skip the typing'>
								<p>For supported stores, Giftamizer fills in the name, picture, description and price for you.</p>
								<p className='opacity-80'>Use the link button to add up to five links for the same item.</p>
								{tourNextButton('item_url')}
							</TourContent>
						}
					/>
					<TourTooltip
						open={itemTourProgress(tour, profile?.enable_lists) === 'item_custom_fields' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_custom_fields"]')}
						placement='top'
						content={
							<TourContent title='Custom Fields'>
								<p>Add any detail that matters — size, color, or model number.</p>
								{tourNextButton('item_custom_fields')}
							</TourContent>
						}
					/>
					{profile?.enable_lists && !shoppingItem && (
						<TourTooltip
							open={itemTourProgress(tour, profile?.enable_lists) === 'item_list_assign' && location.hash === '#create-item'}
							anchorEl={document.querySelector('[tour-element="item_list_assign"]')}
							placement='top'
							content={
								<TourContent title='Choose which lists get this item'>
									<p>An item is only visible to a group if it's on a list you've shared with that group.</p>
									{tourNextButton('item_list_assign')}
								</TourContent>
							}
						/>
					)}
					<TourTooltip
						open={itemTourProgress(tour, profile?.enable_lists) === 'item_create_btn' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_create_btn"]')}
						placement='top'
						content={
							<div>
								<p>That's everything — create the item. You can edit or delete it any time from your items page.</p>
								{tourNextButton('item_create_btn', 'Got it')}
							</div>
						}
					/>
				</>
			)}
		</>
	);
}
