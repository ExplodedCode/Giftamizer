import React from 'react';

import CircularProgress from '@mui/material/CircularProgress';

import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import BuildIcon from '@mui/icons-material/Build';

import { firebaseAuth } from '../../firebase/constants';

class navMenu extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			maintenance: true,

			user: null,
			loading: true,
		};
	}

	componentDidMount() {
		this.props.socket.emit('req:userData', firebaseAuth().currentUser.uid);
		this.props.socket.on('res:userData', (result) => {
			// console.log(result);
			if (result) {
				this.props.socket.emit('req:maintenance', null);
				this.props.socket.on('res:maintenance', (doc) => {
					this.setState(
						{
							maintenance: doc.status,
						},
						() => {
							this.setState({
								user: result,
								loading: false,
							});
						}
					);
				});
			} else {
				this.setState({
					user: { email: <span style={{ color: 'red' }}>Error loading user info!</span> },
					loading: false,
				});
			}
		});
	}

	render() {
		return this.state.loading ? (
			<React.Fragment>
				<CircularProgress style={{ margin: 'auto' }} />
			</React.Fragment>
		) : (
			<React.Fragment>
				<Divider />
				<ListSubheader inset>System</ListSubheader>
				<ListItem>
					<ListItemIcon>
						<BuildIcon />
					</ListItemIcon>
					<FormControlLabel control={<Switch color='primary' />} label='Maintenance' />
				</ListItem>
			</React.Fragment>
		);
	}
}
export default navMenu;
