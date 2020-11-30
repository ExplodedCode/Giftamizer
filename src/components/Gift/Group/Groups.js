import React from 'react';

import { Link } from 'react-router-dom';

import { withTheme } from '@material-ui/styles';
import withWidth from '@material-ui/core/withWidth';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';

import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
import orange from '@material-ui/core/colors/orange';

import SpeedDial from './SpeedDial';
import GroupCard from './GroupCard';

import { getMyGroups } from '../../../firebase/gift/groups';
import { SentimentSatisfied } from '@material-ui/icons';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			groups: [],
		};
	}

	componentDidMount() {
		this.getGroups();
	}

	getGroups = () => {
		getMyGroups().then((result) => {
			var groups = [];
			//Do whatever you want with the result value
			result.forEach(function (doc) {
				groups.push(doc.data());
			});
			this.setState({ groups: groups });
		});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 96 }}>
					<Grid container spacing={3}>
						{this.state.groups.map((group, i) => (
							<Grid key={group.id} item xl={3} lg={4} md={6} sm={12} xs={12}>
								<GroupCard getGroups={this.getGroups} group={group} />
							</Grid>
						))}
					</Grid>
				</Container>
				<SpeedDial />
			</div>
		);
	}
}

export default Landing;
