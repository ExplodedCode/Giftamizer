import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import CreateItem from './Create';
import ItemCard from './ItemCard';

import { getMyItems } from '../../../firebase/gift/items';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			items: [],
			loading: true,
		};
		props.setTitle('My Items');
	}

	componentDidMount() {
		this.getItems();
	}

	getItems = () => {
		getMyItems().then((result) => {
			var items = [];
			//Do whatever you want with the result value
			if (result !== 'error') {
				result.forEach(function (doc) {
					items.push({ ...doc.data(), id: doc.id });
				});
				this.setState({ items: items, loading: false });
			}
		});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					<Grid container spacing={3}>
						{this.state.items.map((item, i) => (
							<Grid key={item.id} item xs={12}>
								<ItemCard getItems={this.getItems} item={item} />
							</Grid>
						))}
					</Grid>
					{this.state.items.length === 0 && !this.state.loading && (
						<Grid item xs={12} style={{ textAlign: 'center' }}>
							<Typography variant='h5' gutterBottom style={{ marginTop: 100 }}>
								You don't have any items.
							</Typography>
						</Grid>
					)}
				</Container>
				<CreateItem getItems={this.getItems} />
			</div>
		);
	}
}

export default Landing;