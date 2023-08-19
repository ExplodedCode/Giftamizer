import React from 'react';

import { ExtractDomain, useDeleteItem, useGetProfile, useSupabase } from '../lib/useSupabase';

import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import {
	Card,
	CardContent,
	CardMedia,
	Grid,
	Typography,
	Box,
	Button,
	Stack,
	IconButton,
	Chip,
	CardActions,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Collapse,
	List,
	ListItem,
	TableContainer,
	Table,
	Paper,
	TableRow,
	TableBody,
	TableCell,
} from '@mui/material';
import { Delete, Edit, ExpandMore, MoreVert } from '@mui/icons-material';
import { CustomField, ItemType } from '../lib/useSupabase/types';
import ItemUpdate from '../components/ItemUpdate';

interface VertMenuProps {
	handleVertMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
	handleVertMenuClose: () => void;
	handleDelete: (id: string) => Promise<void>;
	setItemEdit: (value: React.SetStateAction<ItemType | null>) => void;
	anchorEl: HTMLElement | null;
	open: boolean;
	item: ItemType;
}

function VertMenu({ handleVertMenuOpen, handleVertMenuClose, setItemEdit, handleDelete, anchorEl, open, item }: VertMenuProps) {
	return (
		<>
			<IconButton onClick={handleVertMenuOpen}>
				<MoreVert />
			</IconButton>

			<Menu
				anchorEl={anchorEl}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				open={open}
				onClose={handleVertMenuClose}
			>
				<MenuItem
					onClick={() => {
						setItemEdit(item);
						handleVertMenuClose();
					}}
				>
					<ListItemIcon>
						<Edit fontSize='small' />
					</ListItemIcon>
					<ListItemText>Edit</ListItemText>
				</MenuItem>
				<MenuItem
					onClick={() => {
						handleDelete(item.id);
						handleVertMenuClose();
					}}
				>
					<ListItemIcon>
						<Delete fontSize='small' />
					</ListItemIcon>
					<ListItemText>Delete</ListItemText>
				</MenuItem>
			</Menu>
		</>
	);
}

interface CustomFieldExpandProps {
	handleExpand: (event: React.MouseEvent<HTMLElement>) => void;
	expanded: boolean;
	item: ItemType;
}

