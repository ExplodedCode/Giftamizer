import React from 'react';
import { Link } from 'react-router-dom';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Divider from '@material-ui/core/Divider';

import ContactMailIcon from '@material-ui/icons/ContactMail';
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import StoreIcon from '@material-ui/icons/Store';
import ReceiptIcon from '@material-ui/icons/Receipt';
import TimelineIcon from '@material-ui/icons/Timeline';
import DateRangeIcon from '@material-ui/icons/DateRange';

class navMenu extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			open: true,
		};
	}

	handleClick = () => {};

	render() {
		return (
			<div>
				<div>
					<ListSubheader inset>TDF CRM</ListSubheader>
					<ListItem component={Link} to='/tdf/contact' button>
						<ListItemIcon>
							<ContactMailIcon />
						</ListItemIcon>
						<ListItemText primary='Contact' />
					</ListItem>
					<ListItem component={Link} to='/tdf/support' button>
						<ListItemIcon>
							<LiveHelpIcon />
						</ListItemIcon>
						<ListItemText primary='Support' />
					</ListItem>
				</div>
				<Divider />
				<div>
					<ListSubheader inset>Tribute</ListSubheader>
					<ListItem component={Link} to='/tribute/customers' button>
						<ListItemIcon>
							<PeopleAltIcon />
						</ListItemIcon>
						<ListItemText primary='Customers' />
					</ListItem>

					<ListItem component={Link} to='/tribute/vendors' button>
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
					</div>

					<ListItem component={Link} to='/tribute/purchases' button>
						<ListItemIcon>
							<ShoppingCartIcon />
						</ListItemIcon>
						<ListItemText primary='Purchases' />
					</ListItem>
					<ListItem component={Link} to='/tribute/invoices' button>
						<ListItemIcon>
							<ReceiptIcon />
						</ListItemIcon>
						<ListItemText primary='Invoices' />
					</ListItem>
					<ListItem component={Link} to='/tribute/kardex' button>
						<ListItemIcon>
							<TimelineIcon />
						</ListItemIcon>
						<ListItemText primary='Kardex' />
					</ListItem>
				</div>
			</div>
		);
	}
}
export default navMenu;
