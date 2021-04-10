import React from 'react';

import { isMobile } from 'react-device-detect';

import { Link } from 'react-router-dom';

import { withTheme } from '@material-ui/styles';
import withWidth from '@material-ui/core/withWidth';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';

import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
import orange from '@material-ui/core/colors/orange';

class Landing extends React.Component {
	constructor(props) {
		super(props);

		this.style = {
			landing: {
				paper: {
					padding: 24,
				},
				card: {
					title: {
						fontWeight: 'bold',
						marginTop: 20,
					},
				},
			},
			color: '',
		};
	}

	render() {
		const { width, theme } = this.props;
		// console.log(theme.palette.primary[theme.palette.type]);

		this.style.color = theme.palette.primary[theme.palette.type === 'dark' ? theme.palette.type : 'main'];

		return (
			<div style={{ flexGrow: 1 }}>
				<AppBar position='static' style={{ backgroundColor: this.style.color }}>
					<Toolbar>
						<Typography variant='h6' style={{ flexGrow: 1 }}>
							Giftamizer
						</Typography>
						<Button component={Link} to='/signin' color='inherit'>
							Login
						</Button>
					</Toolbar>
				</AppBar>

				<Container style={{ paddingTop: isMobile ? 20 : 80, marginBottom: 96 }}>
					<Grid container spacing={3}>
						<Grid container item sm={12} md={6} spacing={3}>
							<Grid item xs={12}>
								<Typography variant='h4'>Giftamizer</Typography>
								<Typography variant='h6'>An easier way to organize your gifts.</Typography>
								<Button component={Link} to='/signup' variant='contained' size='large' color='primary' style={{ marginTop: 48, backgroundColor: this.style.color }}>
									Get Started
								</Button>
							</Grid>
						</Grid>
						<Grid container item sm={12} md={6} spacing={3} direction='row'>
							<Grid item xs={12} sm={6}>
								<Paper style={this.style.landing.paper} elevation={9}>
									<Avatar aria-label='recipe' style={{ backgroundColor: green[500] }}>
										<i className='fas fa-gift'></i>
									</Avatar>
									<Typography variant='subtitle1' style={this.style.landing.card.title}>
										Items
									</Typography>
									<Typography variant='subtitle2'>Add anything you’d like to receive.</Typography>
								</Paper>
							</Grid>
							<Grid item xs={12} sm={6} style={{ paddingTop: width !== 'xs' ? 48 : 12 }}>
								<Paper style={this.style.landing.paper} elevation={9}>
									<Avatar aria-label='recipe' style={{ backgroundColor: red[500] }}>
										<i className='fas fa-users'></i>
									</Avatar>
									<Typography variant='subtitle1' style={this.style.landing.card.title}>
										Groups
									</Typography>
									<Typography variant='subtitle2'>Share your lists with all your friends and family.</Typography>
								</Paper>
							</Grid>
							<Grid item xs={12} sm={6} style={{ marginTop: getMarginForCards(width) }}>
								<Paper style={this.style.landing.paper} elevation={9}>
									<Avatar aria-label='recipe' style={{ backgroundColor: blue[500] }}>
										<i className='far fa-list-alt'></i>
									</Avatar>
									<Typography variant='subtitle1' style={this.style.landing.card.title}>
										Lists
									</Typography>
									<Typography variant='subtitle2'>Create collections of items to share with groups or friends.</Typography>
								</Paper>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Paper style={this.style.landing.paper} elevation={9}>
									<Avatar aria-label='recipe' style={{ backgroundColor: orange[500] }}>
										<i className='fas fa-shopping-cart'></i>
									</Avatar>
									<Typography variant='subtitle1' style={this.style.landing.card.title}>
										Shopping List
									</Typography>
									<Typography variant='subtitle2'>Giftamizer automatically creates your shopping list.</Typography>
								</Paper>
							</Grid>
						</Grid>
					</Grid>
					<Grid container item sm={12} spacing={3} justify='center' style={{ marginTop: 128 }}>
						<Grid item xs={12} sm={10} md={8}>
							<Typography variant='h4' style={{ marginBottom: 24 }} align='center'>
								Giving just got a whole lot better.
							</Typography>
							<Typography variant='body1' align='center'>
								Want to receive gifts that you know you will love? Giftamizer is the perfect answer. It’s your very own personal gift registry. Whether you’re online or in-store, you
								can add anything you’d like to receive – from your favourite bottle of wine or perfect pair of shoes to a new mountain bike or weekend away. Share with your friends or
								family and invite them to share with you!
							</Typography>
						</Grid>
						<Grid container item sm={12} spacing={3} direction='row' style={{ marginTop: 32 }}>
							<Grid item xs={12} sm={4}>
								<Paper style={this.style.landing.paper} elevation={9}>
									<Avatar aria-label='recipe' style={{ backgroundColor: green[500] }}>
										<i className='fas fa-cogs'></i>
									</Avatar>
									<Typography variant='subtitle1' style={this.style.landing.card.title}>
										Easily Add Gifts
									</Typography>
									<Typography variant='subtitle2'>
										Just copy-paste a url from Amazon or other populator retailers to automatically import the item details straight into Giftamizer.
									</Typography>
								</Paper>
							</Grid>
							<Grid item xs={12} sm={4}>
								<Paper style={this.style.landing.paper} elevation={9}>
									<Avatar aria-label='recipe' style={{ backgroundColor: blue[500] }}>
										<i className='fas fa-check'></i>
									</Avatar>
									<Typography variant='subtitle1' style={this.style.landing.card.title}>
										Planning
									</Typography>
									<Typography variant='subtitle2'>Your family and friends can mark gifts as reserved updated in real-time. No more duplicate gifts.</Typography>
								</Paper>
							</Grid>
							<Grid item xs={12} sm={4}>
								<Paper style={this.style.landing.paper} elevation={9}>
									<Avatar aria-label='recipe' style={{ backgroundColor: orange[500] }}>
										<i className='fas fa-baby-carriage'></i>
									</Avatar>
									<Typography variant='subtitle1' style={this.style.landing.card.title}>
										Do you have kids?
									</Typography>
									<Typography variant='subtitle2'>
										Giftamizer allows you to create multiple lists. No need to create multiple accounts for your children. Manage them all directly from your account.
									</Typography>
								</Paper>
							</Grid>
						</Grid>
					</Grid>
					{/* <Grid container spacing={3} justify='center' style={{ marginTop: 96 }}>
						<Grid item sm={8} spacing={3}>
							<Paper style={this.style.landing.paper} elevation={9}>
								<Typography variant='subtitle1'>This application is under development.</Typography>
								<Typography variant='subtitle2'> — Come Back Soon!</Typography>
							</Paper>
						</Grid>
					</Grid> */}
				</Container>
			</div>
		);
	}
}

export default withWidth()(withTheme(Landing));

function getMarginForCards(width) {
	switch (width) {
		case 'xs':
			return 0;
		case 'sm':
			return -35;
		case 'md':
			return -35;
		case 'lg':
			return -55;
		case 'xl':
			return -55;
		default:
			return 0;
	}
}
