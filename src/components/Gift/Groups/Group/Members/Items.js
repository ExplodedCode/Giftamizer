import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import ItemCard from './ItemCard';

import { db, firebaseAuth } from '../../../../../firebase/constants';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			items: [],
			lists: [],
			owner: null,
			didLoad: false,
			loading: true,
		};
	}

	componentDidMount() {
		if (!this.state.didLoad) {
			this.getMemberList();
		}
	}

	getMemberList = () => {
		this.setState({ lists: [] });

		db.collection('lists')
			.where('groups', 'array-contains', this.props.match.params.group)
			.where('owner', '==', this.props.match.params.member)
			.where('isForChild', '==', false)

			.onSnapshot((querySnapshot) => {
				var lists = [];
				querySnapshot.forEach(function (doc) {
					lists.push(doc.id);
				});
				this.setState({ lists: lists }, () => {
					this.getMemberItems();
				});
			});
		this.setState({ loading: false });
	};

	getMemberItems = () => {
		this.setState({ items: [] });

		console.log('start');

		this.state.lists.forEach((list) => {
			db.collection('items')
				.where('lists', 'array-contains', list)
				.where('owner', '==', this.props.match.params.member)
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
							var itemItem = { ...change.doc.data(), id: change.doc.id };
							var MtempItems = this.state.items;
							MtempItems[this.state.items.indexOf(this.state.items.filter((e) => e.id === itemItem.id)[0])] = itemItem;
							this.setState({ items: MtempItems });
						}
						if (change.type === 'removed') {
							var RtempItems = this.state.items;
							delete RtempItems[this.state.items.indexOf(this.state.items.filter((e) => e.id === change.doc.id)[0])];
							this.setState({ items: RtempItems });
						}
					});
				});
		});
	};

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					{this.props.match.params.member === firebaseAuth().currentUser.uid ? (
						<img src='/images/lumpofcoal.png' alt='coal' style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '25%' }} />
					) : (
						<Grid container spacing={3}>
							{this.state.items.map((item, i) => (
								<Grid item xs={12}>
									<ItemCard item={item} />
								</Grid>
							))}
							{this.state.items.length === 0 && !this.state.loading && (
								<Grid item xs={12} style={{ textAlign: 'center' }}>
									<Typography variant='h5' gutterBottom style={{ marginTop: 100 }}>
										This person has not added items.
									</Typography>
								</Grid>
							)}
						</Grid>
					)}
				</Container>
			</div>
		);
	}
}

export default Landing;
