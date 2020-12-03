import React from 'react';
import { Link } from 'react-router-dom';

import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';

import CreateList from './Create';

import { GroupChip } from '../../../firebase/gift/misc';

import ListAltIcon from '@material-ui/icons/ListAlt';

import { firebaseAuth } from '../../../firebase/constants';

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			lists: [],
			loading: true,
		};
		props.setTitle('My Lists');
	}

	componentDidMount() {
		// this.props.socket.emit('join', 'myLists:' + firebaseAuth().currentUser.uid);
		this.getlists();
	}

	getlists = () => {
		this.props.socket.emit('req:listsData', firebaseAuth().currentUser.uid);
		this.props.socket.on('res:listsData', (result) => {
			if (result) {
				this.setState({
					lists: result,
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
		// this.props.socket.emit('leave', 'myLists:' + firebaseAuth().currentUser.uid);
		this.props.socket.off('req:listsData');
	}

	render() {
		return (
			<div>
				<Container style={{ paddingTop: 20, marginBottom: 96 }}>
					{/* <Grid container spacing={3}>
						{this.state.lists.map((lists, i) => (
							<Grid key={lists.id} item xs={12}>
								<ItemCard getlists={this.getlists} lists={lists} />
							</Grid>
						))}
					</Grid> */}

					<List>
						{this.state.lists.map((list, i) => (
							<ListItem button component={Link} to={'/gift/list/' + list._id}>
								<ListItemAvatar>
									<Avatar>{list.isForChild ? <i className='fas fa-baby-carriage' style={{ fontSize: '1.19rem', marginLeft: 2 }} /> : <ListAltIcon />}</Avatar>
								</ListItemAvatar>
								<ListItemText
									primary={list.name}
									secondary={
										<div>
											{list.groups.map((list, i) => (
												<GroupChip groupId={list} />
											))}
										</div>
									}
								/>
							</ListItem>
						))}
					</List>
					{this.state.lists.length === 0 && !this.state.loading && (
						<Typography variant='h5' gutterBottom style={{ position: 'absolute', top: 200, left: '50%', marginRight: '-50%', transform: 'translate(-50%, -50%)' }}>
							You don't have any lists.
						</Typography>
					)}
				</Container>
				<CreateList getlists={this.getlists} />
			</div>
		);
	}
}

export default Landing;
