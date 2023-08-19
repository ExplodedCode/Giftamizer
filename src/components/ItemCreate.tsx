import React from 'react';

import { useSupabase, useCreateItem, useGetProfile, DEFAULT_LIST_ID } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import {
	Button,
	Dialog,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Fab,
	FormControl,
	Grid,
	IconButton,
	InputAdornment,
	InputLabel,
	LinearProgress,
	OutlinedInput,
	Stack,
	TextField,
	Tooltip,
	useMediaQuery,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Add, AddLink, Delete } from '@mui/icons-material';
import ListSelector from './ListSelector';
import { CustomField, ListType } from '../lib/useSupabase/types';
import ImageCropper from './ImageCropper';

export default function ItemCreate() {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);

	const [image, setImage] = React.useState<string | undefined>();
	const [name, setName] = React.useState('');
	const [description, setDescription] = React.useState('');
	const [links, setLinks] = React.useState<string[]>(['']);
	const [customFields, setCustomFields] = React.useState<CustomField[]>([]);
	const [lists, setLists] = React.useState<ListType[]>([]);

	const { user, client } = useSupabase();
	const { data: profile } = useGetProfile();
	const createItem = useCreateItem();

	const handleCreate = async () => {
		createItem
			.mutateAsync({
				name: name,
				description: description,
				links: links.map((l) => l.trim()).filter((l) => l.trim().length !== 0),
				custom_fields: customFields,
				newLists: profile?.enable_lists ? lists : [],
			})
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to create item! ${err.message}`, { variant: 'error' });
			});
	};

	const handleClose = async () => {
		setName('');
		setDescription('');
		setLinks(['']);
		setCustomFields([]);
		setLists([]);

		setOpen(false);
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
			setName(data?.name);
			setDescription(data?.description);
			setImage(data?.image);
			setMetaImage(data?.image);
			setMetaloading(false);
		}
	};

	return (
		<>
			<Fab color='primary' aria-label='add' onClick={() => setOpen(true)} sx={{ position: 'fixed', bottom: { xs: 64, md: 16 }, right: { xs: 8, md: 16 } }}>
				<Add />
			</Fab>

			<Dialog open={open} onClose={handleClose} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Create Item</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>TODO: describe what items do...</DialogContentText>
						</Grid>
						<Grid item xs={12}>
							<ImageCropper value={image} onChange={setImage} square importedImage={metaImage} />
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
									<InputLabel>URL</InputLabel>
									<OutlinedInput
										value={link}
										onChange={(e) => {
											setLinks(links.map((l, i) => (i === index ? e.target.value : l)));
										}}
										onPaste={(e) => {
											const urlQuery = e.clipboardData.getData('Text');
											if (index === 0 && urlQuery.length > 0) {
												setMetaloading(true);
												getUrlMetadata(urlQuery);
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
													>
														{index === 0 ? <AddLink /> : <Delete />}
													</IconButton>
												</Tooltip>
											</InputAdornment>
										}
										label='URL'
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
										<Button color='inherit' onClick={handleClose}>
											Cancel
										</Button>

										<LoadingButton onClick={handleCreate} disabled={name.length === 0} endIcon={<Add />} loading={createItem.isLoading} loadingPosition='end' variant='contained'>
											Create
										</LoadingButton>
									</Stack>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>
		</>
	);
}
