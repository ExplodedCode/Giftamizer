import React from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

import { firebaseAuth } from '../../../firebase/constants';

import Invite from './Invite';
import Edit from './Edit';

const useStyles = makeStyles({
	CardMedia: {
		fontSize: '1000%',
		backgroundColor: '#03a9f4',
		color: 'white',
		textAlign: 'center',
	},
});

export default function GroupCard({ group, getGroups }) {
	const classes = useStyles();

	return (
		<Card>
			<CardActionArea component={Link} to={'/gift/group/' + group.id}>
				{group.backgroundType === 'color' ? (
					<CardMedia className={classes.CardMedia} style={{ backgroundColor: group.backgroundValue, color: group.textShade === 'dark' ? '#000000de' : '#fff' }}>
						{group.name.charAt(0).toUpperCase()}
					</CardMedia>
				) : (
					<CardMedia className={classes.CardMedia} style={{ height: 200 }} image={group.backgroundValue} title={group.name} />
				)}
				<CardContent>
					<Typography gutterBottom variant='h5' component='h2'>
						{group.name}
					</Typography>
					<Typography variant='body2' color='textSecondary' component='p'>
						Invite Code - {group.id}
					</Typography>
				</CardContent>
			</CardActionArea>
			<CardActions>
				<Invite group={group} />
				{group.owner === firebaseAuth().currentUser.uid && <Edit group={group} getGroups={getGroups} />}
			</CardActions>
		</Card>
	);
}
