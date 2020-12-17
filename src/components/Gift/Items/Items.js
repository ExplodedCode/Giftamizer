import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import Alert from '@material-ui/lab/Alert';

import CreateItem from './Create';
import ItemCard from './ItemCard';

import { firebaseAuth } from '../../../firebase/constants';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			items: [],
			loading: true,

			showAssignError: false,
		};
		props.setTitle('My Items');
	}

	componentDidMount() {
		this.getItems();
	}

	getItems = () => {
		this.props.socket.emit('req:itemsData', firebaseAuth().currentUser.uid);
		this.props.socket.on('res:itemsData', (result) => {
			console.log(result);
			if (result) {
				this.setState({
					items: result,
					loading: false,
				});

				var showAssignError = false;
				result.forEach((item) => {
					if (item.lists.length == 0) {
						showAssignError = true;
					}
				});
				this.setState({
					showAssignError: showAssignError,
				});
			} else {
				this.setState({
					loading: false,
				});
			}
		});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					{this.state.showAssignError && (
						<Alert severity='warning' style={{ marginBottom: 16 }}>
							<b>An item is not assigned to a lists!</b> — In order for items to show up in groups they must be assigned to a list and lists must be assigned to a group.
						</Alert>
					)}

					{this.state.items.length === 0 && !this.state.loading ? (
						<Grid item xs={12} style={{ textAlign: 'center' }}>
							<Typography variant='h5' gutterBottom style={{ marginTop: 100 }}>
								You don't have any items.
							</Typography>
						</Grid>
					) : (
						<Grid container spacing={3}>
							{this.state.items.map((item, i) => (
								<Grid key={item.id} item xs={12}>
									<ItemCard getItems={this.getItems} item={item} />
								</Grid>
							))}
						</Grid>
					)}
				</Container>
				<CreateItem getItems={this.getItems} isMobile={this.props.isMobile} />
			</div>
		);
	}
}

export default Landing;
