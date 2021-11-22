import React from 'react';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import LinearProgress from '@mui/material/LinearProgress';

import Autocomplete from '@mui/material/Autocomplete';

import Alert from '../../Alert';
import Snackbar from '@mui/material/Snackbar';

import { getMyLists, editItem } from '../../../firebase/gift/items';

export default function SpeedDialTooltipOpen(props) {
	const [open, setOpen] = React.useState(false);
	const handleOpen = () => {
		setOpen(true);
		getLists();
	};
	const handleClose = () => {
		setOpen(false);
	};

	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleAlertClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	const [name, setName] = React.useState(props.item.name);
	const [description, setDescription] = React.useState(props.item.description);
	const [url, setUrl] = React.useState(props.item.url);
	const [image, setImage] = React.useState(props.item.image);

	const [loadingMetadata, setLoadingMetadata] = React.useState(false);

	const [lists, setlists] = React.useState([]);
	const [listsSelected, setListsSelected] = React.useState([]);
	const getLists = () => {
		getMyLists().then((result) => {
			setlists(result);
			setListsSelected(
				result.filter((obj) => {
					return props.item.lists.includes(obj.id);
				})
			);
		});
	};
	const listSelected = (event, value) => {
		setListsSelected(value);
	};

	return (
		<div>
			<Button color='primary' onClick={handleOpen}>
				Edit
			</Button>
			<Dialog open={open} scroll={'body'} onClose={handleClose} maxWidth='sm' fullWidth>
				<DialogTitle id='form-dialog-title'>Edit Item</DialogTitle>
				<DialogContent>
					<DialogContentText>Fill out the details below, or copy & paste a URL and will we wil autofill the details.</DialogContentText>
					<TextField autoFocus margin='dense' label='Name' fullWidth value={name} onChange={(event) => setName(event.target.value)} disabled={loadingMetadata} />
					<TextField margin='dense' label='Description' fullWidth value={description} onChange={(event) => setDescription(event.target.value)} disabled={loadingMetadata} />
					<TextField
						margin='dense'
						label='URL'
						fullWidth
						value={url}
						onChange={(event) => {
							setUrl(event.target.value);
						}}
						onPaste={(e) => {
							setLoadingMetadata(true);
							var urlQuery = e.clipboardData.getData('Text');

							fetch('/api/metadata?url=' + urlQuery, {
								method: 'GET',
								headers: {
									'Content-Type': 'application/json',
								},
							}).then((response) => {
								if (!response.ok) {
									response.json().then((error) => {
										// console.log(error);
										setImage('');
										setUrl(urlQuery);
										setLoadingMetadata(false);
									});
								} else {
									return response.json().then((data) => {
										if (data.image.startsWith('/') && !data.image.startsWith('//')) {
											setImage(urlQuery.split('/')[0] + '//' + urlQuery.split('/')[2] + data.image);
										} else {
											setImage(data.image);
										}

										setName(data.title.substring(0, 75) + (data.title.length > 60 ? '…' : ''));
										setDescription(data.description.substring(0, 220) + (data.description.length > 200 ? '…' : ''));
										setUrl(urlQuery);
										setLoadingMetadata(false);
									});
								}
							});
						}}
						disabled={loadingMetadata}
					/>
					<LinearProgress style={{ display: loadingMetadata ? 'block' : 'none' }} />
					{image !== '' && <img src={image} alt='item' style={{ maxHeight: 200, maxWidth: '100%', marginTop: 8 }} />}
					<Autocomplete
						multiple
						limitTags={2}
						options={lists}
						value={listsSelected}
						getOptionLabel={(option) => option.name}
						renderInput={(params) => <TextField {...params} variant='standard' label='Lists' />}
						style={{ marginTop: 8 }}
						onChange={listSelected}
						disabled={loadingMetadata}
					/>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							var listsTemp = [];
							listsSelected.forEach((list) => {
								listsTemp.push(list.id);
							});

							editItem(props.item._id, { name: name, description: description, url: url, image: image, lists: listsTemp }).then((result) => {
								// console.log(props.item, result);
								if (result === 'ok') {
									setAlert({ open: true, message: 'Item saved!', severity: 'success' });
									handleClose();
									props.getItems();
								} else {
									setAlert({ open: true, message: 'Error saving item!', severity: 'error' });
								}
							});
						}}
						color='primary'
						disabled={!(!loadingMetadata && name.trim().length > 0)}
					>
						Save
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'center',
				}}
				open={alert.open}
				autoHideDuration={3500}
				onClose={handleAlertClose}
			>
				<Alert onClose={handleAlertClose} severity={alert.severity}>
					{alert.message}
				</Alert>
			</Snackbar>
		</div>
	);
}
