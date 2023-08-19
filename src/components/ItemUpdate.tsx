import React, { useEffect } from 'react';

import { DEFAULT_LIST_ID, useGetGroups, useGetProfile, useSupabase, useUpdateItems } from '../lib/useSupabase';
import { CustomField, ItemType, ListType } from '../lib/useSupabase/types';

import { useSnackbar } from 'notistack';

import {
	Dialog,
	DialogTitle,
	DialogContent,
	Button,
	TextField,
	DialogContentText,
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
} from '@mui/material';
import { Add, AddLink, Delete, Save } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import ListSelector from './ListSelector';

type ItemUpdateProps = {
	item: ItemType | null;
	onClose: () => void;
};

export default function ItemUpdate({ item, onClose }: ItemUpdateProps) {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();

	const { user } = useSupabase();
	const { data: profile } = useGetProfile();

	const updateItems = useUpdateItems();
	const { data: groups } = useGetGroups();

	const [name, setName] = React.useState('');
	const [description, setDescription] = React.useState('');
	const [links, setLinks] = React.useState<string[]>(['']);
	const [customFields, setCustomFields] = React.useState<CustomField[]>([]);
	const [lists, setLists] = React.useState<ListType[]>([]);

	const handleSave = async () => {
		if (item) {
			await updateItems
				.mutateAsync({
					id: item.id,
					name: name,
					description: description,
					links: links.map((l) => l.trim()).filter((l) => l.trim().length !== 0),
					custom_fields: customFields,
					lists: item.lists,
					newLists: profile?.enable_lists ? lists : [],
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
						child_list: false,
						groups: [],
					};
				}) ?? []
			);
		}
	}, [item]);

	return (
		<Dialog open={item !== null} onClose={updateItems.isLoading ? undefined : onClose} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
			<DialogTitle>Edit Item</DialogTitle>
			<DialogContent>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<DialogContentText>TODO: describe what items do...</DialogContentText>
					</Grid>
					<Grid item xs={12}>
						<TextField fullWidth label='Name' variant='outlined' required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
					</Grid>
					<Grid item xs={12}>
						<TextField fullWidth label='Description' variant='outlined' value={description} onChange={(e) => setDescription(e.target.value)} />
					</Grid>
					{links.map((link, index) => (
						<Grid key={index} item xs={12}>
							<FormControl fullWidth variant='outlined'>
								<InputLabel htmlFor='outlined-adornment-password'>URL</InputLabel>
								<OutlinedInput
									value={link}
									onChange={(e) => {
										setLinks(links.map((l, i) => (i === index ? e.target.value : l)));
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
												>
													{index === 0 ? <AddLink /> : <Delete />}
												</IconButton>
											</Tooltip>
										</InputAdornment>
									}
									label='URL'
								/>
							</FormControl>
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
										/>
									</FormControl>
								</Grid>
							</Grid>
						</Grid>
					))}

					{profile?.enable_lists && (
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

									<LoadingButton onClick={handleSave} disabled={name.length === 0} endIcon={<Save />} loading={updateItems.isLoading} loadingPosition='end' variant='contained'>
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
