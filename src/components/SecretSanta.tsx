import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import moment from 'moment';

import { Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, Grid, Grow, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Shuffle } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import { GroupType, Member, SecretSantaDrawings, SecretSantaStatus } from '../lib/useSupabase/types';
import { useGetProfile, useSupabase, useUpdateGroup } from '../lib/useSupabase';
import SecretSantaSetup from './SecretSantaSetup';

interface SecretSantaProps {
	group: GroupType;
	members: Member[];
}

export default function SecretSanta({ group, members }: SecretSantaProps) {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();

	const { enqueueSnackbar } = useSnackbar();
	const { client, user } = useSupabase();

	const { data: profile } = useGetProfile();
	const updateGroup = useUpdateGroup();

	const [myMembership, setMyMembership] = React.useState<Member | undefined>();

	// const [open, setOpen] = React.useState<boolean>(false);

	const open = location.hash === '#secret-santa';

	const [loading, setLoading] = React.useState<boolean>(false);
	const [allowCreate, setAllowCreate] = React.useState<boolean>(false);

	const [eventName, setEventName] = React.useState<string>('');
	const [eventDate, setEventDate] = React.useState<moment.Moment | null>(moment());
	const [drawing, setDrawing] = React.useState<SecretSantaDrawings>();

	const setStatus = async (status: SecretSantaStatus) => {
		setLoading(true);
		await updateGroup
			.mutateAsync({ group: { ...group, secret_santa: { ...group.secret_santa, status: status } } })
			.then(() => {
				setLoading(false);
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to update group! ${err.message}`, { variant: 'error' });
				setLoading(false);
			});
	};

	const enabledSecretSanta = async (drawings: SecretSantaDrawings) => {
		setLoading(true);
		await updateGroup
			.mutateAsync({
				group: {
					...group,
					secret_santa: {
						...group.secret_santa,
						status: SecretSantaStatus.On,
						name: eventName,
						date: eventDate?.format('LL') ?? '',
						drawing: drawings,
					},
				},
			})
			.then(async () => {
				// send notifications
				for (const drawing in drawings) {
					if (!drawing.includes('_') && drawing !== user.id) {
						const { error } = await client.functions.invoke('invite/secret-santa', {
							body: {
								group: {
									name: group.name,
									id: group.id,
								},
								user: members.find((member) => member.user_id === drawing),
								invited_by: `${profile?.first_name} ${profile?.last_name} `,
							},
						});
						if (error) console.error(error);
					}
				}

				navigate('#');
				setLoading(false);
				setAllowCreate(false);

				setEventName('');
				setEventDate(moment());
				setDrawing(undefined);
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to update group! ${err.message}`, { variant: 'error' });
				setLoading(false);
			});
	};

	React.useEffect(() => {
		const getMyMembership = async () => {
			const { data, error } = await client
				.from('group_members')
				.select(
					`user_id,
					owner,
					invite,
					profile:profiles(
							email,
							first_name,
							last_name,
							bio,
							enable_lists,
							avatar_token
						)
					)`
				)
				.eq('user_id', user.id)
				.eq('group_id', group.id)
				.single();
			if (error) {
				enqueueSnackbar(`Unable to get your membership for Secret Santa!`, { variant: 'error' });
			}

			let membership = data as unknown as Member;
			membership = {
				...membership,
				profile: {
					...membership.profile,
					// @ts-ignore
					image: membership.profile.avatar_token ? `${client.supabaseUrl}/storage/v1/object/public/avatars/${user.id}?${membership.profile.avatar_token}` : '',
				},
			};
			setMyMembership(membership);
		};

		getMyMembership();
	}, [client, enqueueSnackbar, user, group]);

	return (
		<>
			{group.my_membership[0].owner && group.secret_santa.status === SecretSantaStatus.Init && (
				<Grid container justifyContent='center'>
					<Grid item xs={12} sm={8} md={6} lg={4}>
						<Grow in timeout={700}>
							<Card
								sx={(theme) => ({
									display: 'flex',
									flexDirection: 'column',
									background: `linear-gradient(to right bottom, ${theme.palette.primary.main}, ${theme.palette.primary.main} 120%)`,
									boxShadow: '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',
									mb: 4,
								})}
							>
								<CardContent sx={{ p: 3 }}>
									<Box sx={{ my: 'auto' }}>
										<Typography gutterBottom variant='h5' component='div'>
											Draw names for your Secret Santa gift exchange!
										</Typography>

										<Stack direction='row' spacing={1} justifyContent='right' useFlexGap flexWrap='wrap'>
											<LoadingButton variant='text' color='inherit' onClick={() => setStatus(SecretSantaStatus.Off)} loading={loading}>
												No thanks
											</LoadingButton>
											<LoadingButton variant='outlined' color='inherit' onClick={() => navigate('#secret-santa')} loading={loading}>
												Draw Names
											</LoadingButton>
										</Stack>
									</Box>
								</CardContent>
							</Card>
						</Grow>
					</Grid>
				</Grid>
			)}

			{group.secret_santa.status === SecretSantaStatus.On && group.secret_santa.drawing?.[user.id] && myMembership && (
				<Grid container justifyContent='center'>
					<Grid item xs={12} sm={8} md={6} lg={4}>
						<Grow in timeout={700}>
							<Card
								sx={(theme) => ({
									display: 'flex',
									flexDirection: 'column',
									background: `linear-gradient(to right bottom, ${theme.palette.primary.main}, ${theme.palette.primary.main} 120%)`,
									boxShadow: '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',
									mb: 4,
									color: theme.palette.common.white,
								})}
							>
								<CardContent sx={{ p: 3 }}>
									<Box sx={{ my: 'auto' }}>
										<Typography variant='h5'>{group.secret_santa.name}</Typography>
										<Typography variant='caption' gutterBottom component='div'>
											{group.secret_santa.date}
										</Typography>

										<Typography variant='body1'>You're getting a gift for:</Typography>

										<Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
											{group.secret_santa.drawing?.[user.id]?.map((uid) => {
												let member = [myMembership!, ...members].find((m) => m.user_id === uid);
												let name = `${member?.profile.first_name} ${member?.profile.last_name}`.trim();

												return (
													<Chip
														avatar={<Avatar alt={name} src={member?.profile.image} />}
														label={name}
														sx={{
															bgcolor: theme.palette.common.white,
															color: theme.palette.common.black,
														}}
														onClick={() => navigate(`/groups/${group.id}/${uid}`)}
													/>
												);
											})}
										</Stack>

										{(() => {
											// Display drawing result for child lists to list owner
											let listDrawings: JSX.Element[] = [];

											for (const drawing in group.secret_santa.drawing) {
												if (drawing !== user.id && drawing.startsWith(user.id)) {
													let listMember = [myMembership!, ...members].find((m) => m.user_id === drawing);

													listDrawings.push(
														<Box sx={{ mt: 1 }}>
															<Typography variant='body1'>
																{`${listMember?.profile.first_name} ${listMember?.profile.last_name}`.trim()} is getting a gift for:
															</Typography>
															<Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
																{group.secret_santa.drawing[drawing]?.map((uid) => {
																	let member = [myMembership!, ...members].find((m) => m.user_id === uid);
																	let name = `${member?.profile.first_name} ${member?.profile.last_name}`.trim();

																	return (
																		<Chip
																			avatar={<Avatar alt={name} src={member?.profile.image} />}
																			label={name}
																			sx={{
																				bgcolor: theme.palette.common.white,
																				color: theme.palette.common.black,
																			}}
																			onClick={uid === user.id ? undefined : () => navigate(`/groups/${group.id}/${uid}`)}
																		/>
																	);
																})}
															</Stack>
														</Box>
													);
												}
											}

											return listDrawings.map((e) => <>{e}</>);
										})()}
									</Box>
								</CardContent>
							</Card>
						</Grow>
					</Grid>
				</Grid>
			)}

			<Dialog open={group.my_membership[0].owner && open} onClose={() => navigate('#')} fullWidth maxWidth='sm' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Draw names for your Secret Santa gift exchange!</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<SecretSantaSetup
								members={[myMembership!, ...members]}
								eventName={eventName}
								setEventName={setEventName}
								eventDate={eventDate}
								setEventDate={setEventDate}
								setDrawing={setDrawing}
								setAllowCreate={setAllowCreate}
							/>
						</Grid>
						<Grid item xs={12}>
							<Stack direction='row' justifyContent='flex-end' spacing={2}>
								<Button color='inherit' onClick={() => navigate('#')}>
									Cancel
								</Button>

								<LoadingButton
									tour-element='group_create'
									onClick={() => {
										if (drawing) enabledSecretSanta(drawing);
									}}
									endIcon={<Shuffle />}
									loading={updateGroup.isLoading}
									disabled={!allowCreate}
									loadingPosition='end'
									variant='contained'
								>
									Draw Names
								</LoadingButton>
							</Stack>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>
		</>
	);
}
