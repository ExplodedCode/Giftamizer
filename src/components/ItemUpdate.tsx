import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { ExtractURLFromText, useGetProfile, useSupabase, useUpdateItems } from '../lib/useSupabase';
import { CustomField, ItemType, ListType, MemberItemType, Profile } from '../lib/useSupabase/types';

import {
	Dialog,
	DialogTitle,
	DialogContent,
	Button,
	TextField,
	Grid,
	Stack,
	useMediaQuery,
	useTheme,
	FormControl,
	IconButton,
	InputAdornment,
	InputLabel,
	OutlinedInput,
	Tooltip,
	LinearProgress,
} from '@mui/material';
import { Add, AddLink, Delete, Save } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import ListSelector from './ListSelector';
import ImageCropper from './ImageCropper';
import UserSearchSingle from './UserSearchSingle';

type ItemUpdateProps = {
	item: ItemType | MemberItemType;
	onClose: () => void;
	shoppingItem?: boolean;
};

export default function ItemUpdate({ item, onClose, shoppingItem }: ItemUpdateProps) {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const location = useLocation();

	const open = location.hash === '#item-edit';

	const { user, client } = useSupabase();
	const { data: profile } = useGetProfile();

	const [image, setImage] = React.useState<string | undefined>();
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
			if (data?.name) setName(data?.name);
			if (data?.description) setDescription(data?.description);
			if (data?.image) setImage(data?.image);
			if (data?.image) setMetaImage(data?.image);
			setMetaloading(false);
		}
	};

	return (
		<Dialog open={item !== null && open} onClose={updateItems.isLoading ? undefined : onClose} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
			<DialogTitle>Edit Item</DialogTitle>
			<DialogContent>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<ImageCropper value={image} onChange={setImage} square importedImage={metaImage} />
					</Grid>

					{shoppingItem && item && (
						<Grid item xs>
							<UserSearchSingle selectedUser={selectedUser!} setSelectedUser={setSelectedUser} label='Gift For' required />
						</Grid>
					)}

					<Grid item xs={12}>
						<TextField fullWidth label='Name' variant='outlined' required value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 100 }} />
					</Grid>
					<Grid item xs={12}>
						<TextField fullWidth label='Description' variant='outlined' value={description} onChange={(e) => setDescription(e.target.value)} inputProps={{ maxLength: 250 }} />
					</Grid>
					{links.map((link, index) => (
						<Grid key={index} item xs={12}>
							<FormControl fullWidth variant='outlined'>
								<InputLabel htmlFor='outlined-adornment-password'>URL</InputLabel>
								<OutlinedInput
									value={link}
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
									endAdornment={
										<InputAdornment position='end'>
											<Tooltip title={index === 0 ? 'Add another URL' : 'Remove URL'} placement='left'>
												<IconButton
													onClick={() => {
														if (index === 0) {
															setLinks([...links, '']);
														} else {
															setLinks(links.filter((l, i) => i !== index));
														}
													}}
													edge='end'
													disabled={links.length === 5 && index === 0}
												>
													{index === 0 ? <AddLink /> : <Delete />}
												</IconButton>
											</Tooltip>
										</InputAdornment>
									}
									label='URL'
									inputProps={{ maxLength: 2000 }}
								/>
							</FormControl>
							{index === 0 && <LinearProgress style={{ display: metaLoading ? 'block' : 'none' }} />}
						</Grid>
					))}
					{customFields.map((field, index) => (
						<Grid key={index} item xs={12}>
							<Grid container justifyContent='flex-start' spacing={2}>
								<Grid item xs={5}>
									<TextField
										fullWidth
										label={`Custom Field ${index + 1}`}
										variant='outlined'
										value={customFields.find((f) => f.id === field.id)?.name}
										onChange={(e) => {
											setCustomFields(customFields.map((f, i) => (f.id === field.id ? { ...f, name: e.target.value } : f)));
										}}
										inputProps={{ maxLength: 25 }}
									/>
								</Grid>

								<Grid item xs={7}>
									<FormControl fullWidth variant='outlined'>
										<InputLabel>Value</InputLabel>
										<OutlinedInput
											value={customFields.find((f) => f.id === field.id)?.value}
											onChange={(e) => {
												setCustomFields(customFields.map((f, i) => (f.id === field.id ? { ...f, value: e.target.value } : f)));
											}}
											endAdornment={
												<InputAdornment position='end'>
													<Tooltip title='Remove Field' placement='left'>
														<IconButton
															onClick={() => {
																setCustomFields(customFields.filter((f) => f.id !== field.id));
															}}
															edge='end'
														>
															<Delete />
														</IconButton>
													</Tooltip>
												</InputAdornment>
											}
											label='Value'
											inputProps={{ maxLength: 50 }}
										/>
									</FormControl>
								</Grid>
							</Grid>
						</Grid>
					))}

					{profile?.enable_lists && !shoppingItem && (
						<Grid item xs={12}>
							<ListSelector value={lists} onChange={(v) => setLists(v)} />
						</Grid>
					)}
					<Grid item xs={12}>
						<Grid container justifyContent='flex-start' spacing={2}>
							<Grid item xs>
								<Stack direction='row' justifyContent='flex-start' spacing={2}>
									<Button
										variant='outlined'
										size='small'
										color='inherit'
										startIcon={<Add />}
										onClick={() => setCustomFields([...customFields, { id: customFields.length, name: '', value: '' }])}
										disabled={customFields.length === 10}
									>
										Field
									</Button>
								</Stack>
							</Grid>
							<Grid item>
								<Stack direction='row' justifyContent='flex-end' spacing={2}>
									<Button color='inherit' onClick={onClose} disabled={updateItems.isLoading}>
										Cancel
									</Button>

									<LoadingButton onClick={handleSave} disabled={name.trim().length === 0} endIcon={<Save />} loading={updateItems.isLoading} loadingPosition='end' variant='contained'>
										Save
									</LoadingButton>
								</Stack>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</DialogContent>
		</Dialog>
	);
}
