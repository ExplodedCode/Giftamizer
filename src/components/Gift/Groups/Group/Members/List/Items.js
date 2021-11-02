import React from 'react';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import ItemCard from './ItemCard';

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
			this.getListItems();
		}

		this.props.socket.emit('join', 'livelist:' + this.props.match.params.list);
		this.props.socket.on('res:updateLiveList', () => {
			this.props.socket.emit('req:getListItemsFromGroup', { listId: this.props.match.params.list });
		});
	}

	getListItems = () => {
		this.props.socket.emit('req:getListItemsFromGroup', { listId: this.props.match.params.list });
		this.props.socket.on('res:getListItemsFromGroup', (result) => {
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

	componentWillUnmount() {
		this.props.socket.emit('leave', 'livelist:' + this.props.match.params.list);

		this.props.socket.off('res:updateLiveList');
		this.props.socket.off('res:getListItemsFromGroup');
	}

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					<Grid container spacing={3}>
						{this.state.items.map((item, i) => (
							<Grid item xs={12}>
								<ItemCard item={item} list={this.props.match.params.list} getListItems={this.getListItems} />
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
				</Container>
			</div>
		);
	}
}

export default Landing;
