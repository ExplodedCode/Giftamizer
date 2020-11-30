import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Backdrop from '@material-ui/core/Backdrop';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';

import GroupIcon from '@material-ui/icons/Group';

import PersonAddIcon from '@material-ui/icons/PersonAdd';
import GroupAddIcon from '@material-ui/icons/GroupAdd';

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

const actions = [
	{ icon: <PersonAddIcon />, name: 'Join' },
	{ icon: <GroupAddIcon />, name: 'Create' },
];

export default function SpeedDialTooltipOpen() {
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
				<SpeedDialAction key={'Join'} icon={<PersonAddIcon />} tooltipTitle={'Join'} tooltipOpen onClick={handleClose} />
				<SpeedDialAction key={'Create'} icon={<GroupAddIcon />} tooltipTitle={'Create'} tooltipOpen onClick={handleClose} />
			</SpeedDial>
		</div>
	);
}
