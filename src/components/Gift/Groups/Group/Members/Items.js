import React from 'react';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import ItemCard from './ItemCard';

import { firebaseAuth } from '../../../../../firebase/constants';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			items: [],
			owner: null,
			loading: true,
		};
	}

	componentDidMount() {
		this.getMemberItems();

		this.props.socket.emit('join', 'liveitems:' + this.props.match.params.member);
		this.props.socket.on('res:updateLiveItems', () => {
			this.props.socket.emit('req:userItemsData', { userId: this.props.match.params.member, groupId: this.props.match.params.group });
		});
	}

	getMemberItems = () => {
		this.props.socket.emit('req:userItemsData', { userId: this.props.match.params.member, groupId: this.props.match.params.group });
		this.props.socket.on('res:userItemsData', (result) => {
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
									<ItemCard item={item} getMemberItems={this.getMemberItems} />
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
