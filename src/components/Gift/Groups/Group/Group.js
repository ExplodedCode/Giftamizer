import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import MemberCard from './MemberCard';
import NonUsersListCard from './NonUsersListCard';

import { firebaseAuth } from '../../../../firebase/constants';

import { getGroupMemberIds, getUserInfo, getNonUserLists } from '../../../../firebase/gift/members';

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
		this.setState({ members: [] });

		getGroupMemberIds(this.props.match.params.group).then((group) => {
			if (group !== 'error') {
				group.members.forEach((member) => {
					getUserInfo(member).then((userInfo) => {
						if (userInfo !== 'error' && userInfo.id !== firebaseAuth().currentUser.uid) {
							this.setState({ members: [...this.state.members, userInfo], didLoad: true, owner: group.owner, loading: false });
						}
					});
				});
				if (group.members.length <= 1) {
					this.setState({ loading: false });
				}
			}
		});
	};
	getMembersNonUsersLists = () => {
		this.setState({ nonUsersLists: [] });

		getNonUserLists(this.props.match.params.group).then((lists) => {
			lists.forEach((doc) => {
				// doc.data() is never undefined for query doc snapshots
				console.log(doc.id, ' => ', doc.data());
				this.setState({ nonUsersLists: [...this.state.nonUsersLists, { name: doc.data().name, id: doc.id, owner: doc.data().owner }] });
			});
		});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					<Grid container spacing={3}>
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
						{this.state.members.length === 0 && !this.state.loading && (
							<Grid item xs={12} style={{ textAlign: 'center' }}>
								<Typography variant='h5' gutterBottom style={{ marginTop: 100 }}>
									This group has no members, invite some friends and family!
								</Typography>
							</Grid>
						)}
					</Grid>
				</Container>
			</div>
		);
	}
}

export default Landing;
