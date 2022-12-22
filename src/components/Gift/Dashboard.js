import React from 'react';
import withStyles from '@mui/styles/withStyles';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import Badge from '@mui/material/Badge';

import DesignServicesIcon from '@mui/icons-material/DesignServices';
import CodeIcon from '@mui/icons-material/Code';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
// import GroupIcon from '@mui/icons-material/Group';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import StarIcon from '@mui/icons-material/Star';
import MenuIcon from '@mui/icons-material/Menu';

// import StorageIcon from '@mui/icons-material/Storage';

// import WarningIcon from '@mui/icons-material/Warning';

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
						November 1, 2021
					</Typography>
					<List>
						<ListItem>
							<ListItemIcon>
								<StyledBadge badgeContent={'NEW'} color='secondary'>
									<DesignServicesIcon />
								</StyledBadge>
							</ListItemIcon>
							<ListItemText
								primary='Migrated MUI from v4 to v5'
								secondary={
									<>
										<a href='https://mui.com/' target='_blank' rel='noopener noreferrer'>
											Material UI
										</a>{' '}
										provides a robust and customizable library of foundational and advanced components for React application.
										<CodeIcon style={{ fontSize: '1rem', marginBottom: -3, paddingLeft: 2, color: '#4caf50' }} />
									</>
								}
							/>
						</ListItem>
						<ListItem>
							<ListItemIcon>
								<MenuOpenIcon />
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
								<StarIcon />
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
