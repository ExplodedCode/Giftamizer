import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@mui/styles/withStyles';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { Paper } from '@mui/material';

const styles = (theme) => ({
	root: {
		position: 'relative',
	},
	appFrame: {
		position: 'relative',
		height: '100%',
		backgroundColor: theme.palette.background.paper,
	},
});

function ColorDemo(props) {
	const { classes, data } = props;

	return (
		<div className={classes.root}>
			<Typography component='label' gutterBottom variant='h6'>
				Preview:
			</Typography>
			<Paper elevation={9}>
				<div className={classes.appFrame}>
					<Card>
						<CardActionArea>
							{data.backgroundType === 'color' ? (
								<CardMedia style={{ fontSize: '1000%', textAlign: 'center', backgroundColor: data.primary, color: data.textShade === 'dark' ? '#000000de' : '#fff' }}>
									{data.displayName.charAt(0).toUpperCase()}
								</CardMedia>
							) : (
								<CardMedia className={classes.CardMedia} style={{ height: 200 }} image={data.backgroundValue} title={data.name} />
							)}
							<CardContent>
								<Typography gutterBottom variant='h5' component='h2'>
									{data.displayName}
								</Typography>
							</CardContent>
						</CardActionArea>
					</Card>
				</div>
			</Paper>
		</div>
	);
}

ColorDemo.propTypes = {
	classes: PropTypes.object.isRequired,
	data: PropTypes.object.isRequired,
};

export default withStyles(styles)(ColorDemo);
