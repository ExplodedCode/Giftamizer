import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import MemberCard from './MemberCard';
import NonUsersListCard from './NonUsersListCard';

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
		};
	}

	componentDidMount() {
		if (!this.state.didLoad) {
			this.getMembers();
			this.getMembersNonUsersLists();
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
	getMembersNonUsersLists = () => {
		this.props.socket.emit('req:nonUserLists', { groupId: this.props.match.params.group });
		this.props.socket.on('res:nonUserLists', (result) => {
			if (result) {
				console.log(result);
				this.setState({
					nonUsersLists: result,
					loading: false,
				});
			} else {
				this.setState({
					loading: false,
				});
			}
			this.props.socket.off('res:nonUserLists');
		});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					<Grid container spacing={3}>
						{this.state.members.length === 0 && this.state.nonUsersLists.length === 0 && !this.state.loading ? (
							<Grid item xs={12} style={{ textAlign: 'center' }}>
								<Typography variant='h5' gutterBottom style={{ marginTop: 100 }}>
									This group has no members, invite some friends and family!
								</Typography>
							</Grid>
						) : (
							<React.Fragment>
								{this.state.members.map((member, i) => (
									<Grid item xl={3} lg={4} md={6} sm={12} xs={12}>
										<MemberCard
											key={this.props.match.params.group}
											group={this.props.match.params.group}
											member={member}
											getMembers={this.getMembers}
											owner={this.state.owner === firebaseAuth().currentUser.uid}
										/>
									</Grid>
								))}
								{this.state.nonUsersLists.map((nonUsersList, i) => (
									<Grid item xl={3} lg={4} md={6} sm={12} xs={12}>
										<NonUsersListCard
											key={this.props.match.params.group}
											group={this.props.match.params.group}
											list={nonUsersList}
											getMembers={this.getMembers}
											owner={this.state.owner === firebaseAuth().currentUser.uid}
										/>
									</Grid>
								))}
							</React.Fragment>
						)}
					</Grid>
				</Container>
			</div>
		);
	}
}

export default Landing;
