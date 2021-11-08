import React from 'react';
import { Link } from 'react-router-dom';

import makeStyles from '@mui/styles/makeStyles';

import Grid from '@mui/material/Grid';
import PersonIcon from '@mui/icons-material/Person';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

import Alert from '../../../Alert';
import Snackbar from '@mui/material/Snackbar';

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
				<CardActionArea component={Link} to={'/gift/group/' + group + '/member/' + member.uid}>
					{member.backgroundType === 'color' ? (
						<CardMedia style={{ fontSize: '1000%', textAlign: 'center', backgroundColor: member.backgroundValue, color: member.textShade === 'dark' ? '#000000de' : '#fff' }}>
							{member.displayName.charAt(0).toUpperCase()}
						</CardMedia>
					) : (
						<CardMedia className={classes.CardMedia} style={{ height: 200 }} image={member.backgroundValue} title={member.name} />
					)}
					<CardContent>
						<Grid container>
							<Grid item xs>
								<Typography variant='h5' component='h2'>
									{member.displayName}
								</Typography>
							</Grid>
							<Grid item>
								<PersonIcon />
							</Grid>
						</Grid>
					</CardContent>
				</CardActionArea>
				{/* {owner && (
					<CardActions>
						<Remove member={member.id} group={group} getMembers={getMembers} setAlert={setAlert} />
					</CardActions>
				)} */}
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
