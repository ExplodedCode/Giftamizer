import React from 'react';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import Alert from '@mui/material/Alert';

import MemberCard from './MemberCard';
import NonUsersListCard from './NonUsersListCard';

import Invite from '../Invite';

import { firebaseAuth } from '../../../../firebase/constants';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			members: [],
			nonUsersLists: [],
			owner: null,
			didLoad: false,
			loading: true,

			showAssignError: false,
		};
		props.setTitle('My Groups');

		console.log(props);
	}

	componentDidMount() {
		if (!this.state.didLoad) {
			this.getMembers();
			this.getLists();
		}
	}

	getMembers = () => {
		this.props.socket.emit('req:groupMembers', { groupId: this.props.match.params.group, userId: firebaseAuth().currentUser.uid });
		this.props.socket.on('res:groupMembers', (result) => {
			if (result) {
				this.setState({
					members: result,
					loading: false,
				});
			} else {
				this.setState({
					loading: false,
				});
			}
			this.props.socket.off('res:groupMembers');
		});
	};

	getLists = () => {
		this.props.socket.emit('req:myListsInGroup', { groupId: this.props.match.params.group, userId: firebaseAuth().currentUser.uid });
		this.props.socket.on('res:myListsInGroup', (result) => {
			if (result < 1) {
				console.log(result);
				this.setState({
					showAssignError: true,
				});
			}
			this.props.socket.off('res:myListsInGroup');
		});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					{this.state.showAssignError && (
						<Alert severity='warning' style={{ marginBottom: 16 }}>
							<b>You are not sharing any lists with this group!</b> — In order for items to show up in this group they must be assigned to a list; the list must be assigned to this
							group.
						</Alert>
					)}

					{this.state.loading ? (
						<CircularProgress />
					) : (
						<Grid container spacing={3}>
							{this.state.members.length === 0 && this.state.nonUsersLists.length === 0 && !this.state.loading ? (
								<Grid item xs={12} style={{ textAlign: 'center' }}>
									<Typography variant='h5' gutterBottom style={{ marginTop: 100 }}>
										This group has no members, invite some friends and family!
										<br />
										<br />
										<Invite socket={this.props.socket} group={this.props.match.params.group} fromNoMembers />
									</Typography>
								</Grid>
							) : (
								<React.Fragment>
									{this.state.members
										.sort(function (a, b) {
											var textA, textB;
											if (a?.isForChild) {
												textA = a.name.toUpperCase();
											} else {
												textA = a.displayName.toUpperCase();
											}
											if (b?.isForChild) {
												textB = b.name.toUpperCase();
											} else {
												textB = b.displayName.toUpperCase();
											}

											return textA < textB ? -1 : textA > textB ? 1 : 0;
										})
										.map((member, i) => (
											<Grid item xl={3} lg={4} md={6} sm={12} xs={12}>
												{member.isForChild ? (
													<NonUsersListCard
														key={this.props.match.params.group}
														group={this.props.match.params.group}
														list={member}
														getMembers={this.getMembers}
														owner={this.state.owner === firebaseAuth().currentUser.uid}
													/>
												) : (
													<MemberCard
														key={this.props.match.params.group}
														group={this.props.match.params.group}
														member={member}
														getMembers={this.getMembers}
														owner={this.props.group === firebaseAuth().currentUser.uid}
													/>
												)}
											</Grid>
										))}
								</React.Fragment>
							)}
						</Grid>
					)}
				</Container>
			</div>
		);
	}
}

export default Landing;
