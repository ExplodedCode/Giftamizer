import * as React from 'react';

import { CircleUser } from 'lucide-react';

import { Member } from '../lib/useSupabase/types';
import { SecretSantaExclusions } from './SecretSantaSetup';

import { MultiCombobox } from './ui/combobox';
import { FormField } from './ui/form-field';
import { UserAvatar } from './ui/avatar';

interface SecretSantaExclusionSelectorProps {
	member: Member;
	members: Member[];

	value: SecretSantaExclusions;
	onChange?: (value: SecretSantaExclusions) => void;

	disabled?: boolean;
}
export default function SecretSantaExclusionSelector({ member, members, value, onChange, disabled }: SecretSantaExclusionSelectorProps) {
	return (
		<FormField label={`${member.profile.first_name} ${member.profile.last_name}`}>
			<MultiCombobox<Member>
				options={members}
				disabled={disabled}
				value={value?.members ?? []}
				onChange={(newValue) => {
					if (onChange)
						onChange({
							user_id: member.user_id,
							members: newValue ?? [],
						});
				}}
				getOptionKey={(option) => option.user_id}
				getOptionLabel={(option) => option.profile.first_name}
				getOptionDisabled={(option) => {
					// cap exclusions at half the group size
					return !(value?.members?.some((exclusion) => exclusion.user_id === option.user_id) ?? false) && value?.members!.length >= members.length / 2;
				}}
				renderOption={(option, selected) => (
					<span className='flex items-center gap-2'>
						<span className={`flex size-4 items-center justify-center rounded-[4px] border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}>
							{selected && (
								<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' className='size-3'>
									<path d='M20 6 9 17l-5-5' />
								</svg>
							)}
						</span>
						{`${option.profile.first_name} ${option.profile.last_name}`}
					</span>
				)}
				renderChipIcon={(option) => (option.profile.image ? <UserAvatar src={option.profile.image} className='size-4' /> : <CircleUser className='size-3.5' />)}
				placeholder='No exclusions'
			/>
		</FormField>
	);
}
