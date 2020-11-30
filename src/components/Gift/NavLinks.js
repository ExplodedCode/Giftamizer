import React from 'react';
import { Link } from 'react-router-dom';

import Avatar from '@material-ui/core/Avatar';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListSubheader from '@material-ui/core/ListSubheader';
import Divider from '@material-ui/core/Divider';

import HomeIcon from '@material-ui/icons/Home';
import ListAltIcon from '@material-ui/icons/ListAlt';
import GroupIcon from '@material-ui/icons/Group';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';

import { getUserProfile } from '../../firebase/auth';

class navMenu extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			open: true,

			user: null,
			name: '',
		};
	}

	componentDidMount() {
		getUserProfile().then((result) => {
			console.log(result);
			this.setState({ user: result });
		});
	}

	render() {
		return (
			<div>
				<div>
					<ListItem>
						<ListItemAvatar>
							<Avatar alt='Profile' src={this.state.user ? this.state.user.photoURL : '/images/GiftamizerIcon.png'} />
						</ListItemAvatar>
						<ListItemText primary={this.state.user && this.state.user.displayName} secondary={this.state.user && this.state.user.email} />
					</ListItem>
					<Divider />
					<ListSubheader inset>Giftamizer</ListSubheader>
					<ListItem component={Link} to='/gift' button>
						<ListItemIcon>
							<HomeIcon />
						</ListItemIcon>
						<ListItemText primary='Dashboard' />
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
				</div>
			</div>
		);
	}
}
export default navMenu;
