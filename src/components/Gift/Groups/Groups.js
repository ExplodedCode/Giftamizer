import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import SpeedDial from './SpeedDial';
import GroupCard from './GroupCard';

import { getMyGroups } from '../../../firebase/gift/groups';

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
		this.getGroups();
	}

	getGroups = () => {
		getMyGroups().then((result) => {
			var groups = [];
			//Do whatever you want with the result value
			if (result !== 'error') {
				result.forEach(function (doc) {
					groups.push(doc.data());
				});
				this.setState({ groups: groups, loading: false });
			}
		});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					<Grid container spacing={3}>
						{this.state.groups.map((group, i) => (
							<Grid key={group.id} item xl={3} lg={4} md={6} sm={12} xs={12}>
								<GroupCard getGroups={this.getGroups} group={group} />
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
				<SpeedDial getGroups={this.getGroups} />
			</div>
		);
	}
}

export default Landing;
