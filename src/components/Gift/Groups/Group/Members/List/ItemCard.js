import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import Alert from '../../../../../Alert';
import Snackbar from '@material-ui/core/Snackbar';

import { firebaseAuth } from '../../../../../../firebase/constants';
import { setStatus } from '../../../../../../firebase/gift/items';

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

export default function MediaControlCard({ item }) {
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
							<Button color='primary' onClick={() => setStatus(item.id, 'planned', firebaseAuth().currentUser.uid)}>
								Available
							</Button>
						) : item.status === 'planned' ? (
							<Button
								style={{ color: '#ffab40', cursor: item.takenBy === firebaseAuth().currentUser.uid ? 'pointer' : 'not-allowed', pointerEvents: 'all' }}
								onClick={() => setStatus(item.id, 'unavailable', firebaseAuth().currentUser.uid)}
								disabled={item.takenBy !== firebaseAuth().currentUser.uid}
							>
								Planned
							</Button>
						) : item.status === 'unavailable' ? (
							<Button
								style={{ color: '#f44336', cursor: item.takenBy === firebaseAuth().currentUser.uid ? 'pointer' : 'not-allowed', pointerEvents: 'all' }}
								onClick={() => setStatus(item.id, 'available', firebaseAuth().currentUser.uid)}
								disabled={item.takenBy !== firebaseAuth().currentUser.uid}
							>
								Unavailable
							</Button>
						) : (
							<Button color='secondary' disabled>
								ERROR
							</Button>
						)}
						<Button href={item.url} target='_blank' style={{ color: '#2196f3' }}>
							{extractDomain(item.url)}
						</Button>
					</div>
				</div>
				<CardMedia className={classes.cover} image={item.image} title={item.name} />
			</Card>

			<Snackbar open={alert.open} autoHideDuration={3500} onClose={handleAlertClose}>
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
