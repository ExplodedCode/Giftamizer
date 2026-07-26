import { ClipboardList, Users } from 'lucide-react';

import { useGetGroups, useGetLists, useGetProfile } from '../lib/useSupabase';
import { GiftIcon } from './SvgIcons';

import { Combobox } from './ui/combobox';
import { FormField } from './ui/form-field';
import { UserAvatar } from './ui/avatar';

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

	const optionIcon = (option: HomeOption) => {
		if (option.type === '') {
			switch (option.name) {
				case 'Items':
					return (
						<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'>
							<GiftIcon style={{ width: 15, height: 15 }} />
						</span>
					);
				case 'Lists':
					return (
						<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'>
							<ClipboardList className='size-4' />
						</span>
					);
				case 'Groups':
					return (
						<span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'>
							<Users className='size-4' />
						</span>
					);
			}
		}

		return <UserAvatar src={option.image} alt={option.name} fallback={option.type === 'Lists' ? <ClipboardList className='size-3.5' /> : <Users className='size-3.5' />} className='size-6 [&_[data-slot=avatar-fallback]]:bg-muted [&_[data-slot=avatar-fallback]]:text-muted-foreground' />;
	};

	return (
		<>
			{!loadingGroups && !loadingLists && (
				<FormField label='Home Page'>
					<Combobox<HomeOption>
						value={getOptions()?.find((o) => o.path === value) ?? null}
						onChange={(option) => {
							if (onChange) {
								if (option) {
									onChange(option.path);
								} else {
									onChange('/');
								}
							}
						}}
						options={getOptions()}
						getOptionKey={(option) => option.path}
						getOptionLabel={(option) => option.name}
						groupBy={(option) => option.type}
						renderOption={(option) => (
							<span className='flex min-w-0 items-center gap-2'>
								{optionIcon(option)}
								<span className='truncate'>{option.name}</span>
							</span>
						)}
						placeholder='Home Page'
						disabled={disabled}
					/>
				</FormField>
			)}
		</>
	);
}
