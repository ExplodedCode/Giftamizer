import * as React from 'react';

import { useDebouncedCallback } from 'use-debounce';
import { Mail } from 'lucide-react';

import { useSupabase, validateEmail, FakeDelay } from '../lib/useSupabase';
import { getSignedUrls } from '../lib/useSupabase/storageUrls';
import { Member, Profile } from '../lib/useSupabase/types';

import { MultiCombobox } from './ui/combobox';
import { FormField } from './ui/form-field';
import { UserAvatar } from './ui/avatar';

type UserSearchProps = {
	selectedInviteUsers: Profile[];
	setSelectedInviteUsers(inviteUsers: Profile[]): void;
	members: Member[];
	disabled?: boolean;
};

export default function UserSearch(props: UserSearchProps) {
	const { client, user } = useSupabase();

	const [loading, setLoading] = React.useState<boolean>(false);

	const [inputValue, setInputValue] = React.useState('');
	const [options, setOptions] = React.useState<readonly Profile[]>([]);

	const fetch = useDebouncedCallback(async (request: { input: string }, callback: (results?: readonly Profile[]) => void) => {
		setLoading(true);

		await FakeDelay(); // fake delay

		const search = request.input.replaceAll(' ', '+') + ':*';
		const excludeUsers = props.members
			.filter((m) => !m.external && !m.user_id.includes('_'))
			.map((m) => m.user_id)
			.concat(props.selectedInviteUsers?.filter((u) => u?.user_id).map((m) => m.user_id) as any);

		const { data, error } = await client.rpc('search_profiles', { user_search: search }).limit(8).neq('user_id', user.id).not('user_id', 'in', `(${excludeUsers.join()})`);
		if (error) console.log(error);

		const avatarUrls = await getSignedUrls(
			client,
			'avatars',
			(data ?? []).map((p: Profile) => `${p.user_id}`)
		);
		const results = (data as Profile[])?.map((p) => ({ ...p, image: avatarUrls[`${p.user_id}`] }));

		callback(results);

		setLoading(false);
	}, 400);

	React.useEffect(() => {
		let active = true;

		if (inputValue.trim().length >= 2) {
			fetch({ input: inputValue }, (results?: readonly Profile[]) => {
				if (active) {
					let newOptions: Profile[] = [];

					if (results) {
						newOptions = [...results];
					}

					setOptions(newOptions);
				}
			});
		}

		return () => {
			active = false;
		};
	}, [props.selectedInviteUsers, inputValue, fetch]);

	return (
		<FormField label='Add people'>
			<MultiCombobox<Profile>
				tourElement='group_settings_add_people'
				disabled={props.disabled}
				value={props.selectedInviteUsers}
				onChange={(newValue) => {
					props.setSelectedInviteUsers(newValue);
				}}
				options={options as Profile[]}
				getOptionKey={(option) => option.user_id ?? option.email}
				getOptionLabel={(option) => `${option.first_name} ${option.last_name}`.trim()}
				inputValue={inputValue}
				onInputChange={setInputValue}
				loading={loading}
				placeholder='Add people'
				searchPlaceholder='Search users...'
				noOptionsText='Search users...'
				// Options are already server-filtered; this preserves the old
				// freeSolo behavior of synthesizing an invite-by-email
				// pseudo-profile when no user matches a valid email address.
				filterOptions={(searchOptions, input) => {
					const filtered = [...searchOptions];

					const isExisting = searchOptions.some((option) => input === option.email) && searchOptions.some((option) => input === option.email);

					if (input !== '' && !isExisting && filtered.length === 0 && validateEmail(input) && input !== user.email && !props.selectedInviteUsers?.find((u) => u.email === input)) {
						filtered.push({
							first_name: input,
							last_name: '',
							email: input,
							bio: '',
							avatar_token: null,
							enable_lists: true,
						} as Profile);
					}
					return filtered;
				}}
				renderOption={(option) => (
					<span className='flex min-w-0 items-center gap-2'>
						{option.user_id ? (
							<UserAvatar src={option.image} alt={`${option.first_name} ${option.last_name}`} className='size-8' />
						) : (
							<span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
								<Mail className='size-4' />
							</span>
						)}
						<span className='truncate text-sm'>
							{option.first_name} {option.last_name}
						</span>
					</span>
				)}
				renderChipIcon={(option) => (option.image ? <UserAvatar src={option.image} alt={option.first_name} className='size-4' /> : <Mail className='size-3.5' />)}
				chipVariant='outline'
			/>
		</FormField>
	);
}
