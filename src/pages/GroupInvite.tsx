import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { FakeDelay, SUPABASE_URL, useSupabase } from '../lib/useSupabase';

import { Grid, CssBaseline, Paper, Box, Avatar, Typography, Button, Backdrop, CircularProgress, CardMedia, AvatarGroup, Tooltip, Link as MUILink, Stack } from '@mui/material';

type GroupInvite = {
	name: string;
	image_token: number | null;
	image?: string;
	members: Users[];
};

type Users = {
	user_id: string;
	first_name: string;
	avatar_token: number | null;
	image?: string;
};

var randomImage = Math.floor(Math.random() * 10) + 1;
export default function SignIn() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { client, user } = useSupabase();

	const { group: groupID } = useParams();

	const [invite, setInvite] = React.useState<GroupInvite>();

	React.useEffect(() => {
		const getGroup = async () => {
			await FakeDelay();

			const { data, error } = await client.rpc('get_link_invite', { _group_id: groupID }).single();
			if (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
				navigate('/');
			} else {
				if ((data as GroupInvite)?.name?.length > 0) {
					setInvite({
						...(data as GroupInvite),
						image: (data as GroupInvite).image_token ? `${SUPABASE_URL}/storage/v1/object/public/groups/${groupID}?${(data as GroupInvite).image_token}` : undefined,

						members: (data as GroupInvite).members.map((member) => {
							return {
								...member,
								image: member.avatar_token ? `${SUPABASE_URL}/storage/v1/object/public/avatars/${member.user_id}?${member.avatar_token}` : undefined,
							};
						}),
					});
				}
			}
		};

		getGroup();
	}, [client, groupID, enqueueSnackbar, navigate]);

	const acceptInvite = async () => {
		if (user?.id) {
			const { error } = await client.rpc('accept_link_invite', { _group_id: groupID, _user_id: user.id }).single();
			if (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} else {
				navigate('/groups/' + groupID);
			}
		} else {
			enqueueSnackbar('Not logged in!', { variant: 'error' });
		}
	};

	return (
		<>
			{!invite ? (
				<Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={true}>
					<CircularProgress color='inherit' />
				</Backdrop>
			) : (
				<>
					<Grid container component='main' sx={{ height: '100vh' }}>
						<CssBaseline />
						<Grid
							item
							xs={false}
							sm={4}
							md={7}
							sx={{
								backgroundImage: 'url(/images/signin/' + randomImage + '.jpg)',
								backgroundRepeat: 'no-repeat',
								backgroundColor: (t) => (t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900]),
								backgroundSize: 'cover',
								backgroundPosition: 'center',
							}}
						/>
						<Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
							<Box
								sx={{
									my: 8,
									mx: 4,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
								}}
							>
								<CardMedia
									sx={{
										height: 150,
										width: 150,
										fontSize: 96,
										lineHeight: 1.7,
										textAlign: 'center',
										backgroundColor: '#5cb660',
										color: '#fff',
										borderRadius: '25%',
									}}
									image={invite.image}
								>
									{invite.image_token ? '' : Array.from(String(invite.name).toUpperCase())[0]}
								</CardMedia>

								<Typography variant='body1' color='GrayText' sx={{ mt: 1 }}>
									You've been invited to join
								</Typography>

								<Typography variant='h5'>{invite.name}</Typography>

								<Box sx={{ mt: 1, maxWidth: 500 }}>
									<AvatarGroup max={4}>
										{invite.members.map((member) => (
											<Tooltip key={member.user_id} title={member.first_name} arrow>
												<Avatar alt={member.first_name} src={member.image} sx={{ backgroundColor: 'primary.main' }}>
													{Array.from(String(member.first_name).toUpperCase())[0]}
												</Avatar>
											</Tooltip>
										))}
									</AvatarGroup>
								</Box>

								<Stack spacing={2} direction='column' sx={{ width: '100%', mt: 4 }}>
									<Button
										variant='contained'
										fullWidth
										disabled={!user || invite.members.find((u) => u.user_id === user?.id) !== undefined}
										onClick={() => {
											acceptInvite();
										}}
									>
										{invite.members.find((u) => u.user_id === user?.id) !== undefined ? 'Already Joined' : 'Accept Invite'}
									</Button>

									{!user && (
										<Button variant='outlined' fullWidth onClick={() => navigate(`/signin?redirectTo=${window.location.pathname}`)}>
											Login or Create Account
										</Button>
									)}
								</Stack>

								{user && invite.members.find((u) => u.user_id === user?.id) !== undefined && (
									<MUILink component={Link} to={`/groups/${groupID}`} variant='body2' sx={{ mt: 2 }}>
										Open Group
									</MUILink>
								)}
							</Box>
						</Grid>
					</Grid>
				</>
			)}
		</>
	);
}
