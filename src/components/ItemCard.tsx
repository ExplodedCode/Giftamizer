import React from 'react';
import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import {
	Card,
	CardContent,
	CardMedia,
	Grid,
	Typography,
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
	TableContainer,
	Table,
	Paper,
	TableRow,
	TableBody,
	TableCell,
	ButtonBase,
} from '@mui/material';
import { Delete, Edit, ExpandMore, MoreVert } from '@mui/icons-material';

import ItemUpdate from '../components/ItemUpdate';

import { ExtractDomain, useDeleteItem, useGetProfile, useSupabase } from '../lib/useSupabase';
import { ItemType } from '../lib/useSupabase/types';

interface VertMenuProps {
	item: ItemType;
}

function VertMenu({ item }: VertMenuProps) {
	const { enqueueSnackbar } = useSnackbar();

	const [itemEdit, setItemEdit] = React.useState<ItemType | null>(null);
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

	const open = Boolean(anchorEl);

	const handleVertMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleVertMenuClose = () => {
		setAnchorEl(null);
	};

	const deleteItem = useDeleteItem();
	const handleDelete = async (id: string) => {
		await deleteItem.mutateAsync(id).catch((err) => {
			enqueueSnackbar(`Unable to delete item! ${err.message}`, { variant: 'error' });
		});
	};

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

			<ItemUpdate item={itemEdit} onClose={() => setItemEdit(null)} />
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
	editable?: boolean;
};
export default function ItemCard({ item, editable }: ItemCardProps) {
	const { user, client } = useSupabase();
	const { data: profile } = useGetProfile();

	const [expanded, setExpanded] = React.useState(false);

	const handleExpand = (event: React.MouseEvent<HTMLElement>) => {
		setExpanded(!expanded);
	};

	return (
		<>
			<Grid item xs={12}>
				<Paper
					sx={{
						p: 2,
						margin: 'auto',
						flexGrow: 1,
						display: { sm: 'flex', xs: 'none' },
					}}
				>
					<Grid container spacing={2}>
						{item.image && (
							<Grid item>
								<ButtonBase>
									<img alt={item.name} src={item.image} style={{ objectFit: 'cover', width: 164, height: 200, borderRadius: 4 }} />
								</ButtonBase>
							</Grid>
						)}

						<Grid item xs={12} sm container>
							<Grid item xs container direction='column' spacing={2}>
								<Grid item xs>
									<Typography component='div' variant='h6'>
										{item.name}
									</Typography>
									<Typography variant='body1' gutterBottom>
										{item.description}
									</Typography>
									{item.custom_fields?.map((c) => (
										<Typography variant='body2' color='text.secondary'>
											{c.name}: {c.value}
										</Typography>
									))}
									{profile?.enable_lists && (
										<Stack direction='row' justifyContent='flex-start' spacing={1} sx={{ mt: 0.5 }}>
											{item.lists?.map((l) => (
												<Chip label={l.list.name} size='small' />
											))}
										</Stack>
									)}

									<Button
										onClick={() => {
											let channel = client.channel(`items.dc733fa3-97f9-4570-8a12-290eef57b29f.faa1cc14-9935-46f0-827e-0e8b60fe7b40`).subscribe();
											channel
												.send({
													type: 'broadcast',
													event: 'UPSERT',
													payload: item,
												})
												.then(() => {
													setTimeout(() => {
														channel.unsubscribe();
													}, 1000);
												});
										}}
									>
										test
									</Button>
								</Grid>
								{item.links && item.links.length > 0 && (
									<Grid item>
										<Stack direction='row' justifyContent='flex-start' spacing={1} useFlexGap flexWrap='wrap'>
											{item.links?.map((link, i) => (
												<Button key={i} href={link} target='_blank' color='info'>
													{ExtractDomain(link)}
												</Button>
											))}
										</Stack>
									</Grid>
								)}
							</Grid>
							<Grid item>{editable && <VertMenu item={item} />}</Grid>
						</Grid>
					</Grid>
				</Paper>

				{/* Mobile card */}
				<Card sx={{ display: { sm: 'none', xs: 'block' } }}>
					{item.image && <CardMedia component='img' alt={item.name} sx={{ height: 240 }} image={item.image} />}

					<CardContent>
						<Grid container justifyContent='flex-start' spacing={2}>
							<Grid item xs>
								<Typography variant='h5' component='div'>
									{item.name}
								</Typography>
							</Grid>
							<Grid item>{editable && <VertMenu item={item} />} </Grid>
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
		</>
	);
}
