import * as React from 'react';

import { useSupabase, validateEmail, FakeDelay } from '../lib/useSupabase';
import { getSignedUrls } from '../lib/useSupabase/storageUrls';
import { Member, Profile } from '../lib/useSupabase/types';

import { Autocomplete, Avatar, Chip, CircularProgress, debounce, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Mail } from '@mui/icons-material';

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

	const fetch = React.useMemo(
		() =>
			debounce(async (request: { input: string }, callback: (results?: readonly Profile[]) => void) => {
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
			}, 400),
		[props.members, props.selectedInviteUsers, client, user.id]
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
	}, [props.selectedInviteUsers, inputValue, fetch]);

	return (
		<>
			<Autocomplete
				tour-element='group_settings_add_people'
				disabled={props.disabled}
				fullWidth
				multiple
				freeSolo
				filterOptions={(options, params) => {
					const filtered = options;

					var { inputValue } = params;
					const isExisting = options.some((option) => inputValue === option.email) && options.some((option) => inputValue === option.email);

					if (
						inputValue !== '' &&
						!isExisting &&
						filtered.length === 0 &&
						validateEmail(inputValue) &&
						inputValue !== user.email &&
						!props.selectedInviteUsers?.find((u) => u.email === inputValue)
					) {
						filtered.push({
							first_name: inputValue,
							last_name: '',
							email: inputValue,
							bio: '',
							avatar_token: null,
							enable_lists: true,
						});
					}
					return filtered;
				}}
				getOptionLabel={(option) => (typeof option === 'string' ? option : `${option.first_name} ${option.last_name}`)}
				options={options}
				autoComplete
				includeInputInList
				filterSelectedOptions
				value={props.selectedInviteUsers}
				noOptionsText='Search users...'
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
				renderValue={(value: readonly (string | Profile)[], getItemProps) =>
					(value as Profile[]).map((option: Profile, index: number) => (
						<Chip
							avatar={<Avatar alt={option.first_name} src={option.image} />}
							variant='outlined'
							label={`${option.first_name} ${option.last_name}`}
							{...getItemProps({ index })}
						/>
					))
				}
				onChange={(_event, newValue) => {
					props.setSelectedInviteUsers(newValue as Profile[]);
				}}
				onInputChange={(_event, newInputValue) => {
					setInputValue(newInputValue);
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						label='Add people'
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
