import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import SpeedDial from './SpeedDial';
import GroupCard from './GroupCard';

import { firebaseAuth } from '../../../firebase/constants';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			groups: [],
			loading: true,
		};
		props.setTitle('My Groups');
	}

	componentDidMount() {
		this.props.socket.emit('join', 'myGroups:' + firebaseAuth().currentUser.uid);
		this.getGroups();
	}

	getGroups = () => {
		this.props.socket.emit('req:groupsData', firebaseAuth().currentUser.uid);
		this.props.socket.on('res:groupsData', (result) => {
			if (result) {
				this.setState({
					groups: result,
					loading: false,
				});
			} else {
				this.setState({
					loading: false,
				});
			}
		});
	};

	componentWillUnmount() {
		this.props.socket.emit('leave', 'myGroups:' + firebaseAuth().currentUser.uid);
		this.props.socket.off('req:groupsData');
	}

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					<Grid container spacing={3}>
						{this.state.groups.map((group, i) => (
							<Grid key={group.id} item xl={3} lg={4} md={6} sm={12} xs={12}>
								<GroupCard socket={this.props.socket} getGroups={this.getGroups} group={group} />
							</Grid>
						))}
						{this.state.groups.length === 0 && !this.state.loading && (
							<Grid item xs={12} style={{ textAlign: 'center' }}>
								<Typography variant='h5' gutterBottom style={{ marginTop: 100 }}>
									You don't have any groups, create or join a group with your friends and family!
								</Typography>
							</Grid>
						)}
					</Grid>
				</Container>
				<SpeedDial socket={this.props.socket} getGroups={this.getGroups} isMobile={this.props.isMobile} />
			</div>
		);
	}
}

export default Landing;
