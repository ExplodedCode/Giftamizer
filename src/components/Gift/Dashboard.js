import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';

import Badge from '@material-ui/core/Badge';

import ListAltIcon from '@material-ui/icons/ListAlt';
import GroupIcon from '@material-ui/icons/Group';

const StyledBadge = withStyles((theme) => ({
	badge: {
		top: -4,
		right: -8,
		padding: 6,
		height: 10,
		fontSize: '0.55rem',
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
					<Typography variant='h5'>Welcome to the new and improved Giftamizer!</Typography>
					<br />
					<Typography variant='subtitle1'>
						If you had an account previously you items and groups have been transfered. If you find any issues please contact Evan via email <a href='mailto:evan@trowbridge.tech'>here</a>.
					</Typography>
					<Typography variant='subtitle1'>Some items that had either quotation marks or anglospheres may need fixed.</Typography>
					<br />
					<Typography variant='h5'>What NEW!</Typography>
					<List>
						<ListItem>
							<ListItemIcon>
								<StyledBadge badgeContent={'NEW'} color='secondary'>
									<ListAltIcon />
								</StyledBadge>
							</ListItemIcon>
							<ListItemText primary='Create lists that can move between groups.' secondary='Lists are asigned to groups' />
						</ListItem>
						<ListItem>
							<ListItemIcon>
								<StyledBadge badgeContent={'NEW'} color='secondary'>
									<i className='fas fa-gift' style={{ fontSize: '1.19rem', marginLeft: 2 }} />
								</StyledBadge>
							</ListItemIcon>
							<ListItemText primary='Asign items to the groups you want them to show up in.' secondary='Items are asigned to lists' />
						</ListItem>
						<ListItem>
							<ListItemIcon>
								<StyledBadge badgeContent={'NEW'} color='secondary'>
									<GroupIcon />
								</StyledBadge>
							</ListItemIcon>
							<ListItemText primary='Add a cover image to your groups' secondary='Or select a color from the NEW color picker.' />
						</ListItem>
						<ListItem>
							<ListItemIcon>
								<StyledBadge badgeContent={'NEW'} color='secondary'>
									<i className='fas fa-baby-carriage' style={{ fontSize: '1.19rem', marginLeft: 2 }} />
								</StyledBadge>
							</ListItemIcon>
							<ListItemText primary='Create a lists for your kids (or pet😉)' secondary='These lists will display separately from yours.' />
						</ListItem>
					</List>
				</Container>
			</div>
		);
	}
}

export default Landing;
