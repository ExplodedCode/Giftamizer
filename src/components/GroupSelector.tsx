import { Autocomplete, TextField } from '@mui/material';
import { GroupType } from '../lib/useSupabase/types';

type GroupSelectorProps = {
	groups: Omit<GroupType, 'image_token' | 'my_membership'>[];
	value?: Omit<GroupType, 'image_token' | 'my_membership'>[];
	onChange?: (value: Omit<GroupType, 'image_token' | 'my_membership'>[]) => void;
	disabled?: boolean;
};

export default function GroupSelector({ groups, value, onChange, disabled }: GroupSelectorProps) {
	return (
		<Autocomplete
			tour-element='list_group_assign'
			value={value as Omit<GroupType, 'image_token' | 'my_membership'>[]}
			onChange={(event: any, value: Omit<GroupType, 'image_token' | 'my_membership'>[]) => {
				if (onChange) onChange(value);
			}}
			fullWidth
			multiple
			options={groups}
			isOptionEqualToValue={(option, value) => option.id === value.id}
			getOptionLabel={(option) => option.name}
			renderInput={(params) => <TextField {...params} label='Groups' />}
			disabled={disabled}
		/>
	);
}
