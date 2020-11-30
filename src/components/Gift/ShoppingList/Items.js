import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import ItemCard from './ItemCard';

import { db, firebaseAuth } from '../../../firebase/constants';

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
		if (!this.state.didLoad) {
			this.getMemberItems();
		}
	}

	getMemberItems = () => {
		this.setState({ items: [] });

		db.collection('items')
			.where('takenBy', '==', firebaseAuth().currentUser.uid)
			.where('status', '==', 'planned')
			.onSnapshot((snapshot) => {
				snapshot.docChanges().forEach((change) => {
					if (change.type === 'added') {
						var item = { ...change.doc.data(), id: change.doc.id };
						if (
							this.state.items.filter(
								(e) =>
									e.id === item.id &&
									e.name === item.name &&
									e.description === item.description &&
									e.url === item.url &&
									e.name === item.name &&
									e.status === item.status &&
									e.takenBy === item.takenBy
							).length === 0
						) {
							this.setState({ items: [...this.state.items, item] });
						}
					}
					if (change.type === 'modified') {
						var tempItem = { ...change.doc.data(), id: change.doc.id };
						var MtempItems = this.state.items;
						MtempItems[this.state.items.indexOf(this.state.items.filter((e) => e.id === tempItem.id)[0])] = tempItem;
						this.setState({ items: MtempItems });
					}
					if (change.type === 'removed') {
						var RtempItems = this.state.items;
						delete RtempItems[this.state.items.indexOf(this.state.items.filter((e) => e.id === change.doc.id)[0])];
						this.setState({ items: RtempItems });
					}
				});
			});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					<Grid container spacing={3}>
						{this.state.items.map((item, i) => (
							<Grid item xs={12}>
								<ItemCard item={item} />
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
