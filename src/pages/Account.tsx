import * as React from 'react';

import { useSnackbar } from 'notistack';

import {
	Alert,
	AlertTitle,
	AppBar,
	Breadcrumbs,
	Button,
	Container,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Link as MUILink,
	Stack,
	TextField,
	Toolbar,
	Typography,
	CircularProgress,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	Switch,
	debounce,
} from '@mui/material';
import Grid from '@mui/material/Grid';

import { useGetProfile, useSupabase, useUpdateProfile, useUpdateTour } from '../lib/useSupabase';
import EmailEditor from '../components/EmailEditor';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ImageCropper from '../components/ImageCropper';
import HomeSelector from '../components/HomeSelector';

export interface GroupsWithoutCoOwner {
	id: string;
	name: string;
	owner_count: number;
}

export default function Account() {
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const { client, user } = useSupabase();
	const { data: profile } = useGetProfile();

	const [firstName, setFirstName] = React.useState('');
	const [lastName, setLastName] = React.useState('');
	const [image, setImage] = React.useState<string | undefined>();
	const [bio, setBio] = React.useState('');
	const [home, setHome] = React.useState('/');

	const [enableLists, setEnableLists] = React.useState(false);
	const [enableArchive, setEnableArchive] = React.useState(false);
	const [enableTrash, setEnableTrash] = React.useState(false);

	const [enableSnowFall, setEnableSnowFall] = React.useState(false);

	const [emailPromotional, setEmailPromotional] = React.useState(false);
	const [emailInvites, setEmailInvites] = React.useState(false);

	const [groupsWithoutCoOwner, setGroupsWithoutCoOwner] = React.useState<GroupsWithoutCoOwner[] | undefined>();

	const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

	const deleteOpen = location.hash === '#my-account-delete';

	//
	// User tour
	const updateTour = useUpdateTour();

	// Skip the autosave effects that fire when the profile first loads (and populates the fields below)
	const skipTextSaveRef = React.useRef(true);
	const skipImmediateSaveRef = React.useRef(true);

	// Hydrate the form from the profile exactly once. Once loaded, local state is the source of
	// truth: re-syncing on every profile change would clobber an in-flight edit whenever this
	// component's own save round-trips (the cache updates with a response that predates a second,
	// still-pending edit), silently reverting it.
	const profileLoadedRef = React.useRef(false);

	React.useEffect(() => {
		const loadProfile = async () => {
			if (profile && !profileLoadedRef.current) {
				profileLoadedRef.current = true;

				setFirstName(profile.first_name);
				setLastName(profile.last_name);
				setImage(profile.image);
				setBio(profile.bio);
				setHome(profile.home);

				setEnableLists(profile.enable_lists);
				setEnableArchive(profile.enable_archive);
				setEnableTrash(profile.enable_trash);

				setEnableSnowFall(profile.enable_snowfall);

				setEmailPromotional(profile.email_promotional);
				setEmailInvites(profile.email_invites);
			}

			const { data, error } = await client.rpc('get_groups_without_coowner', { owner_id: user.id });

			if (error) {
				console.log(error);

				enqueueSnackbar('Unable to query groups you own!', {
					variant: 'error',
				});
			} else {
				setGroupsWithoutCoOwner(data! as GroupsWithoutCoOwner[]);
			}
		};

		loadProfile();
	}, [client, enqueueSnackbar, user, profile]);

	const updateProfile = useUpdateProfile();

	// The update mutation always PATCHes the full profile row, so firing it concurrently (e.g.
	// two switches toggled back-to-back) races - whichever response lands last wins the cache,
	// even if it was sent first with now-stale field values. Serialize saves through this ref so
	// only one mutation is ever in flight; anything requested meanwhile is replayed afterwards
	// using the latest state (never a stale snapshot).
	const buildProfileUpdate = (): Parameters<typeof updateProfile.mutateAsync>[0] => ({
		first_name: firstName.trim(),
		last_name: lastName.trim(),
		image: image,
		bio: bio.trim(),
		home: home,
		enable_lists: enableLists,
		enable_archive: enableArchive,
		enable_trash: enableTrash,
		enable_snowfall: enableSnowFall,
		email_promotional: emailPromotional,
		email_invites: emailInvites,
		avatar_token: profile?.avatar_token!,
	});
	const buildProfileUpdateRef = React.useRef(buildProfileUpdate);
	buildProfileUpdateRef.current = buildProfileUpdate;

	const savingRef = React.useRef(false);
	const pendingRef = React.useRef(false);

	const flushSave = React.useCallback(() => {
		if (savingRef.current) {
			pendingRef.current = true;
			return;
		}

		const update = buildProfileUpdateRef.current();
		if (update.first_name.length === 0 || update.last_name.length === 0) return;

		savingRef.current = true;
		setSaveStatus('saving');

		updateProfile
			.mutateAsync(update)
			.then(() => setSaveStatus('saved'))
			.catch((error) => {
				setSaveStatus('error');
				enqueueSnackbar(`Unable to update your profile. ${error}`, {
					variant: 'error',
				});
			})
			.finally(() => {
				savingRef.current = false;

				if (pendingRef.current) {
					pendingRef.current = false;
					flushSave();
				}
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [updateProfile.mutateAsync, enqueueSnackbar]);

	const debouncedFlush = React.useMemo(() => debounce(flushSave, 800), [flushSave]);

	// Text fields debounce while the user is typing
	React.useEffect(() => {
		if (skipTextSaveRef.current) {
			skipTextSaveRef.current = false;
			return;
		}

		debouncedFlush();
	}, [firstName, lastName, bio, debouncedFlush]);

	// Switches, the home dropdown, and the avatar image commit immediately
	React.useEffect(() => {
		if (skipImmediateSaveRef.current) {
			skipImmediateSaveRef.current = false;
			return;
		}

		flushSave();
	}, [image, home, enableLists, enableArchive, enableTrash, enableSnowFall, emailPromotional, emailInvites, flushSave]);

	const handleDelete = async () => {
		const { data, error } = await client.functions.invoke('delete', {
			body: {
				user_id: user.id,
			},
		});

		if (error) {
			console.log(error);
			enqueueSnackbar(`Unable to delete your account. ${error}`, {
				variant: 'error',
			});
		}

		if (data === 'ok') {
			client.auth.signOut();
			navigate('/');
			enqueueSnackbar(`Your Giftamizer account and users data has been deleted.`, {
				variant: 'success',
			});
		}
	};

	return (
		<>
			<AppBar position='static' sx={{ marginBottom: 2 }} color='default'>
				<Toolbar variant='dense'>
					<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
						<Typography color='text.primary'>My Account</Typography>
					</Breadcrumbs>

					{saveStatus === 'saving' && (
						<Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
							<CircularProgress size={16} />
							<Typography variant='body2' color='text.secondary'>
								Saving...
							</Typography>
						</Stack>
					)}
					{saveStatus === 'saved' && (
						<Typography variant='body2' color='text.secondary'>
							Saved
						</Typography>
					)}
				</Toolbar>
			</AppBar>

			<Container maxWidth='md' sx={{ pb: 12 }}>
				<Grid container spacing={2}>
					<Grid size={12}>
						<ImageCropper value={image} onChange={setImage} aspectRatio={1} />
						<Typography variant='h6' gutterBottom>
							Account Settings
						</Typography>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField fullWidth label='First Name' variant='outlined' value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField fullWidth label='Last Name' variant='outlined' value={lastName} onChange={(e) => setLastName(e.target.value)} required />
							</Grid>
						</Grid>
					</Grid>
					<Grid size={12}>
						<TextField
							fullWidth
							multiline
							minRows={3}
							maxRows={7}
							label='Bio'
							variant='outlined'
							slotProps={{ htmlInput: { maxLength: 250 } }}
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							helperText={`${bio.length} / 250`}
						/>
					</Grid>

					<Grid size={12}>
						<HomeSelector value={home} onChange={setHome} />
					</Grid>

					{user.app_metadata.provider === 'email' && (
						<Grid size={12}>
							<EmailEditor />
						</Grid>
					)}

					<Grid size={12}>
						<Divider />
					</Grid>

					<Grid size={12}>
						<Typography variant='h6' gutterBottom>
							Features
						</Typography>
						<FormControl component='fieldset' variant='standard'>
							<FormGroup>
								<FormControlLabel
									control={
										<Switch
											checked={enableLists}
											onChange={(e) => {
												const checked = e.target.checked;
												setEnableLists(checked);

												if (checked) {
													updateTour.mutateAsync({
														list_tour_start: true,
													});
												} else if (location.pathname.startsWith('/lists')) {
													navigate('/');
												}
											}}
										/>
									}
									label='Lists'
								/>
								<FormHelperText>
									Allows you to create item lists and assign them to groups. <i>Even create seperate managed lists for your kids or pets</i>
								</FormHelperText>
							</FormGroup>
						</FormControl>
					</Grid>
					<Grid size={12}>
						<FormControl component='fieldset' variant='standard'>
							<FormGroup>
								<FormControlLabel
									control={
										<Switch
											checked={enableTrash}
											onChange={(e) => {
												const checked = e.target.checked;
												setEnableTrash(checked);

												if (!checked && location.pathname.startsWith('/trash')) navigate('/');
											}}
										/>
									}
									label='Trash Can'
								/>
								<FormHelperText>Recover deleted items</FormHelperText>
							</FormGroup>
						</FormControl>
					</Grid>
					<Grid size={12}>
						<FormControl component='fieldset' variant='standard'>
							<FormGroup>
								<FormControlLabel
									control={
										<Switch
											checked={enableArchive}
											onChange={(e) => {
												const checked = e.target.checked;
												setEnableArchive(checked);

												if (!checked && location.pathname.startsWith('/archive')) navigate('/');
											}}
										/>
									}
									label='Item Archive'
								/>
								<FormHelperText>Hide items from groups without deleting them.</FormHelperText>
							</FormGroup>
						</FormControl>
					</Grid>

					{(new Date().getMonth() === 10 || new Date().getMonth() === 11 || new Date().getMonth() === 0) && (
						<Grid size={12}>
							<FormControl component='fieldset' variant='standard'>
								<FormGroup>
									<FormControlLabel control={<Switch checked={enableSnowFall} onChange={(e) => setEnableSnowFall(e.target.checked)} />} label='Snow Fall ❄️' />
									<FormHelperText>Only available Nov-Jan.</FormHelperText>
								</FormGroup>
							</FormControl>
						</Grid>
					)}

					<Grid size={12}>
						<Divider />
					</Grid>

					<Grid size={12}>
						<Typography variant='h6' gutterBottom>
							Email Settings
						</Typography>
						<FormControl component='fieldset' variant='standard'>
							<FormGroup>
								<FormControlLabel control={<Switch checked={emailPromotional} onChange={(e) => setEmailPromotional(e.target.checked)} />} label='Promotional' />
								<FormHelperText>New products and feature updates, as well as occasional company announcements and maintenance downtimes</FormHelperText>
							</FormGroup>
						</FormControl>
					</Grid>
					<Grid size={12}>
						<FormControl component='fieldset' variant='standard'>
							<FormGroup>
								<FormControlLabel control={<Switch checked={emailInvites} onChange={(e) => setEmailInvites(e.target.checked)} />} label='Invites' />
								<FormHelperText>Get notified when someone invites you to a new group</FormHelperText>
							</FormGroup>
						</FormControl>
					</Grid>

					<Grid size={12}>
						<Divider />
					</Grid>

					<Grid size={12}>
						<Typography variant='h5' gutterBottom>
							Danger Zone
						</Typography>
						<Alert severity='error'>
							<AlertTitle>Delete Account</AlertTitle>

							<Grid container spacing={2}>
								{groupsWithoutCoOwner && groupsWithoutCoOwner.length > 0 ? (
									<>
										<Grid size={12}>
											<Typography variant='body1'>
												Your account is currently an owner of {groupsWithoutCoOwner.length > 1 ? 'these groups' : 'this group'}:{' '}
												{groupsWithoutCoOwner.map((g, i) => (
													<React.Fragment key={i}>
														<MUILink component={Link} to={`/groups/${g.id}#group-settings`}>
															{g.name}
														</MUILink>
														{i !== groupsWithoutCoOwner.length - 1 && ', '}
													</React.Fragment>
												))}
											</Typography>
										</Grid>
										<Grid size={12}>
											<Typography variant='body1'>
												You must add another owner or delete {groupsWithoutCoOwner.length > 1 ? 'these groups' : 'this group'} before you can delete your account.
											</Typography>
										</Grid>
									</>
								) : (
									<Grid size={12}>
										<Typography variant='body1'>
											<b>This action is permanent! All user data will be deleted.</b>
										</Typography>
									</Grid>
								)}
								<Grid size={12}>
									<Button variant='outlined' color='error' disabled={!groupsWithoutCoOwner || groupsWithoutCoOwner.length > 0} onClick={() => navigate('#my-account-delete')}>
										Delete My Account
									</Button>
								</Grid>
							</Grid>
						</Alert>
					</Grid>

					<Grid size={12}>
						<Divider />
					</Grid>

					<Grid size={12}>
						<Typography variant='h6' gutterBottom>
							Support
						</Typography>
						<Typography variant='body1'>
							If you're experiencing any issues or just have a question, please <Link to='/support'>contact us</Link>.
						</Typography>
					</Grid>

					<Grid size={12}>
						<MUILink
							sx={{
								cursor: 'pointer',
							}}
							onClick={() => {
								updateTour.mutateAsync({
									item_create_fab: false,
									item_name: false,
									item_url: false,
									item_more_links: false,
									item_custom_fields: false,
									item_image: false,
									item_create_btn: false,

									group_invite_nav: false,
									group_invite_button: false,

									group_nav: false,
									group_create_fab: false,
									group_create_name: false,
									group_create_image: false,
									group_create: false,
									group_card: false,
									group_settings: false,
									group_pin: false,
									group_member_card: false,
									group_member_item_status: false,
									group_member_item_status_taken: false,
									group_member_item_filter: false,

									group_settings_add_people: false,
									group_settings_permissions: false,

									list_tour_start: false,
									list_nav: false,
									list_intro: false,
									list_menu: false,
									list_edit: false,
									list_group_assign: false,

									shopping_nav: false,
									shopping_filter: false,
									shopping_item: false,
								});

								navigate('/');
							}}
						>
							Reset User Tour
						</MUILink>
					</Grid>
				</Grid>
			</Container>

			<Dialog open={deleteOpen} onClose={() => navigate('#')}>
				<DialogTitle>Delete Account</DialogTitle>
				<DialogContent>
					<Typography variant='body1'>
						<b>This action is permanent! All user data will be deleted.</b>
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={() => navigate('#')}>
						Cancel
					</Button>
					<Button color='error' variant='contained' onClick={handleDelete} disabled={!groupsWithoutCoOwner || groupsWithoutCoOwner.length > 0}>
						Yes Delete my Account
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
