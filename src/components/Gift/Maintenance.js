import React from 'react';

import CircularProgress from '@material-ui/core/CircularProgress';

import ListSubheader from '@material-ui/core/ListSubheader';
import Divider from '@material-ui/core/Divider';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import BuildIcon from '@material-ui/icons/Build';

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
