import React from 'react';

import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';

import { green, red, blue, orange } from '@mui/material/colors';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Copyright from './Copyright';

function Landing() {
	return (
		<div style={{ flexGrow: 1 }}>
			<AppBar position='static' color='primary' enableColorOnDark>
				<Toolbar>
					<Typography variant='h5' style={{ flexGrow: 1 }}>
						Giftamizer
					</Typography>
					<Button component={Link} to='/signin' color='inherit'>
						Sign In
					</Button>
				</Toolbar>
			</AppBar>

			<Container style={{ paddingTop: isMobile ? 20 : 80, marginBottom: 96 }}>
				<Grid container spacing={3}>
					<Grid container item sm={12} md={6} spacing={3}>
						<Grid item xs={12}>
							<Typography variant='h4'>Giftamizer</Typography>
							<Typography variant='h6'>An easier way to organize your gifts.</Typography>
							<Button component={Link} to='/signup' variant='contained' size='large' color='primary' style={{ marginTop: 48 }}>
								Get Started
							</Button>
						</Grid>
					</Grid>
					<Grid container item sm={12} md={6} spacing={3} direction='row'>
						<Grid item xs={12} sm={6}>
							<Card>
								<CardHeader
									avatar={
										<Avatar aria-label='recipe' style={{ backgroundColor: green[500] }}>
											<i className='fas fa-gift'></i>
										</Avatar>
									}
									title='Items'
									subheader={`Add anything you'd like to receive.`}
								/>
							</Card>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Card>
								<CardHeader
									avatar={
										<Avatar aria-label='recipe' style={{ backgroundColor: red[500] }}>
											<i className='fas fa-users'></i>
										</Avatar>
									}
									title='Groups'
									subheader='Share your lists with all your friends and family.'
								/>
							</Card>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Card>
								<CardHeader
									avatar={
										<Avatar aria-label='recipe' style={{ backgroundColor: blue[500] }}>
											<i className='far fa-list-alt'></i>
										</Avatar>
									}
									title='Lists'
									subheader='Create collections of items to share with groups or friends.'
								/>
							</Card>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Card>
								<CardHeader
									avatar={
										<Avatar aria-label='recipe' style={{ backgroundColor: orange[500] }}>
											<i className='fas fa-shopping-cart'></i>
										</Avatar>
									}
									title='Shopping List'
									subheader='Giftamizer automatically creates your shopping list.'
								/>
							</Card>
						</Grid>
					</Grid>
				</Grid>
				<Grid container item sm={12} spacing={3} justifyContent='center' style={{ marginTop: 128 }}>
					<Grid item xs={12} sm={10} md={8}>
						<Typography variant='h4' style={{ marginBottom: 24 }} align='center'>
							Giving just got a whole lot better.
						</Typography>
						<Typography variant='body1' align='center'>
							Want to receive gifts that you know you will love? Giftamizer is the perfect answer. It’s your very own personal gift registry. Whether you’re online or in-store, you can
							add anything you’d like to receive – from your favourite bottle of wine or perfect pair of shoes to a new mountain bike or weekend away. Share with your friends or family
							and invite them to share with you!
						</Typography>
					</Grid>
					<Grid container item sm={12} spacing={3} direction='row' style={{ marginTop: 32 }}>
						<Grid item xs={12} sm={4}>
							<Card>
								<CardHeader
									avatar={
										<Avatar aria-label='recipe' style={{ backgroundColor: green[500] }}>
											<i className='fas fa-cogs'></i>
										</Avatar>
									}
									title='Easily Add Gifts'
									subheader='Just copy-paste a url from Amazon or other populator retailers to automatically import the item details straight into Giftamizer.'
								/>
							</Card>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Card>
								<CardHeader
									avatar={
										<Avatar aria-label='recipe' style={{ backgroundColor: blue[500] }}>
											<i className='fas fa-check'></i>
										</Avatar>
									}
									title='Planning'
									subheader='Your family and friends can mark gifts as reserved updated in real-time. No more duplicate gifts.'
								/>
							</Card>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Card>
								<CardHeader
									avatar={
										<Avatar aria-label='recipe' style={{ backgroundColor: orange[500] }}>
											<i className='fas fa-baby-carriage'></i>
										</Avatar>
									}
									title='Do you have kids?'
									subheader='Giftamizer allows you to create multiple lists. No need to create multiple accounts for your children. Manage them all directly from your account..'
								/>
							</Card>
						</Grid>
					</Grid>
				</Grid>
				<br />
				<br />
				<br />
				<Copyright />
			</Container>
		</div>
	);
}

export default Landing;
