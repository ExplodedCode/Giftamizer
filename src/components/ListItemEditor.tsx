import React from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { FakeDelay, ITEMS_QUERY_KEY, useGetItems, useSupabase } from '../lib/useSupabase';

import {
	useMediaQuery,
	Button,
	IconButton,
	useTheme,
	Drawer,
	Box,
	Toolbar,
	Typography,
	Checkbox,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	ListItemAvatar,
	Avatar,
	CircularProgress,
	Divider,
	TextField,
	InputAdornment,
	Grid,
} from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, Search, Settings } from '@mui/icons-material';
import { ItemType, ListType } from '../lib/useSupabase/types';
import { useSnackbar } from 'notistack';

interface ListItemComponentProps {
	item: ItemType;
}
function ListItemComponent({ item }: ListItemComponentProps) {
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const { list: listID } = useParams();

	const { client, user } = useSupabase();

	const { data: items } = useGetItems();
	const [loading, setLoading] = React.useState<boolean>(false);

	const handleToggle = (item: ItemType) => async () => {
		setLoading(true);
		await FakeDelay();

		const inList = item.lists?.find((l) => l.list_id === listID) !== undefined;
		if (inList) {
			const { error } = await client.from('items_lists').delete().eq('item_id', item.id).eq('list_id', listID);

			if (error) {
				enqueueSnackbar(`Unable to update item! ${error.message}`, { variant: 'error' });
			} else {
				queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => {
					if (prevItems) {
						const updatedItems = prevItems.map((i) => {
							return i.id === item.id
								? {
										...i,
										lists: i.lists?.filter((l) => l.list_id !== listID),
								  }
								: i;
						});
						return updatedItems;
					}
					return prevItems;
				});
			}

			setLoading(false);
		} else {
			const { error } = await client.from('items_lists').upsert({
				item_id: item.id,
				list_id: listID,
				user_id: user.id,
			});

			if (error) {
				enqueueSnackbar(`Unable to update item! ${error.message}`, { variant: 'error' });
			} else {
				const { data: listData, error: listError } = await client.from('lists').select('*').eq('id', listID).eq('user_id', user.id).single();

				if (listError) {
					enqueueSnackbar(`Unable to update item! ${listError.message}`, { variant: 'error' });
				} else {
					const list = listData as ListType;
					queryClient.setQueryData(ITEMS_QUERY_KEY, (prevItems: ItemType[] | undefined) => {
						if (prevItems) {
							const updatedItems = prevItems.map((i) => {
								return i.id === item.id
									? {
											...i,
											lists: [
												...(item.lists ?? []),

												{
													list_id: list.id,
													list: {
														name: list.name,
														child_list: list.child_list,
													},
												},
											],
									  }
									: i;
							});
							return updatedItems;
						}
						return prevItems;
					});
				}
			}
			setLoading(false);
		}
	};

	return (
		<ListItem
			secondaryAction={
				<Checkbox
					icon={loading ? <CircularProgress size={20} /> : <CheckBoxOutlineBlank />}
					checkedIcon={loading ? <CircularProgress size={20} /> : <CheckBox />}
					onChange={handleToggle(item)}
					checked={item.lists?.find((l) => l.list_id === listID) !== undefined}
					disabled={loading}
					edge='end'
				/>
			}
			disablePadding
		>
			<ListItemButton onClick={handleToggle(item)} disabled={loading} dense>
				{item.image && (
					<ListItemAvatar>
						<Avatar alt={item.name} src={item.image} />
					</ListItemAvatar>
				)}
				<ListItemText primary={item.name} secondary={item.description} />
			</ListItemButton>
		</ListItem>
	);
}

export default function ListItemEditor() {
	const theme = useTheme();

	const { data: items, isLoading: loadingItems } = useGetItems();

	const [search, setSearch] = React.useState<string>('');

	const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
	const handleOpen = () => {
		setDrawerOpen(true);
	};
	const handleClose = () => {
		setDrawerOpen(false);
	};

	return (
		<>
			{useMediaQuery(theme.breakpoints.up('md')) ? (
				<Button tour-element='group_settings' variant='outlined' color='primary' size='small' onClick={handleOpen}>
					Manage
				</Button>
			) : (
				<IconButton tour-element='group_settings' onClick={handleOpen}>
					<Settings />
				</IconButton>
			)}

			<Drawer anchor='right' open={drawerOpen} onClose={handleClose}>
				<Toolbar />
				<Box sx={{ minWidth: 250, maxWidth: '80vw' }} role='presentation'>
					<Typography sx={{ m: 1 }} variant='h6' component='div'>
						Assign Items
					</Typography>

					<TextField
						size='small'
						label='Search'
						InputProps={{
							startAdornment: (
								<InputAdornment position='start'>
									<Search />
								</InputAdornment>
							),
						}}
						variant='outlined'
						sx={{ m: 1, width: '96%' }}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>

					{loadingItems && (
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
							<CircularProgress />
						</Box>
					)}

					<List sx={{ width: '100%', maxWidth: 400 }}>
						{items
							?.filter((i) => i.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) || i.description.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
							.map((item, index) => {
								return (
									<React.Fragment key={index}>
										<ListItemComponent item={item} />

										{items.length - 1 !== index && <Divider variant='inset' component='li' />}
									</React.Fragment>
								);
							})}
					</List>
				</Box>
			</Drawer>
		</>
	);
}
