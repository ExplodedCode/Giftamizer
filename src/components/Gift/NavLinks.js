import React from 'react';
import { Link } from 'react-router-dom';

import CircularProgress from '@material-ui/core/CircularProgress';

import Avatar from '@material-ui/core/Avatar';

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListSubheader from '@material-ui/core/ListSubheader';
import Divider from '@material-ui/core/Divider';

import NewReleasesIcon from '@material-ui/icons/NewReleases';
import ListAltIcon from '@material-ui/icons/ListAlt';
import GroupIcon from '@material-ui/icons/Group';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';

import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import LockIcon from '@material-ui/icons/Lock';

import { logout } from '../../firebase/auth';
import { firebaseAuth } from '../../firebase/constants';

class navMenu extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			open: true,

			user: null,
			loading: true,
		};
	}

	componentDidMount() {
		this.props.socket.emit('req:userData', firebaseAuth().currentUser.uid);
		this.props.socket.on('res:userData', (result) => {
			console.log(result);
			if (result) {
				this.setState({
					user: result,
					loading: false,
				});
			} else {
				this.setState({
					user: { email: <span style={{ color: 'red' }}>Error loading user info!</span> },
					loading: false,
				});
			}
		});
	}

	componentWillUnmount() {
		this.props.socket.off('res:userData');
	}

	render() {
		return this.state.loading ? (
			<React.Fragment>
				<CircularProgress style={{ margin: 'auto' }} />
			</React.Fragment>
		) : (
			<React.Fragment>
				<ListItem>
					<ListItemAvatar>
						<Avatar alt='Profile' src={this.state.user ? this.state.user.photoURL : '/images/GiftamizerIcon.png'} />
					</ListItemAvatar>
					<ListItemText primary={this.state.user && this.state.user.displayName} secondary={this.state.user && this.state.user.email} />
				</ListItem>
				<Divider />
				<ListItem component={Link} to='/gift' button>
					<ListItemIcon>
						<NewReleasesIcon />
					</ListItemIcon>
					<ListItemText primary="What's New" />
				</ListItem>
				<ListItem component={Link} to='/gift/items' button>
					<ListItemIcon>
						<i className='fas fa-gift' style={{ fontSize: '1.19rem', marginLeft: 2 }} />
					</ListItemIcon>
					<ListItemText primary='Items' />
				</ListItem>
				<ListItem component={Link} to='/gift/lists' button>
					<ListItemIcon>
						<ListAltIcon />
					</ListItemIcon>
					<ListItemText primary='Lists' />
				</ListItem>
				<ListItem component={Link} to='/gift/groups' button>
					<ListItemIcon>
						<GroupIcon />
					</ListItemIcon>
					<ListItemText primary='Groups' />
				</ListItem>
				<ListItem component={Link} to='/gift/shopping' button>
					<ListItemIcon>
						<ShoppingCartIcon />
					</ListItemIcon>
					<ListItemText primary='Shopping List' />
				</ListItem>

				<Divider />
				<ListSubheader inset>Account</ListSubheader>
				<ListItem component={Link} to='/gift/me' button>
					<ListItemIcon>
						<AccountCircleIcon />
					</ListItemIcon>
					<ListItemText primary='My Account' />
				</ListItem>
				<ListItem button onClick={logout}>
					<ListItemIcon>
						<LockIcon />
					</ListItemIcon>
					<ListItemText primary='Logout' />
				</ListItem>

				{/* <ListItem component={Link} to='/tdf/support' button disabled>
						<ListItemIcon>
							<ListAltIcon />
						</ListItemIcon>
						<ListItemText primary='Events' />
					</ListItem> */}

				{/* <ListItem component={Link} to='/tribute/vendors' button>
						<ListItemIcon>
							<StoreIcon />
						</ListItemIcon>
						<ListItemText primary='Vendors' />
					</ListItem>
					<div>
						<List component='div' disablePadding>
							<ListItem component={Link} to='/tribute/vendorByDate' button style={{ paddingLeft: 30 }}>
								<ListItemIcon>
									<DateRangeIcon />
								</ListItemIcon>
								<ListItemText primary='By Date' />
							</ListItem>
						</List>
					</div> */}
			</React.Fragment>
		);
	}
}
export default navMenu;
