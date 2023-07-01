import * as React from 'react';

import { useSupabase, SUPABASE_URL, validateEmail } from '../lib/useSupabase';
import { Member } from '../lib/useSupabase/types';

import { Autocomplete, Avatar, Chip, CircularProgress, debounce, Grid, TextField, Typography } from '@mui/material';

export interface InviteUserType {
	email: string;
	name: string;
	user_id?: string;
}

type UserSearchProps = {
	selectedInviteUsers: InviteUserType[];
	setSelectedInviteUsers(inviteUsers: InviteUserType[]): void;
	members: Member[];
};

export default function UserSearch(props: UserSearchProps) {
	const { client, user } = useSupabase();

	const [loading, setLoading] = React.useState<boolean>(false);

	const [inputValue, setInputValue] = React.useState('');
	const [options, setOptions] = React.useState<readonly InviteUserType[]>([]);

	const fetch = React.useMemo(
		() =>
			debounce(async (request: { input: string }, callback: (results?: readonly InviteUserType[]) => void) => {
				setLoading(true);

				const search = request.input.replaceAll(' ', '+') + ':*';
				const excludeUsers = props.members.map((m) => m.user_id).concat(props.selectedInviteUsers?.filter((u) => u?.user_id).map((m) => m.user_id) as any);

				const { data, error } = await client.rpc('search_profiles', { user_search: search }).limit(8).neq('user_id', user.id).not('user_id', 'in', `(${excludeUsers.join()})`);
				if (error) console.log(error);

				callback(data as InviteUserType[]);

				setLoading(false);
			}, 400),
		[props.members, props.selectedInviteUsers, client, user.id]
	);

	React.useEffect(() => {
		let active = true;

		if (inputValue.trim().length > 0) {
			fetch({ input: inputValue }, (results?: readonly InviteUserType[]) => {
				if (active) {
					let newOptions: InviteUserType[] = [];

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
				fullWidth
				multiple
				freeSolo
				filterOptions={(options, params) => {
					const filtered = options;

					var { inputValue } = params;
					const isExisting = options.some((option) => inputValue === option.name) && options.some((option) => inputValue === option.email);

					if (
						inputValue !== '' &&
						!isExisting &&
						filtered.length === 0 &&
						validateEmail(inputValue) &&
						inputValue !== user.email &&
						!props.selectedInviteUsers?.find((u) => u.email === inputValue)
					) {
						filtered.push({
							name: inputValue,
							email: inputValue,
						});
					}
					return filtered;
				}}
				getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
				options={options}
				autoComplete
				includeInputInList
				filterSelectedOptions
				value={props.selectedInviteUsers}
				noOptionsText='Not found'
				renderOption={(props, option: InviteUserType) => {
					return (
						<li {...props}>
							<Grid container alignItems='center'>
								<Grid item>
									<Avatar sizes='small' src={`${SUPABASE_URL}/storage/v1/object/public/avatars/${option?.user_id}`} sx={{ mr: 1 }} />
								</Grid>
								<Grid item xs>
									<Typography variant='body2'>{option.name}</Typography>
								</Grid>
							</Grid>
						</li>
					);
				}}
				renderTags={(value: readonly InviteUserType[], getTagProps) =>
					value.map((option: InviteUserType, index: number) => (
						<Chip
							avatar={<Avatar alt={option.name} src={`${SUPABASE_URL}/storage/v1/object/public/avatars/${option.user_id}`} />}
							variant='outlined'
							label={option.name}
							{...getTagProps({ index })}
						/>
					))
				}
				onChange={(_event, newValue) => {
					props.setSelectedInviteUsers(newValue as InviteUserType[]);
				}}
				onInputChange={(_event, newInputValue) => {
					setInputValue(newInputValue);
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						label='Add people'
						InputProps={{
							...params.InputProps,
							endAdornment: (
								<React.Fragment>
									{loading ? <CircularProgress color='inherit' size={20} /> : null}
									{params.InputProps.endAdornment}
								</React.Fragment>
							),
						}}
					/>
				)}
			/>
		</>
	);
}
