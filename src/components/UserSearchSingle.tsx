import * as React from 'react';

import { useDebouncedCallback } from 'use-debounce';
import { Mail } from 'lucide-react';

import { useSupabase, FakeDelay } from '../lib/useSupabase';
import { getSignedUrls } from '../lib/useSupabase/storageUrls';
import { Profile } from '../lib/useSupabase/types';

import { Combobox } from './ui/combobox';
import { FormField } from './ui/form-field';
import { UserAvatar } from './ui/avatar';

type UserSearchProps = {
	selectedUser: Profile | undefined;
	setSelectedUser(inviteUser: Profile | undefined): void;
	label?: string;
	disabled?: boolean;
	required?: boolean;
};

export default function UserSearchSingle(props: UserSearchProps) {
	const { client, user } = useSupabase();

	const [loading, setLoading] = React.useState<boolean>(false);

	const [inputValue, setInputValue] = React.useState('');
	const [options, setOptions] = React.useState<readonly Profile[]>([]);

	const fetch = useDebouncedCallback(async (request: { input: string }, callback: (results?: readonly Profile[]) => void) => {
		setLoading(true);

		await FakeDelay(); // fake delay

		const search = request.input.replaceAll(' ', '+') + ':*';

		const { data, error } = await client.rpc('search_profiles', { user_search: search }).limit(8).neq('user_id', user.id);
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
	}, [props.selectedUser, inputValue, fetch]);

	return (
		<FormField label={props.label ?? 'Select User'} required={props.required}>
			<Combobox<Profile>
				disabled={props.disabled}
				value={props.selectedUser ?? null}
				onChange={(newValue) => {
					props.setSelectedUser(newValue ?? undefined);
				}}
				options={options as Profile[]}
				getOptionKey={(option) => option.user_id ?? option.email}
				getOptionLabel={(option) => `${option.first_name} ${option.last_name}`.trim()}
				inputValue={inputValue}
				onInputChange={setInputValue}
				loading={loading}
				placeholder={props.label ?? 'Select User'}
				searchPlaceholder='Search for a user...'
				noOptionsText='Search for a user...'
				// Options are already server-filtered.
				filterOptions={(searchOptions) => searchOptions}
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
			/>
		</FormField>
	);
}
