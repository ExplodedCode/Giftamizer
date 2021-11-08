import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { ListChip } from '../../../firebase/gift/misc';

import Alert from '../../Alert';
import Snackbar from '@mui/material/Snackbar';

import EditItem from './Edit';
import DeleteItem from './Delete';

const useStyles = makeStyles((theme) => ({
	root: {
		display: 'flex',
	},
	details: {
		flexGrow: 1,
		display: 'flex',
		flexDirection: 'column',
	},
	cover: {
		flexGrow: 1,
		maxWidth: 200,
		minWidth: 150,
	},
	controls: {
		display: 'flex',
		alignItems: 'center',
		paddingLeft: theme.spacing(1),
		paddingBottom: theme.spacing(1),
	},
}));

export default function MediaControlCard({ item, getItems, inList }) {
	const classes = useStyles();

	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleAlertClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	return (
		<div>
			<Card className={classes.root} style={item.lists.length === 0 ? { background: '#f4433666' } : {}}>
				<div className={classes.details}>
					<CardContent className={classes.content}>
						<Typography component='h5' variant='h5'>
							{item.name}
						</Typography>
						<Typography variant='subtitle1' color='textSecondary'>
							{item.description}
						</Typography>

						{item.lists.map((list, i) => (
							<ListChip listId={list} />
						))}

						{item.lists.length === 0 && <b>This item is not assigned to a list!</b>}
					</CardContent>
					<div className={classes.controls}>
						<DeleteItem item={item._id} getItems={getItems} setAlert={setAlert} inList />
						<EditItem item={item} getItems={getItems} />
						<Button href={item.url} target='_blank' style={{ color: '#2196f3' }}>
							{extractDomain(item.url)}
						</Button>
					</div>
				</div>
				<CardMedia className={classes.cover} image={item.image} title={item.name} />
			</Card>

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

function extractDomain(url) {
	var domain;
	//find & remove protocol (http, ftp, etc.) and get domain
	if (url.indexOf('://') > -1) {
		domain = url.split('/')[2];
	} else {
		domain = url.split('/')[0];
	}

	//find & remove port number
	domain = domain.split(':')[0];

	return domain.replace('www.', '');
}
