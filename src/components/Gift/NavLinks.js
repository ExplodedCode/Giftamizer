import React from 'react';
import { Link } from 'react-router-dom';

import CircularProgress from '@mui/material/CircularProgress';

import Avatar from '@mui/material/Avatar';

import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';

// import NewReleasesIcon from '@mui/icons-material/NewReleases';
import ListAltIcon from '@mui/icons-material/ListAlt';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

import IconButton from '@mui/material/IconButton';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Star from '@mui/icons-material/Star';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import BuildIcon from '@mui/icons-material/Build';

import SendNotification from './SendNotification';

import { logout } from '../../firebase/auth';
import { firebaseAuth } from '../../firebase/constants';

import { admins } from '../../Routes';

class navMenu extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			open: true,

			maintenance: false,

			user: null,
			loading: true,

			groupsOpen: true,
		};
	}

	componentDidMount() {
		this.getData();
	}

	getData() {
		this.props.socket.emit('req:userData', firebaseAuth().currentUser.uid);
		this.props.socket.on('res:userData', (result) => {
			this.props.socket.off('res:userData');

			if (result) {
				this.props.socket.emit('req:maintenanceAdmin', null);
				this.props.socket.on('res:maintenanceAdmin', (doc) => {
					this.props.socket.off('res:maintenanceAdmin');

					this.setState({
						user: result,
						loading: false,

						maintenance: doc.status,
					});
				});
			} else {
				this.setState({
					user: { email: <span style={{ color: 'red' }}>Error loading user info!</span> },
					loading: false,
				});
			}
		});
	}

	toggleMaintenance(e) {
		this.props.socket.emit('set:maintenance', e.target.checked);

		this.setState({ maintenance: e.target.checked });
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
				{/* <ListItem component={Link} to='/gift' button selected={this.props.location.pathname === '/gift'}>
					<ListItemIcon>
						<NewReleasesIcon color={this.props.location.pathname === '/gift' ? 'primary' : 'inherit'} />
					</ListItemIcon>
					<ListItemText primary="What's New" />
				</ListItem> */}
				<ListItem component={Link} to='/gift/items' button selected={this.props.location.pathname === '/gift' || this.props.location.pathname.startsWith('/gift/items')}>
					<ListItemIcon>
						<i
							className='fas fa-gift'
							style={{
								fontSize: '1.19rem',
								marginLeft: 2,
								color: this.props.location.pathname === '/gift' || this.props.location.pathname.startsWith('/gift/items') ? '#4caf50' : 'inherit',
							}}
						/>
					</ListItemIcon>
					<ListItemText primary='Items' />
				</ListItem>
				<ListItem component={Link} to='/gift/lists' button selected={this.props.location.pathname.startsWith('/gift/list')}>
					<ListItemIcon>
						<ListAltIcon color={this.props.location.pathname.startsWith('/gift/list') ? 'primary' : 'inherit'} />
					</ListItemIcon>
					<ListItemText primary='Lists' />
				</ListItem>
				<ListItem
					component={Link}
					to='/gift/groups'
					button
					selected={this.props.location.pathname.startsWith('/gift/group') && !this.state.user?.starred?.includes(this.props.location.pathname.split('/')[3])}
				>
					<ListItemIcon>
						<GroupIcon
							color={this.props.location.pathname.startsWith('/gift/group') && !this.state.user?.starred?.includes(this.props.location.pathname.split('/')[3]) ? 'primary' : 'inherit'}
						/>
					</ListItemIcon>
					<ListItemText primary='Groups' />
					<IconButton
						aria-label='delete'
						onClick={(e) => {
							e.preventDefault();
							this.setState({ groupsOpen: !this.state.groupsOpen });
						}}
						style={{ padding: 6 }}
						size='large'
					>
						{this.state.user.starredGroups.length > 0 && <>{this.state.groupsOpen ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}</>}
					</IconButton>
				</ListItem>

				<Collapse in={this.state.groupsOpen} timeout='auto' unmountOnExit>
					{this.state.user.starredGroups.map((g) => (
						<List component='div' disablePadding>
							<ListItem component={Link} to={'/gift/group/' + g.id} button style={{ paddingLeft: 32 }} selected={this.props.location.pathname === '/gift/group/' + g.id}>
								<ListItemIcon>
									<Star color={this.props.location.pathname === '/gift/group/' + g.id ? 'primary' : 'inherit'} />
								</ListItemIcon>
								<ListItemText primary={g.name} />
							</ListItem>
						</List>
					))}
				</Collapse>

				<ListItem component={Link} to='/gift/shopping' button selected={this.props.location.pathname.startsWith('/gift/shopping')}>
					<ListItemIcon>
						<ShoppingCartIcon color={this.props.location.pathname.startsWith('/gift/shopping') ? 'primary' : 'inherit'} />
					</ListItemIcon>
					<ListItemText primary='Shopping List' />
				</ListItem>

				<Divider />
				<ListSubheader inset>Account</ListSubheader>
				<ListItem component={Link} to='/gift/me' button selected={this.props.location.pathname.startsWith('/gift/me')}>
					<ListItemIcon>
						<AccountCircleIcon color={this.props.location.pathname.startsWith('/gift/me') ? 'primary' : 'inherit'} />
					</ListItemIcon>
					<ListItemText primary='My Account' />
				</ListItem>
				<ListItem button onClick={logout}>
					<ListItemIcon>
						<LockIcon />
					</ListItemIcon>
					<ListItemText primary='Logout' />
				</ListItem>

				{this.state.user ? (
					!admins.includes(this.state.user.uid) ? (
						''
					) : (
						<React.Fragment>
							<Divider />
							<ListSubheader inset>System</ListSubheader>
							<ListItem>
								<ListItemIcon>
									<BuildIcon />
								</ListItemIcon>
								<FormControlLabel
									control={
										<Switch
											checked={this.state.maintenance}
											onClick={(e) => {
												this.toggleMaintenance(e);
											}}
											color='primary'
										/>
									}
									label='Maintenance'
								/>
							</ListItem>
							<SendNotification socket={this.props.socket} />
						</React.Fragment>
					)
				) : (
					''
				)}
			</React.Fragment>
		);
	}
}
export default navMenu;
