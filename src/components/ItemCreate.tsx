import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useSnackbar } from 'notistack';

import {
	Avatar,
	Button,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Fab,
	FormControl,
	IconButton,
	InputAdornment,
	InputLabel,
	LinearProgress,
	OutlinedInput,
	Stack,
	TextField,
	Tooltip,
	Typography,
	useMediaQuery,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import { Add, AddLink, AddShoppingCart, Delete } from '@mui/icons-material';

import { useSupabase, useCreateItem, useGetProfile, ExtractURLFromText, useUpdateTour, itemTourProgress, useGetTour, useGetItems } from '../lib/useSupabase';
import { CustomField, ListType, Profile } from '../lib/useSupabase/types';

import ListSelector from './ListSelector';
import ImageCropper from './ImageCropper';
import TourTooltip from './TourTooltip';
import UserSearchSingle from './UserSearchSingle';

interface ItemCreateProps {
	defaultList?: ListType;
	shoppingItem?: boolean;
}
export default function ItemCreate({ defaultList, shoppingItem }: ItemCreateProps) {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	// const [open, setOpen] = React.useState(false);
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

		if (itemTourProgress(tour ?? {}) !== null) {
			skipTour();
		}
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
		updateTour.mutateAsync({
			item_create_fab: true,
			item_name: true,
			item_url: true,
			item_more_links: true,
			item_custom_fields: true,
			item_image: true,
			item_create_btn: true,
		});
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

	return (
		<>
			<Fab
				tour-element={shoppingItem ? 'shopping_item_create_fab' : 'item_create_fab'}
				ref={addItemFab}
				color='primary'
				aria-label='add'
				onClick={() => {
					navigate('#create-item');
					if (!tour?.item_create_fab) {
						updateTour.mutateAsync({
							item_create_fab: true,
						});
					}
				}}
				sx={{ position: 'fixed', bottom: { xs: 64, md: 16 }, right: { xs: 8, md: 16 } }}
			>
				{shoppingItem ? <AddShoppingCart /> : <Add />}
			</Fab>

			<Dialog open={open} onClose={handleClose} maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Create Item</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid size={12}>
							{shoppingItem ? (
								<DialogContentText>Add items you plan on getting for other people even if they don't have it on their list.</DialogContentText>
							) : (
								<DialogContentText>Add items you'd love to receive, whether it's your favorite products, experiences, or anything else you desire.</DialogContentText>
							)}
						</Grid>
						<Grid size={12}>
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
						</Grid>

						<Grid size={12} component={Collapse} in={availableImages.length > 0}>
							<Stack
								direction='row'
								spacing={1}
								sx={{
									overflowY: 'scroll',
									py: 1,
								}}
							>
								{availableImages.map((img, index) => (
									<Tooltip key={index} title='Use this image' arrow enterDelay={1500}>
										<IconButton
											onClick={() => {
												setImage(img);
												setMetaImage(img);
											}}
											// sx={{  }}
											sx={{
												width: 100,
												height: 100,
											}}
										>
											<Avatar
												src={img}
												alt={`Image-${index}`}
												sx={{
													border: '2px solid',
													borderColor: image === img ? theme.palette.primary.main : theme.palette.divider,
													width: 100,
													height: 100,
													'&:hover': {
														borderColor: theme.palette.primary.light,
													},
												}}
											/>
										</IconButton>
									</Tooltip>
								))}
							</Stack>
						</Grid>

						{shoppingItem && (
							<Grid size="grow">
								<UserSearchSingle selectedUser={selectedUser} setSelectedUser={setSelectedUser} label='Gift For' required />
							</Grid>
						)}

						<Grid size={12}>
							<TextField
								tour-element='item_name'
								fullWidth
								label='Name'
								variant='outlined'
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								slotProps={{ htmlInput: { maxLength: 100 } }}
							/>
						</Grid>
						<Grid size={12}>
							<TextField fullWidth label='Description' variant='outlined' value={description} onChange={(e) => setDescription(e.target.value)} slotProps={{ htmlInput: { maxLength: 250 } }} />
						</Grid>
						{links.map((link, index) => (
							<Grid key={index} size={12}>
								<FormControl fullWidth variant='outlined'>
									<InputLabel>URL</InputLabel>
									<OutlinedInput
										tour-element='item_url'
										value={link}
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
										endAdornment={
											<InputAdornment position='end'>
												<Tooltip title={index === 0 ? 'Add another URL' : 'Remove URL'} placement='left'>
													<IconButton
														tour-element='item_more_links'
														onClick={() => {
															if (index === 0) {
																setLinks([...links, '']);

																if (!tour?.item_more_links) {
																	updateTour.mutateAsync({
																		item_more_links: true,
																	});
																}
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
							<Grid key={index} size={12}>
								<Grid container spacing={2} sx={{ justifyContent: 'flex-start' }}>
									<Grid size={5}>
										<TextField
											fullWidth
											label={`Custom Field ${index + 1}`}
											variant='outlined'
											value={customFields.find((f) => f.id === field.id)?.name}
											onChange={(e) => {
												setCustomFields(customFields.map((f, i) => (f.id === field.id ? { ...f, name: e.target.value } : f)));
											}}
											slotProps={{ htmlInput: { maxLength: 25 } }}
										/>
									</Grid>

									<Grid size={7}>
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
							<Grid size={12}>
								<ListSelector value={lists} onChange={(v) => setLists(v)} />
							</Grid>
						)}

						<Grid size={12}>
							<Grid container spacing={2} sx={{ justifyContent: 'flex-start' }}>
								<Grid size="grow">
									<Stack direction='row' spacing={2} sx={{ justifyContent: 'flex-start' }}>
										<Button
											tour-element='item_custom_fields'
											variant='outlined'
											size='small'
											color='inherit'
											startIcon={<Add />}
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
											Field
										</Button>
									</Stack>
								</Grid>
								<Grid>
									<Stack direction='row' spacing={2} sx={{ justifyContent: 'flex-end' }}>
										<Button color='inherit' onClick={handleClose}>
											Cancel
										</Button>

										<Button
											tour-element='item_create_btn'
											onClick={handleCreate}
											disabled={name.trim().length === 0 || (shoppingItem && !selectedUser)}
											endIcon={<Add />}
											loading={createItem.isLoading}
											loadingPosition='end'
											variant='contained'
										>
											Create
										</Button>
									</Stack>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>

			{fabLoaded && !imageDialogOpen && tour && (
				<>
					<TourTooltip
						open={itemTourProgress(tour) === 'item_create_fab' && location.hash === ''}
						anchorEl={document.querySelector('[tour-element="item_create_fab"]')}
						placement='top-end'
						content={
							<>
								<DialogTitle>Welcome to Giftamizer!</DialogTitle>
								<DialogContent>
									<Typography gutterBottom>{items?.length === 0 && `Let's create your first item! `}By default items are shared to all of your groups.</Typography>
									{!profile?.enable_lists && (
										<>
											<Typography gutterBottom color='grayText'>
												For more control over who can see specific items, enable lists in the settings.
											</Typography>
											<Typography color='grayText'>You can even create separate managed lists for your kids or pets.</Typography>
										</>
									)}
								</DialogContent>
								<DialogActions sx={{ justifyContent: 'left' }}>
									<Button variant='outlined' color='inherit' onClick={skipTour} loading={updateTour.isLoading}>
										Skip Item Tour
									</Button>
								</DialogActions>
							</>
						}
						mask
						allowClick
					/>
				</>
			)}

			{fabLoaded && dialogOpenedTour && !imageDialogOpen && tour && (
				<>
					<TourTooltip
						open={itemTourProgress(tour) === 'item_create_fab' && location.hash === ''}
						anchorEl={document.querySelector('[tour-element="item_create_fab"]')}
						placement='top-end'
						content={
							<>
								<DialogTitle>Welcome to Giftamizer!</DialogTitle>
								<DialogContent>
									<Typography gutterBottom>{items?.length === 0 && `Let's create your first item! `}By default items are shared to all of your groups.</Typography>
									{!profile?.enable_lists && (
										<>
											<Typography gutterBottom color='grayText'>
												For more control over who can see specific items, enable lists in the settings.
											</Typography>
											<Typography color='grayText'>You can even create separate managed lists for your kids or pets.</Typography>
										</>
									)}
								</DialogContent>
								<DialogActions sx={{ justifyContent: 'left' }}>
									<Button variant='outlined' color='inherit' onClick={skipTour} loading={updateTour.isLoading}>
										Skip Item Tour
									</Button>
								</DialogActions>
							</>
						}
						mask
						allowClick
					/>
					<TourTooltip
						open={itemTourProgress(tour) === 'item_name' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_name"]')}
						placement='bottom'
						content={
							<>
								<DialogContent>
									<Typography>Give your item a name.</Typography>
								</DialogContent>
								<DialogActions>
									<Button
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												item_name: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Next
									</Button>
								</DialogActions>
							</>
						}
						backgroundColor={theme.palette.primary.main}
						color={theme.palette.primary.contrastText}
						allowClick
						mask
					/>
					<TourTooltip
						open={itemTourProgress(tour) === 'item_image' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_image"]')}
						placement='bottom'
						content={
							<>
								<DialogContent>
									<Typography>A picture is worth a thousand words! Add images to your items so your friends know exactly what you want.</Typography>
								</DialogContent>
								<DialogActions>
									<Button
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												item_image: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Next
									</Button>
								</DialogActions>
							</>
						}
						backgroundColor={theme.palette.primary.main}
						color={theme.palette.primary.contrastText}
					/>
					<TourTooltip
						open={itemTourProgress(tour) === 'item_url' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_url"]')}
						placement='top'
						content={
							<>
								<DialogTitle>Add links to you items!</DialogTitle>
								<DialogContent>
									<Typography>If the URL is supported, Giftamizer will automatically fill in the item details.</Typography>
								</DialogContent>
								<DialogActions>
									<Button
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												item_url: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Next
									</Button>
								</DialogActions>
							</>
						}
						backgroundColor={theme.palette.primary.main}
						color={theme.palette.primary.contrastText}
					/>
					<TourTooltip
						open={itemTourProgress(tour) === 'item_more_links' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_more_links"]')}
						placement='top'
						content={
							<>
								<DialogContent>
									<Typography>You can even add multiple links!</Typography>
								</DialogContent>
								<DialogActions>
									<Button
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												item_more_links: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Next
									</Button>
								</DialogActions>
							</>
						}
						backgroundColor={theme.palette.primary.main}
						color={theme.palette.primary.contrastText}
					/>
					<TourTooltip
						open={itemTourProgress(tour) === 'item_custom_fields' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_custom_fields"]')}
						placement='top'
						content={
							<>
								<DialogTitle>Custom Fields</DialogTitle>
								<DialogContent>
									<Typography>Provide more information about a specific product.</Typography>
								</DialogContent>
								<DialogActions>
									<Button
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												item_custom_fields: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Next
									</Button>
								</DialogActions>
							</>
						}
						backgroundColor={theme.palette.primary.main}
						color={theme.palette.primary.contrastText}
					/>
					<TourTooltip
						open={itemTourProgress(tour) === 'item_create_btn' && location.hash === '#create-item'}
						anchorEl={document.querySelector('[tour-element="item_create_btn"]')}
						placement='top'
						content={
							<>
								<DialogContent>
									<Typography>When you have everything ready, click Create to add the item.</Typography>
								</DialogContent>
								<DialogActions>
									<Button
										variant='outlined'
										color='inherit'
										onClick={() => {
											updateTour.mutateAsync({
												item_create_btn: true,
											});
										}}
										loading={updateTour.isLoading}
									>
										Got it
									</Button>
								</DialogActions>
							</>
						}
						backgroundColor={theme.palette.primary.main}
						color={theme.palette.primary.contrastText}
					/>
				</>
			)}
		</>
	);
}
