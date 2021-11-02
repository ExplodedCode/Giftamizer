import React from 'react';
import { Link } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

import Alert from '../../../Alert';
import Snackbar from '@mui/material/Snackbar';

import ListAltIcon from '@mui/icons-material/ListAlt';

export default function GroupCard({ group, list, getMembers, owner }) {
	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleAlertClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	return (
		<div>
			<Card>
				<CardActionArea component={Link} to={'/gift/group/' + group + '/member/' + list.owner + '/list/' + list._id}>
					<CardMedia style={{ fontSize: '1000%', textAlign: 'center', backgroundColor: '#4caf50', color: '#fff' }}>{list.name.charAt(0).toUpperCase()}</CardMedia>
					<CardContent>
						<Grid container>
							<Grid item xs>
								<Typography variant='h5' component='h2'>
									{list.name}
								</Typography>
							</Grid>
							<Grid item>
								<ListAltIcon />
							</Grid>
						</Grid>
					</CardContent>
				</CardActionArea>
				{/* {owner && (
					<CardActions>
						<Remove member={list.id} group={group} getMembers={getMembers} setAlert={setAlert} />
					</CardActions>
				)} */}
			</Card>

			<Snackbar open={alert.open} autoHideDuration={3500} onClose={handleAlertClose}>
				<Alert onClose={handleAlertClose} severity={alert.severity}>
					{alert.message}
				</Alert>
			</Snackbar>
		</div>
	);
}
