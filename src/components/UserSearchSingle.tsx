import * as React from 'react';

import { useSupabase, FakeDelay } from '../lib/useSupabase';
import { getSignedUrls } from '../lib/useSupabase/storageUrls';
import { Profile } from '../lib/useSupabase/types';

import { Autocomplete, Avatar, CircularProgress, debounce, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Mail } from '@mui/icons-material';

type UserSearchProps = {
	selectedUser: Profile | undefined;
	setSelectedUser(inviteUser: Profile | undefined): void;
	label?: string;
	disabled?: boolean;
	required?: boolean;
};

export default function UserSearch(props: UserSearchProps) {
	const { client, user } = useSupabase();

	const [loading, setLoading] = React.useState<boolean>(false);

	const [inputValue, setInputValue] = React.useState('');
	const [options, setOptions] = React.useState<readonly Profile[]>([]);

	const fetch = React.useMemo(
		() =>
			debounce(async (request: { input: string }, callback: (results?: readonly Profile[]) => void) => {
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
			}, 400),
		[client, user.id]
	);

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
		<>
			<Autocomplete
				tour-element='group_settings_add_people'
				disabled={props.disabled}
				fullWidth
				getOptionLabel={(option) => (typeof option === 'string' ? option : `${option.first_name} ${option.last_name}`)}
				options={options}
				autoComplete
				includeInputInList
				filterSelectedOptions
				value={props.selectedUser}
				noOptionsText='Search for a user...'
				isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
				renderOption={(props, option: Profile) => {
					return (
						<li {...props}>
							<Grid container sx={{ alignItems: 'center' }}>
								<Grid>
									{option.user_id ? (
										<Avatar sizes='small' src={option.image} alt={`${option.first_name} ${option.last_name}`} sx={{ mr: 1, bgcolor: 'primary.main' }} />
									) : (
										<Avatar sizes='small' sx={{ mr: 1, bgcolor: 'primary.main' }}>
											<Mail />
										</Avatar>
									)}
								</Grid>
								<Grid size="grow">
									<Typography variant='body2'>
										{option.first_name} {option.last_name}
									</Typography>
								</Grid>
							</Grid>
						</li>
					);
				}}
				onChange={(_event, newValue) => {
					props.setSelectedUser(newValue as unknown as Profile);
				}}
				onInputChange={(_event, newInputValue) => {
					setInputValue(newInputValue);
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						label={props.label ?? 'Select User'}
						required={props.required}
						slotProps={{
							...params.slotProps,
							input: {
								...params.slotProps.input,
								endAdornment: (
									<React.Fragment>
										{loading ? <CircularProgress color='inherit' size={20} /> : null}
										{params.slotProps.input.endAdornment}
									</React.Fragment>
								),
							},
						}}
					/>
				)}
			/>
		</>
	);
}
