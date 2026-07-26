import * as React from 'react';

import { useSnackbar } from '../lib/snackbar';
import { useDebouncedCallback } from 'use-debounce';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';

import { useGetProfile, useSupabase, useUpdateProfile, useUpdateTour } from '../lib/useSupabase';
import EmailEditor from '../components/EmailEditor';
import ImageCropper from '../components/ImageCropper';
import HomeSelector from '../components/HomeSelector';

import { Button } from '../components/ui/button';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { FormField } from '../components/ui/form-field';
import { Input } from '../components/ui/input';
import { PageHeader } from '../components/ui/page-header';
import { Separator } from '../components/ui/separator';
import { Spinner } from '../components/ui/spinner';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';

export interface GroupsWithoutCoOwner {
	id: string;
	name: string;
	owner_count: number;
}

function SettingRow({ label, helper, checked, onCheckedChange }: { label: React.ReactNode; helper?: React.ReactNode; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
	const id = React.useId();
	return (
		<div className='flex flex-col gap-1'>
			<div className='flex items-center gap-2.5'>
				<Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
				<label htmlFor={id} className='cursor-pointer text-sm font-medium select-none'>
					{label}
				</label>
			</div>
			{helper && <p className='text-xs text-muted-foreground'>{helper}</p>}
		</div>
	);
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

	const debouncedFlush = useDebouncedCallback(flushSave, 800);

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
			<PageHeader
				crumbs={[{ label: 'My Account' }]}
				actions={
					<>
						{saveStatus === 'saving' && (
							<span className='flex items-center gap-1.5 text-sm text-muted-foreground'>
								<Spinner size={14} />
								Saving...
							</span>
						)}
						{saveStatus === 'saved' && <span className='text-sm text-muted-foreground'>Saved</span>}
					</>
				}
			/>

			<div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-6 pb-12'>
				<div className='flex flex-col gap-4'>
					<ImageCropper value={image} onChange={setImage} aspectRatio={1} />

					<h2 className='text-lg font-semibold'>Account Settings</h2>

					<div className='grid gap-4 sm:grid-cols-2'>
						<FormField label='First Name' required>
							<Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
						</FormField>
						<FormField label='Last Name' required>
							<Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
						</FormField>
					</div>

					<FormField label='Bio' helperText={`${bio.length} / 250`}>
						<Textarea rows={3} maxLength={250} value={bio} onChange={(e) => setBio(e.target.value)} />
					</FormField>

					<HomeSelector value={home} onChange={setHome} />

					{user.app_metadata.provider === 'email' && <EmailEditor />}
				</div>

				<Separator />

				<div className='flex flex-col gap-4'>
					<h2 className='text-lg font-semibold'>Features</h2>

					<SettingRow
						label='Lists'
						helper={
							<>
								Allows you to create item lists and assign them to groups. <i>Even create seperate managed lists for your kids or pets</i>
							</>
						}
						checked={enableLists}
						onCheckedChange={(checked) => {
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

					<SettingRow
						label='Trash Can'
						helper='Recover deleted items'
						checked={enableTrash}
						onCheckedChange={(checked) => {
							setEnableTrash(checked);

							if (!checked && location.pathname.startsWith('/trash')) navigate('/');
						}}
					/>

					<SettingRow
						label='Item Archive'
						helper='Hide items from groups without deleting them.'
						checked={enableArchive}
						onCheckedChange={(checked) => {
							setEnableArchive(checked);

							if (!checked && location.pathname.startsWith('/archive')) navigate('/');
						}}
					/>

					{(new Date().getMonth() === 10 || new Date().getMonth() === 11 || new Date().getMonth() === 0) && (
						<SettingRow label='Snow Fall ❄️' helper='Only available Nov-Jan.' checked={enableSnowFall} onCheckedChange={(checked) => setEnableSnowFall(checked)} />
					)}
				</div>

				<Separator />

				<div className='flex flex-col gap-4'>
					<h2 className='text-lg font-semibold'>Email Settings</h2>

					<SettingRow
						label='Promotional'
						helper='New products and feature updates, as well as occasional company announcements and maintenance downtimes'
						checked={emailPromotional}
						onCheckedChange={(checked) => setEmailPromotional(checked)}
					/>

					<SettingRow label='Invites' helper='Get notified when someone invites you to a new group' checked={emailInvites} onCheckedChange={(checked) => setEmailInvites(checked)} />
				</div>

				<Separator />

				<div className='flex flex-col gap-3'>
					<h2 className='text-xl font-semibold'>Danger Zone</h2>

					<div className='flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4'>
						<p className='flex items-center gap-2 font-semibold text-destructive'>
							<TriangleAlert className='size-4' />
							Delete Account
						</p>

						{groupsWithoutCoOwner && groupsWithoutCoOwner.length > 0 ? (
							<>
								<p className='text-sm'>
									Your account is currently an owner of {groupsWithoutCoOwner.length > 1 ? 'these groups' : 'this group'}:{' '}
									{groupsWithoutCoOwner.map((g, i) => (
										<React.Fragment key={i}>
											<Link to={`/groups/${g.id}#group-settings`} className='text-primary underline-offset-4 hover:underline'>
												{g.name}
											</Link>
											{i !== groupsWithoutCoOwner.length - 1 && ', '}
										</React.Fragment>
									))}
								</p>
								<p className='text-sm'>You must add another owner or delete {groupsWithoutCoOwner.length > 1 ? 'these groups' : 'this group'} before you can delete your account.</p>
							</>
						) : (
							<p className='text-sm font-bold'>This action is permanent! All user data will be deleted.</p>
						)}

						<div>
							<Button
								variant='outline'
								className='border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive'
								disabled={!groupsWithoutCoOwner || groupsWithoutCoOwner.length > 0}
								onClick={() => navigate('#my-account-delete')}
							>
								Delete My Account
							</Button>
						</div>
					</div>
				</div>

				<Separator />

				<div className='flex flex-col gap-2'>
					<h2 className='text-lg font-semibold'>Support</h2>
					<p className='text-sm'>
						If you're experiencing any issues or just have a question, please{' '}
						<Link to='/support' className='text-primary underline-offset-4 hover:underline'>
							contact us
						</Link>
						.
					</p>
				</div>

				<button
					type='button'
					className='cursor-pointer self-start text-sm text-primary underline-offset-4 hover:underline'
					onClick={() => {
						updateTour.mutateAsync({
							item_create_fab: false,
							item_image: false,
							item_url: false,
							item_custom_fields: false,
							item_list_assign: false,
							item_create_btn: false,

							group_invite_nav: false,
							group_invite_button: false,

							group_nav: false,
							group_create_fab: false,
							group_create_image: false,
							group_card: false,
							group_settings: false,
							group_pin: false,
							group_member_card: false,
							group_member_item_status: false,
							group_member_item_status_taken: false,
							group_member_item_filter: false,

							group_settings_add_people: false,
							group_settings_permissions: false,
							group_settings_secret_santa: false,

							// `list_tour_start` gates the whole list leg on the Lists
							// feature being on, so it tracks the toggle rather than reset.
							list_tour_start: enableLists,
							list_nav: false,
							list_intro: false,
							list_menu: false,
							list_group_assign: false,

							shopping_nav: false,
							shopping_filter: false,
							shopping_item: false,
						});

						navigate('/');
					}}
				>
					Reset User Tour
				</button>
			</div>

			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={(next) => {
					if (!next) navigate('#');
				}}
				title='Delete Account'
				description={<b>This action is permanent! All user data will be deleted.</b>}
				confirmText='Yes Delete my Account'
				destructive
				onConfirm={() => {
					// same guard as the old dialog's disabled confirm button
					if (groupsWithoutCoOwner && groupsWithoutCoOwner.length === 0) handleDelete();
				}}
			/>
		</>
	);
}
