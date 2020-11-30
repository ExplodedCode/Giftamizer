import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';

import ItemCard from '../../Items/ItemCard';

import { getMyItems } from '../../../../firebase/gift/items';

import EditList from './Edit';
import CreateItem from '../../Items/Create';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			list: this.props.match.params.list,
			items: [],
		};
	}

	componentDidMount() {
		this.getItems();
	}

	getItems = () => {
		getMyItems(this.state.list).then((result) => {
			var items = [];
			//Do whatever you want with the result value
			if (result !== 'error') {
				result.forEach(function (doc) {
					items.push({ ...doc.data(), id: doc.id });
				});
				this.setState({ items: items });
			} else {
				console.log('error');
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
								<ItemCard getItems={this.getItems} item={item} inList />
							</Grid>
						))}
					</Grid>
				</Container>
				<EditList list={this.props.match.params.list} getItems={this.getItems} />
				<CreateItem list={this.props.match.params.list} getItems={this.getItems} />
			</div>
		);
	}
}

export default Landing;
