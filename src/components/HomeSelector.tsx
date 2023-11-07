import { Autocomplete, Avatar, Box, TextField } from '@mui/material';
import { useGetGroups, useGetLists, useGetProfile } from '../lib/useSupabase';
import { Group, ListAlt } from '@mui/icons-material';
import { GiftIcon } from './SvgIcons';

export type HomeOption = {
	name: string;
	path: string;
	type: string;
	image?: string;
};

type HomeSelectorProps = {
	value?: string;
	onChange?: (option: string) => void;
	disabled?: boolean;
};

export default function HomeSelector({ value, onChange, disabled }: HomeSelectorProps) {
	const { data: profile } = useGetProfile();

	const { data: groups, isLoading: loadingGroups } = useGetGroups();
	const { data: lists, isLoading: loadingLists } = useGetLists();

	const getOptions = () => {
		let options: HomeOption[] = [
			{
				name: 'Items',
				path: `/`,
				type: '',
			},
		];
		if (profile?.enable_lists) {
			options.push({
				name: 'Lists',
				path: `/lists`,
				type: '',
			});
		}
		options.push({
			name: 'Groups',
			path: `/groups`,
			type: '',
		});

		if (profile?.enable_lists) {
			options = options.concat(
				...(lists?.map((list) => {
					return {
						name: list.name,
						path: `/lists/${list.id}`,
						type: 'Lists',
						image: list.image,
					};
				}) as HomeOption[])
			);
		}

		options = options.concat(
			...(groups?.map((group) => {
				return {
					name: group.name,
					path: `/groups/${group.id}`,
					type: 'Groups',
					image: group.image,
				};
			}) as HomeOption[])
		);

		return options;
	};

	return (
		<>
			{!loadingGroups && !loadingLists && (
				<Autocomplete
					value={getOptions()?.find((o) => o.path === value)}
					onChange={(event: any, value: HomeOption | null) => {
						if (onChange) {
							if (value) {
								onChange(value.path);
							} else {
								onChange('/');
							}
						}
					}}
					fullWidth
					options={getOptions()}
					// isOptionEqualToValue={(option, value) => option.path === value.path}
					groupBy={(option) => option.type}
					getOptionLabel={(option) => option.name}
					renderOption={(props, option) => (
						<Box component='li' sx={{ '& > div': { mr: 2, flexShrink: 0 } }} {...props}>
							{option.type === ''
								? (() => {
										switch (option.name) {
											case 'Items':
												return (
													<Avatar sx={{ width: 24, height: 24 }}>
														<GiftIcon sx={{ width: 18, height: 18 }} />
													</Avatar>
												);
											case 'Lists':
												return (
													<Avatar sx={{ width: 24, height: 24 }}>
														<ListAlt sx={{ width: 18, height: 18 }} />
													</Avatar>
												);
											case 'Groups':
												return (
													<Avatar sx={{ width: 24, height: 24 }}>
														<Group sx={{ width: 18, height: 18 }} />
													</Avatar>
												);
										}
								  })()
								: (() => {
										switch (option.type) {
											case 'Lists':
												return (
													<Avatar alt={option.name} src={option.image} sx={{ width: 24, height: 24 }}>
														<ListAlt sx={{ width: 18, height: 18 }} />
													</Avatar>
												);
											case 'Groups':
												return (
													<Avatar alt={option.name} src={option.image} sx={{ width: 24, height: 24 }}>
														<Group sx={{ width: 18, height: 18 }} />
													</Avatar>
												);
										}
								  })()}
							{option.name}
						</Box>
					)}
					renderInput={(params) => <TextField {...params} label='Home Page' />}
					disabled={disabled}
				/>
			)}
		</>
	);
}
