import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { DrawerProps, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, ListItemButton, Divider } from '@mui/material';
import { People, List as ListIcon, Dashboard, Groups, ListAlt } from '@mui/icons-material';
import { GiftIcon } from './SvgIcons';

const item = {
	py: '2px',
	px: 3,
	color: 'rgba(255, 255, 255, 0.7)',
	'&:hover, &:focus': {
		bgcolor: 'rgba(255, 255, 255, 0.08)',
	},
};

const itemCategory = {
	boxShadow: '0 -1px 0 rgb(255,255,255,0.1) inset',
	py: 1.5,
	px: 3,
};

export default function Navigator(props: DrawerProps) {
	const { ...other } = props;
	const location = useLocation();

	const closeMenu = (e: any) => {
		if (props.onClose) props.onClose(e, 'backdropClick');
	};

	return (
		<Drawer variant='permanent' {...other}>
			<List disablePadding>
				<ListItem sx={{ py: 1.5, px: 3, fontSize: 22, color: '#fff' }}>Giftamizer</ListItem>
				<ListItemButton sx={{ ...item, ...itemCategory }} component={Link} to='/' selected={location.pathname === '/'} onClick={closeMenu}>
					<ListItemIcon>
						<Dashboard />
					</ListItemIcon>
					<ListItemText>Dashboard</ListItemText>
				</ListItemButton>
				<Box sx={{ bgcolor: '#1d242d' }}>
					<ListItem sx={{ py: 2, px: 3 }}>
						<ListItemText sx={{ color: '#fff' }}>Manage</ListItemText>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton sx={item} component={Link} to='/users' selected={location.pathname.startsWith('/users')} onClick={closeMenu}>
							<ListItemIcon>
								<People />
							</ListItemIcon>
							<ListItemText>Users</ListItemText>
						</ListItemButton>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton sx={item} component={Link} to='/items' selected={location.pathname.startsWith('/items')} onClick={closeMenu}>
							<ListItemIcon>
								<GiftIcon />
							</ListItemIcon>
							<ListItemText>Items</ListItemText>
						</ListItemButton>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton sx={item} component={Link} to='/lists' selected={location.pathname.startsWith('/lists')} onClick={closeMenu}>
							<ListItemIcon>
								<ListAlt />
							</ListItemIcon>
							<ListItemText>Lists</ListItemText>
						</ListItemButton>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton sx={item} component={Link} to='/groups' selected={location.pathname.startsWith('/groups')} onClick={closeMenu}>
							<ListItemIcon>
								<Groups />
							</ListItemIcon>
							<ListItemText>Groups</ListItemText>
						</ListItemButton>
					</ListItem>
					<Divider sx={{ mt: 2 }} />
				</Box>
			</List>
		</Drawer>
	);
}
