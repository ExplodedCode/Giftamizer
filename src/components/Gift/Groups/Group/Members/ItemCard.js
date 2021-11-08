import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import Alert from '../../../../Alert';
import Snackbar from '@mui/material/Snackbar';

import { firebaseAuth } from '../../../../../firebase/constants';
import { setStatus } from '../../../../../firebase/gift/items';

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

export default function MediaControlCard({ item, getMemberItems }) {
	const classes = useStyles();

	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleAlertClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	return (
		<div>
			<Card className={classes.root}>
				<div className={classes.details}>
					<CardContent className={classes.content}>
						<Typography component='h5' variant='h5'>
							{item.name}
						</Typography>
						<Typography variant='subtitle1' color='textSecondary'>
							{item.description}
						</Typography>
					</CardContent>
					<div className={classes.controls}>
						{item.status === 'available' || !item.status ? (
							<Button
								color='primary'
								onClick={() => {
									setStatus(item._id, 'planned').then(() => {
										getMemberItems();
									});
								}}
							>
								Available
							</Button>
						) : item.status === 'planned' ? (
							<Button
								style={{ color: '#ffab40', cursor: item.takenBy === firebaseAuth().currentUser.uid ? 'pointer' : 'not-allowed', pointerEvents: 'all' }}
								onClick={() => {
									setStatus(item._id, 'unavailable').then(() => {
										getMemberItems();
									});
								}}
								disabled={item.takenBy !== firebaseAuth().currentUser.uid}
							>
								Pending
							</Button>
						) : item.status === 'unavailable' ? (
							<Button
								style={{ color: '#f44336', cursor: item.takenBy === firebaseAuth().currentUser.uid ? 'pointer' : 'not-allowed', pointerEvents: 'all' }}
								onClick={() => {
									setStatus(item._id, 'available').then(() => {
										getMemberItems();
									});
								}}
								disabled={item.takenBy !== firebaseAuth().currentUser.uid}
							>
								Purchased
							</Button>
						) : (
							<Button color='secondary' disabled>
								ERROR
							</Button>
						)}

						{item.url && (
							<Button href={item.url} target='_blank' style={{ color: '#2196f3' }}>
								{extractDomain(item.url)}
							</Button>
						)}
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
