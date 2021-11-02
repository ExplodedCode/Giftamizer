import React from 'react';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import ItemCard from './ItemCard';

import { firebaseAuth } from '../../../firebase/constants';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			items: [],
			owner: null,
			didLoad: false,
		};
		props.setTitle('My Shopping List');
	}

	componentDidMount() {
		this.getShopingList();
	}

	getShopingList = () => {
		this.setState({ items: [] });

		this.props.socket.emit('req:getShoppingList', { userId: firebaseAuth().currentUser.uid });
		this.props.socket.on('res:getShoppingList', (result) => {
			if (result) {
				console.log(result);

				this.setState({
					items: result,
					loading: false,
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
					<Grid container spacing={3}>
						{this.state.items.map((item, i) => (
							<Grid item xs={12}>
								<ItemCard item={item} getShopingList={this.getShopingList} />
							</Grid>
						))}
						{this.state.items.length === 0 && (
							<Grid item xs={12} style={{ textAlign: 'center' }}>
								<Typography variant='h5' gutterBottom style={{ marginTop: 100 }}>
									You haven't claimed any items.
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
