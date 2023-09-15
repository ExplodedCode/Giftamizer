import React from 'react';

import { Link } from 'react-router-dom';

import { AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardHeader, Avatar } from '@mui/material';
import { green, red, blue, orange } from '@mui/material/colors';

import Copyright from './Copyright';
import { AutoAwesome, Checklist, ChildFriendly, EscalatorWarning, Groups, ListAlt, SettingsSuggest, ShoppingCart } from '@mui/icons-material';
import { GiftIcon } from '../components/SvgIcons';

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

			<Container sx={{ paddingTop: { xs: 2.5, md: 10 }, mb: 6 }}>
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
											<GiftIcon />
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
											<Groups />
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
											<ListAlt />
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
											<ShoppingCart />
										</Avatar>
									}
									title='Shopping List'
									subheader='Giftamizer automatically creates your shopping list.'
								/>
							</Card>
						</Grid>
					</Grid>
				</Grid>
				<Grid container item sm={12} spacing={3} justifyContent='center' sx={{ mt: 16, mb: 8 }}>
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
											<AutoAwesome />
										</Avatar>
									}
									title='Easily Add Gifts'
									subheader='Just copy-paste a link to automatically import the item details straight into Giftamizer.'
								/>
							</Card>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Card>
								<CardHeader
									avatar={
										<Avatar aria-label='recipe' style={{ backgroundColor: blue[500] }}>
											<Checklist />
										</Avatar>
									}
									title='Planning'
									subheader='Your family and friends can mark gifts as reserved. No more accidental duplicate gifts.'
								/>
							</Card>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Card>
								<CardHeader
									avatar={
										<Avatar aria-label='recipe' style={{ backgroundColor: orange[500] }}>
											<EscalatorWarning />
										</Avatar>
									}
									title='Do you have kids?'
									subheader='No need to create multiple accounts for your children or pets. Manage them all directly from one account.'
								/>
							</Card>
						</Grid>
					</Grid>
				</Grid>
				<Copyright />
			</Container>
		</div>
	);
}

export default Landing;
