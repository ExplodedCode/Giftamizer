import React from 'react';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import Alert from '@mui/material/Alert';

import ItemCard from '../../Items/ItemCard';

import { firebaseAuth } from '../../../../firebase/constants';
import { getListDetails } from '../../../../firebase/gift/lists';

import EditList from './Edit';
import CreateItem from '../../Items/Create';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			list: this.props.match.params.list,
			items: [],

			showAssignError: false,
		};
	}

	componentDidMount() {
		this.getItems();
	}

	getItems = () => {
		this.setState({
			showAssignError: false,
		});
		this.props.socket.emit('req:listItemsData', { userId: firebaseAuth().currentUser.uid, listId: this.props.match.params.list });
		this.props.socket.on('res:listItemsData', (result) => {
			// console.log(result);
			if (result) {
				this.setState({
					items: result,
					loading: false,
				});
			} else {
				this.setState({
					loading: false,
				});
			}
			this.getListGroupsError();
		});
	};

	getListGroupsError = () => {
		getListDetails(this.props.match.params.list).then((result) => {
			console.log(result);

			if (result.groups.length === 0) {
				this.setState({
					showAssignError: true,
				});
			}
		});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					{this.state.showAssignError && (
						<Alert severity='warning' style={{ marginBottom: 16, marginTop: 64 }}>
							<b>This list is not assigned to a group!</b> — In order for items to show up in groups they must be assigned to a list and lists must be assigned to a group.
							<b>Add a group in the list settings.</b>
						</Alert>
					)}

					<Grid container spacing={3}>
						{this.state.items.map((item, i) => (
							<Grid key={item.id} item xs={12}>
								<ItemCard getItems={this.getItems} item={item} inList />
							</Grid>
						))}
					</Grid>

					{this.state.items.length === 0 && !this.state.loading && (
						<Grid item xs={12} style={{ textAlign: 'center' }}>
							<Typography variant='h5' gutterBottom style={{ marginTop: 100 }}>
								This list is empty.
							</Typography>
						</Grid>
					)}
				</Container>
				<EditList list={this.props.match.params.list} getItems={this.getItems} />
				<CreateItem list={this.props.match.params.list} getItems={this.getItems} isMobile={this.props.isMobile} />
			</div>
		);
	}
}

export default Landing;