function CustomFieldExpand({ handleExpand, expanded, item }: CustomFieldExpandProps) {
	const theme = useTheme();

	return (
		<>
			<CardActions disableSpacing>
				<IconButton
					onClick={handleExpand}
					aria-label='show more'
					style={{
						marginLeft: 'auto',
						transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
						transition: theme.transitions.create('transform', {
							duration: theme.transitions.duration.shortest,
						}),
					}}
				>
					<ExpandMore />
				</IconButton>
			</CardActions>
			<Collapse in={expanded} timeout='auto' unmountOnExit sx={{ mr: 2, ml: 2, mb: 1 }}>
				<TableContainer>
					<Table size='small'>
						<TableBody>
							{item.custom_fields?.map((customfield, i) => (
								<TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
									<TableCell padding='checkbox' size='small' align='right'>
										{customfield.name}:
									</TableCell>
									<TableCell size='small' align='left'>
										{customfield.value}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Collapse>
		</>
	);
}

export type ItemCardProps = {
	item: ItemType;
};
export default function ItemCard({ item }: ItemCardProps) {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();

	const { user } = useSupabase();
	const { data: profile } = useGetProfile();

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const [itemEdit, setItemEdit] = React.useState<ItemType | null>(null);
	const [expanded, setExpanded] = React.useState(false);

	const open = Boolean(anchorEl);

	const handleVertMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleVertMenuClose = () => {
		setAnchorEl(null);
	};

	const handleExpand = (event: React.MouseEvent<HTMLElement>) => {
		setExpanded(!expanded);
	};

	const deleteItem = useDeleteItem();
	const handleDelete = async (id: string) => {
		await deleteItem.mutateAsync(id).catch((err) => {
			enqueueSnackbar(`Unable to delete item! ${err.message}`, { variant: 'error' });
		});
	};

	return (
		<>
			<Grid item xs={12}>
				<Card sx={{ display: { sm: 'flex', xs: 'none' } }}>
					<CardMedia component='img' sx={{ m: '24px 8px 24px 24px', maxWidth: 164, maxHeight: 164, borderRadius: 2 }} image={`https://picsum.photos/seed/${item.id}/200/300`} />
					<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
						<CardContent sx={{ flex: '1 0 auto' }}>
							<Grid container justifyContent='flex-start' spacing={2}>
								<Grid item xs>
									<Typography component='div' variant='h6'>
										{item.name}
									</Typography>
								</Grid>
								<Grid item>
									<VertMenu
										handleVertMenuOpen={handleVertMenuOpen}
										handleVertMenuClose={handleVertMenuClose}
										setItemEdit={setItemEdit}
										handleDelete={handleDelete}
										anchorEl={anchorEl}
										open={open}
										item={item}
									/>
								</Grid>
								{(item.description.length > 0 || profile?.enable_lists) && (
									<Grid item xs={12}>
										{item.description.length > 0 && (
											<Typography variant='subtitle1' color='text.secondary' component='div'>
												{item.description}
											</Typography>
										)}

										{profile?.enable_lists && (
											<>
												<Stack direction='row' justifyContent='flex-start' spacing={1}>
													{item.lists?.map((l) => (
														<Chip label={l.list.name} size='small' />
													))}
												</Stack>
											</>
										)}
									</Grid>
								)}
							</Grid>
						</CardContent>

						{item.links?.length !== 0 && (
							<Box sx={{ display: 'flex', alignItems: 'center', padding: 1 }}>
								<Grid container justifyContent='flex-start' spacing={2}>
									<Grid item xs={12}>
										<Stack direction='row' justifyContent='flex-start' spacing={1} useFlexGap flexWrap='wrap'>
											{item.links?.map((link, i) => (
												<Button key={i} href={link} target='_blank' color='info'>
													{ExtractDomain(link)}
												</Button>
											))}
										</Stack>
									</Grid>
								</Grid>
							</Box>
						)}

						{item.custom_fields && item.custom_fields?.length !== 0 && <CustomFieldExpand handleExpand={handleExpand} expanded={expanded} item={item} />}
					</Box>
				</Card>

				{/* Mobile card */}
				<Card sx={{ display: { sm: 'none', xs: 'block' } }}>
					<CardMedia component='img' alt='green iguana' height='240' image={`https://picsum.photos/seed/${item.id}/200/300`} />
					<CardContent>
						<Grid container justifyContent='flex-start' spacing={2}>
							<Grid item xs>
								<Typography variant='h5' component='div'>
									{item.name}
								</Typography>
							</Grid>
							<Grid item>
								<VertMenu
									handleVertMenuOpen={handleVertMenuOpen}
									handleVertMenuClose={handleVertMenuClose}
									setItemEdit={setItemEdit}
									handleDelete={handleDelete}
									anchorEl={anchorEl}
									open={open}
									item={item}
								/>
							</Grid>
							{(item.description.length > 0 || profile?.enable_lists) && (
								<Grid item xs={12}>
									{item.description.length > 0 && (
										<Typography gutterBottom variant='body2' color='text.secondary'>
											{item.description}
										</Typography>
									)}

									{profile?.enable_lists && (
										<Stack direction='row' justifyContent='flex-start' spacing={1}>
											{item.lists?.map((l) => (
												<Chip label={l.list.name} size='small' />
											))}
										</Stack>
									)}
								</Grid>
							)}

							{item.links?.length !== 0 && (
								<Grid item xs={12}>
									<Stack direction='row' justifyContent='flex-start' spacing={1} useFlexGap flexWrap='wrap'>
										{item.links?.map((link, i) => (
											<Button key={i} href={link} target='_blank' color='info' size='small'>
												{ExtractDomain(link)}
											</Button>
										))}
									</Stack>
								</Grid>
							)}
						</Grid>
					</CardContent>

					{item.custom_fields && item.custom_fields?.length !== 0 && <CustomFieldExpand handleExpand={handleExpand} expanded={expanded} item={item} />}
				</Card>
			</Grid>

			<ItemUpdate item={itemEdit} onClose={() => setItemEdit(null)} />
		</>
	);
}
