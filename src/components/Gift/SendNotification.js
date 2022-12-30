import React, { Component } from 'react';

import * as muiIcons from '@mui/icons-material';

import NotificationsIcon from '@mui/icons-material/Notifications';

import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CampaignIcon from '@mui/icons-material/Campaign';

import Paper from '@mui/material/Paper';
import Badge from '@mui/material/Badge';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import SearchIcons from './SearchIcons';
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

class SendNotification extends Component {
	constructor(props) {
		super(props);
		this.state = {
			open: false,

			title: '',
			detail: '',
			iconKey: null,
		};
	}

	sendNotification = () => {
		var notification = {
			title: this.state.title,
			detail: this.state.detail,
			to: ['*'],
			iconKey: this.state.iconKey,
		};

		this.props.socket.emit('req:sendNotification', notification);
		// this.getNotifications();

		this.setState({
			title: '',
			detail: '',
			iconKey: null,
		});
	};

	checkValid = () => {
		if (this.state.iconKey == null) return true;
		if (this.state.title.trim().length === 0) return true;
		if (this.state.detail.trim().length === 0) return true;

		return false;
	};

	render() {
		return (
			<div>
				<ListItem button onClick={() => this.setState({ open: true })}>
					<ListItemIcon>
						<CampaignIcon />
					</ListItemIcon>
					<ListItemText primary='Send Notification' />
				</ListItem>

				<Dialog open={this.state.open} onClose={() => this.setState({ open: false })}>
					<DialogTitle>Send Notification</DialogTitle>

					<DialogContent>
						<Grid container spacing={2}>
							<Grid item xs={12}>
								Preview:
								<Paper>
									<List>
										<React.Fragment>
											<ListItem alignItems='flex-start'>
												<ListItemAvatar>
													<Badge color='secondary' variant='dot'>
														<Avatar>{muiIcons[this.state.iconKey] ? <IconLookup icon={this.state.iconKey} /> : <NotificationsIcon />}</Avatar>
													</Badge>
												</ListItemAvatar>
												<ListItemText primary={this.state.title} secondary={this.state.detail} />
											</ListItem>
										</React.Fragment>
									</List>
								</Paper>
							</Grid>
							<Grid item xs={12}>
								<TextField autoFocus margin='dense' label='Title' fullWidth variant='standard' value={this.state.title} onChange={(e) => this.setState({ title: e.target.value })} />
							</Grid>
							<Grid item xs={12}>
								<TextField
									autoFocus
									margin='dense'
									label='Message'
									fullWidth
									variant='standard'
									value={this.state.detail}
									onChange={(e) => this.setState({ detail: e.target.value })}
								/>
							</Grid>
							<Grid item xs={12}>
								<SearchIcons onChange={(icon) => this.setState({ iconKey: icon.key })} />
							</Grid>
						</Grid>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => this.setState({ open: false })} color='inherit'>
							Cancel
						</Button>
						<Button
							onClick={() => {
								this.sendNotification();
								this.setState({ open: false });
							}}
							variant='contained'
							disabled={this.checkValid()}
						>
							Send
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		);
	}
}

export default SendNotification;
