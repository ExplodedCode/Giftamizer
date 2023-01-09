import * as React from 'react';

import NotificationsIcon from '@mui/icons-material/Notifications';
import ImageIcon from '@mui/icons-material/Image';
import GroupIcon from '@mui/icons-material/Group';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

import { IconButton, Badge, Popover, List, ListItemButton, ListItemAvatar, Avatar, ListItemText } from '@mui/material';

export default function Notifications() {
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
	const [open, setOpen] = React.useState(false);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
		setOpen(!open);
	};

	return (
		<>
			<IconButton size='large' aria-label='show 17 new notifications' color='inherit' onClick={handleClick}>
				<Badge badgeContent={17} color='error'>
					<NotificationsIcon />
				</Badge>
			</IconButton>

			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={() => {
					setAnchorEl(null);
					setOpen(!open);
				}}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<List sx={{ bgcolor: 'background.paper', width: { xs: '90vw', sm: 450 }, maxHeight: '40vh' }}>
					<ListItemButton>
						<ListItemAvatar>
							<Avatar>
								<ImageIcon />
							</Avatar>
						</ListItemAvatar>
						<ListItemText primary='Photos' secondary='Jan 9, 2014' />
					</ListItemButton>
					<ListItemButton>
						<ListItemAvatar>
							<Avatar>
								<GroupIcon />
							</Avatar>
						</ListItemAvatar>
						<ListItemText primary='Work' secondary='Jan 7, 2014' />
					</ListItemButton>
					<ListItemButton>
						<ListItemAvatar>
							<Avatar>
								<BeachAccessIcon />
							</Avatar>
						</ListItemAvatar>
						<ListItemText primary='Vacation' secondary='July 20, 2014' />
					</ListItemButton>
				</List>
			</Popover>
		</>
	);
}
