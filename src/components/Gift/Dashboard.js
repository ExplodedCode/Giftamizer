import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';

import Badge from '@material-ui/core/Badge';

import MenuOpenIcon from '@material-ui/icons/MenuOpen';
import GroupIcon from '@material-ui/icons/Group';
import EmojiEmotionsIcon from '@material-ui/icons/EmojiEmotions';
import StarIcon from '@material-ui/icons/Star';
import MenuIcon from '@material-ui/icons/Menu';

import StorageIcon from '@material-ui/icons/Storage';

// import WarningIcon from '@material-ui/icons/Warning';

const StyledBadge = withStyles((theme) => ({
	badge: {
		top: -4,
		right: -8,
		padding: 6,
		height: 10,
		fontSize: '0.55rem',
		zIndex: 0,
	},
}))(Badge);

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			groups: [],
			loading: true,
		};
		props.setTitle('Dashboard');
	}

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 16 }}>
					<Typography variant='h5'>What's NEW!</Typography>
					<Typography variant='caption' color='textSecondary'>
						June 26, 2021
					</Typography>
					<List>
						<ListItem>
							<ListItemIcon>
								<StyledBadge badgeContent={'NEW'} color='secondary'>
									<MenuOpenIcon />
								</StyledBadge>
							</ListItemIcon>
							<ListItemText
								primary='Updated Navigation'
								secondary={
									<>
										Redesigned the side menu navigation to be more user friendly
										<EmojiEmotionsIcon style={{ fontSize: '1rem', marginBottom: -3, paddingLeft: 2, color: '#4caf50' }} />
									</>
								}
							/>
						</ListItem>
						<ListItem>
							<ListItemIcon>
								<StyledBadge badgeContent={'NEW'} color='secondary'>
									<StarIcon />
								</StyledBadge>
							</ListItemIcon>
							<ListItemText
								primary='Pinning Groups'
								secondary={
									<>
										Now pin your favorite and most frequently accessed groups the the side navigation menu
										<MenuIcon style={{ fontSize: '1rem', marginBottom: -3, paddingLeft: 2, color: '#4caf50' }} />
									</>
								}
							/>
						</ListItem>
						<ListItem>
							<ListItemIcon>
								<StyledBadge badgeContent={'NEW'} color='secondary'>
									<StorageIcon />
								</StyledBadge>
							</ListItemIcon>
							<ListItemText
								primary='Improved Database Requests'
								secondary={
									<>
										More efficient queries for groups <GroupIcon style={{ fontSize: '1rem', marginBottom: -3, paddingLeft: 2, color: '#4caf50' }} />
									</>
								}
							/>
						</ListItem>
					</List>
					<br />
					<br />
					<Typography variant='subtitle1'>
						If you had an account previously you items and groups have been transferred. If you find any issues please contact Evan via email <a href='mailto:evan@trowbridge.tech'>here</a>
						.
					</Typography>
				</Container>
			</div>
		);
	}
}

export default Landing;
