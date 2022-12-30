import React, { Component } from 'react';
import { isMobile } from 'react-device-detect';

import * as muiIcons from '@mui/icons-material';

import NotificationsIcon from '@mui/icons-material/Notifications';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';

import Popover from '@mui/material/Popover';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';

import { firebaseAuth } from '../../firebase/constants';

function IconLookup(props) {
	try {
		var Icon = {
			icon: muiIcons?.[props?.icon],
		};
		if (Icon) {
			return <Icon.icon />;
		} else {
			return <NotificationsIcon />;
		}
	} catch (error) {
		console.log(error);
		return <NotificationsIcon />;
	}
}

class MyNetwork extends Component {
	constructor(props) {
		super(props);
		this.state = {
			notifications: [],

			popoverOpen: false,
			popoverAnchorEl: null,
			opened: false,
		};

		// console.log(props);
	}

	componentDidMount() {
		if (!this.state.opened) {
			this.getNotifications();
		}

		this.props.socket.on('req:getNewNotification', (notifications) => {
			this.getNotifications();
		});
	}

	getNotifications = () => {
		this.props.socket.emit('req:getNotifications', firebaseAuth().currentUser.uid);
		this.props.socket.on('res:getNotifications', (notifications) => {
			this.setState({ notifications: notifications });
		});
	};

	MarkNotificationsRead = () => {
		this.props.socket.emit('req:markNotificationsRead', firebaseAuth().currentUser.uid);
		// this.getNotifications();
	};

	render() {
		return (
			<>
				<Tooltip title='Alerts • No alerts'>
					<IconButton
						color='inherit'
						onClick={(e) => {
							this.setState({ popoverAnchorEl: e.currentTarget, popoverOpen: true });
						}}
					>
						<Badge badgeContent={!this.state.opened ? this.state.notifications.filter((n) => !n.read?.includes(firebaseAuth().currentUser.uid)).length : 0} color='error'>
							<NotificationsIcon />
						</Badge>
					</IconButton>
				</Tooltip>

				<Popover
					open={this.state.popoverOpen}
					anchorEl={this.state.popoverAnchorEl}
					onClose={() => {
						this.setState({ popoverAnchorEl: null, popoverOpen: false, opened: true });
						this.MarkNotificationsRead();
					}}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'right',
					}}
					transformOrigin={{
						vertical: 'top',
						horizontal: 'right',
					}}
				>
					<List style={{ width: isMobile ? '90vw' : '35vw' }}>
						{this.state.notifications.map((notification) => (
							<React.Fragment>
								<ListItem
									alignItems='flex-start'
									button={notification.path ? true : false}
									onClick={() => {
										if (notification.path) {
											this.setState({ popoverAnchorEl: null, popoverOpen: false });
										}
									}}
								>
									<ListItemAvatar>
										{notification.read?.includes(firebaseAuth().currentUser.uid) ? (
											<Avatar>{muiIcons[notification?.iconKey] ? <IconLookup icon={notification.iconKey} /> : <NotificationsIcon />}</Avatar>
										) : (
											<Badge color='secondary' variant='dot'>
												<Avatar>{muiIcons[notification?.iconKey] ? <IconLookup icon={notification.iconKey} /> : <NotificationsIcon />}</Avatar>
											</Badge>
										)}
									</ListItemAvatar>
									<ListItemText primary={notification.title} secondary={notification.detail} />
								</ListItem>
								<Divider component='li' />
							</React.Fragment>
						))}

						{this.state.notifications.length === 0 && (
							<ListItem>
								<ListItemText primary={'No Notifications'} />
							</ListItem>
						)}
					</List>
				</Popover>
			</>
		);
	}
}

export default MyNetwork;
