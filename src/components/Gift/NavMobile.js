import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import makeStyles from '@mui/styles/makeStyles';

import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

import ListAltIcon from '@mui/icons-material/ListAlt';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const useStyles = makeStyles({
	root: {
		width: '100%',
		position: 'fixed',
		bottom: 0,
	},
});

export default function SimpleBottomNavigation() {
	const history = useHistory();
	const location = useLocation();

	const classes = useStyles();
	const [value, setValue] = React.useState(getLocation(location.pathname));

	return (
		<BottomNavigation
			value={value}
			onChange={(event, newValue) => {
				setValue(newValue);
				switch (newValue) {
					case 0:
						history.push('/gift/items');
						break;
					case 1:
						history.push('/gift/lists');
						break;
					case 2:
						history.push('/gift/groups');
						break;
					case 3:
						history.push('/gift/shopping');
						break;
					case 4:
						history.push('/gift/me');
						break;

					default:
						break;
				}
			}}
			showLabels
			className={classes.root}
		>
			<BottomNavigationAction label='Items' icon={<i className='fas fa-gift' style={{ fontSize: '1.19rem' }} />} />
			<BottomNavigationAction label='Lists' icon={<ListAltIcon />} />
			<BottomNavigationAction label='Groups' icon={<GroupIcon />} />
			<BottomNavigationAction label='Shopping' icon={<ShoppingCartIcon />} />
			<BottomNavigationAction label='Account' icon={<AccountCircleIcon />} />
		</BottomNavigation>
	);
}

function getLocation(path) {
	// console.log(path);
	if (path.startsWith('/gift/item')) {
		return 0;
	} else if (path.startsWith('/gift/list')) {
		return 1;
	} else if (path.startsWith('/gift/group')) {
		return 2;
	} else if (path.startsWith('/gift/shopping')) {
		return 3;
	} else if (path.startsWith('/gift/me')) {
		return 4;
	} else {
		return -1;
	}
}
