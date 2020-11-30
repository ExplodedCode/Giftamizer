import React from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

import Alert from '../../../Alert';
import Snackbar from '@material-ui/core/Snackbar';

import Remove from './Remove';

const useStyles = makeStyles({
	CardMedia: {
		fontSize: '1000%',
		backgroundColor: '#03a9f4',
		color: 'white',
		textAlign: 'center',
	},
});

export default function GroupCard({ group, member, getMembers, owner }) {
	const classes = useStyles();

	const [alert, setAlert] = React.useState({ open: false, message: '', severity: 'info' });
	const handleAlertClose = (event, reason) => {
		setAlert({ open: false, message: alert.message, severity: alert.severity });
	};

	return (
		<div>
			<Card>
				<CardActionArea component={Link} to={'/gift/group/' + group + '/member/' + member.id}>
					{member.backgroundType === 'color' ? (
						<CardMedia style={{ fontSize: '1000%', textAlign: 'center', backgroundColor: member.backgroundValue, color: member.textShade === 'dark' ? '#000000de' : '#fff' }}>
							{member.displayName.charAt(0).toUpperCase()}
						</CardMedia>
					) : (
						<CardMedia className={classes.CardMedia} style={{ height: 200 }} image={member.backgroundValue} title={member.name} />
					)}
					<CardContent>
						<Typography gutterBottom variant='h5' component='h2'>
							{member.displayName}
						</Typography>
					</CardContent>
				</CardActionArea>
				{owner && (
					<CardActions>
						<Remove member={member.id} group={group} getMembers={getMembers} setAlert={setAlert} />
					</CardActions>
				)}
			</Card>

			<Snackbar open={alert.open} autoHideDuration={3500} onClose={handleAlertClose}>
				<Alert onClose={handleAlertClose} severity={alert.severity}>
					{alert.message}
				</Alert>
			</Snackbar>
		</div>
	);
}
