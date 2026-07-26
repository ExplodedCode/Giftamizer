import { GroupType } from '../lib/useSupabase/types';

import { MultiCombobox } from './ui/combobox';
import { FormField } from './ui/form-field';

type GroupSelectorProps = {
	groups: Omit<GroupType, 'image_token' | 'my_membership'>[];
	value?: Omit<GroupType, 'image_token' | 'my_membership'>[];
	onChange?: (value: Omit<GroupType, 'image_token' | 'my_membership'>[]) => void;
	disabled?: boolean;
};

export default function GroupSelector({ groups, value, onChange, disabled }: GroupSelectorProps) {
	return (
		<FormField label='Groups'>
			<MultiCombobox<Omit<GroupType, 'image_token' | 'my_membership'>>
				tourElement='list_group_assign'
				value={(value as Omit<GroupType, 'image_token' | 'my_membership'>[]) ?? []}
				onChange={(v) => {
					if (onChange) onChange(v);
				}}
				options={groups ?? []}
				getOptionKey={(option) => option.id}
				getOptionLabel={(option) => option.name}
				placeholder='Select groups...'
				disabled={disabled}
			/>
		</FormField>
	);
}
