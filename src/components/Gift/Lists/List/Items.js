import React from 'react';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';

import ItemCard from '../../Items/ItemCard';

import { firebaseAuth } from '../../../../firebase/constants';

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
		this.props.socket.emit('req:listItemsData', { userId: firebaseAuth().currentUser.uid, listId: this.props.match.params.list });
		this.props.socket.on('res:listItemsData', (result) => {
			console.log(result);
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
					<Grid container spacing={3}>
						{this.state.items.map((item, i) => (
							<Grid key={item.id} item xs={12}>
								<ItemCard getItems={this.getItems} item={item} inList />
							</Grid>
						))}
					</Grid>
				</Container>
				<EditList list={this.props.match.params.list} getItems={this.getItems} />
				<CreateItem list={this.props.match.params.list} getItems={this.getItems} isMobile={this.props.isMobile} />
			</div>
		);
	}
}

export default Landing;
