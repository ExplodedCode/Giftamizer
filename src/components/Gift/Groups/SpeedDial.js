import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import SpeedDial from '@mui/material/SpeedDial';

import GroupIcon from '@mui/icons-material/Group';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

import CreateGroup from './Create';
import JoinGroup from './Join';

const useStyles = makeStyles((theme) => ({
	root: {
		height: 380,
		transform: 'translateZ(0px)',
		flexGrow: 1,
	},
	speedDial: {
		position: 'absolute',
		bottom: theme.spacing(2),
		right: theme.spacing(2),
	},
}));

export default function SpeedDialTooltipOpen(props) {
	const classes = useStyles();
	const [open, setOpen] = React.useState(false);

	const handleOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<div style={{ position: 'fixed', bottom: props.isMobile ? 56 : 0, right: 0 }}>
			{/* <Backdrop open={open} style={{ zIndex: 50 }} /> */}
			<SpeedDial ariaLabel='SpeedDial tooltip example' className={classes.speedDial} icon={<GroupIcon />} onClose={handleClose} onOpen={handleOpen} open={open}>
				<JoinGroup key={'Join'} icon={<PersonAddIcon />} tooltipTitle={'Join'} tooltipOpen getGroups={props.getGroups} handleSpeedDialClose={handleClose} />
				<CreateGroup key={'Create'} icon={<GroupAddIcon />} tooltipTitle={'Create'} tooltipOpen getGroups={props.getGroups} handleSpeedDialClose={handleClose} />
			</SpeedDial>
		</div>
	);
}
