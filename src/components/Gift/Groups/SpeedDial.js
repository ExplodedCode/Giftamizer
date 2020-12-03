import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Backdrop from '@material-ui/core/Backdrop';
import SpeedDial from '@material-ui/lab/SpeedDial';

import GroupIcon from '@material-ui/icons/Group';

import PersonAddIcon from '@material-ui/icons/PersonAdd';
import GroupAddIcon from '@material-ui/icons/GroupAdd';

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
		<div style={{ position: 'fixed', bottom: 8, right: 8 }}>
			<Backdrop open={open} style={{ zIndex: 50 }} />
			<SpeedDial ariaLabel='SpeedDial tooltip example' className={classes.speedDial} icon={<GroupIcon />} onClose={handleClose} onOpen={handleOpen} open={open}>
				<JoinGroup key={'Join'} icon={<PersonAddIcon />} tooltipTitle={'Join'} tooltipOpen getGroups={props.getGroups} handleSpeedDialClose={handleClose} />
				<CreateGroup key={'Create'} icon={<GroupAddIcon />} tooltipTitle={'Create'} tooltipOpen getGroups={props.getGroups} handleSpeedDialClose={handleClose} />
			</SpeedDial>
		</div>
	);
}
