import * as React from 'react';

import { Checkbox, Autocomplete, TextField, Avatar, Chip } from '@mui/material';
import { AccountCircle, CheckBoxOutlineBlank, CheckBox as CheckBoxIcon } from '@mui/icons-material';

import { Member } from '../lib/useSupabase/types';
import { SecretSantaExclusions } from './SecretSantaSetup';

interface SecretSantaExclusionSelectorProps {
	member: Member;
	members: Member[];

	value: SecretSantaExclusions;
	onChange?: (value: SecretSantaExclusions) => void;

	disabled?: boolean;
}
export default function SecretSantaExclusionSelector({ member, members, value, onChange, disabled }: SecretSantaExclusionSelectorProps) {
	return (
		<Autocomplete
			fullWidth
			multiple
			options={members}
			disabled={disabled}
			getOptionDisabled={(option) => {
				return !(value?.members?.some((exclusion) => exclusion.user_id === option.user_id) ?? false) && value?.members!.length >= members.length / 2;
			}}
			disableCloseOnSelect
			getOptionLabel={(option) => option.profile.first_name}
			renderOption={(props, option, { selected }) => (
				<li {...props}>
					<Checkbox icon={<CheckBoxOutlineBlank fontSize='small' />} checkedIcon={<CheckBoxIcon fontSize='small' />} style={{ marginRight: 8 }} checked={selected} />
					{`${option.profile.first_name} ${option.profile.last_name}`}
				</li>
			)}
			value={value?.members ?? []}
			onChange={(e, newValue) => {
				if (onChange)
					onChange({
						user_id: member.user_id,
						members: newValue ?? [],
					});
			}}
			renderInput={(params) => <TextField {...params} label={`${member.profile.first_name} ${member.profile.last_name}`} />}
			renderTags={(selected) => (
				<div style={{ margin: 2 }}>
					{selected.map((option) => (
						<Chip
							key={option.user_id}
							avatar={option.profile.image ? <Avatar src={option.profile.image} sx={{ width: 24, height: 24 }} /> : <AccountCircle />}
							label={`${option.profile.first_name} ${option.profile.last_name}`}
							style={{ margin: 2 }}
							onDelete={() => {
								if (onChange)
									onChange({
										user_id: member.user_id,
										members: value?.members.filter((exclusion) => exclusion.user_id !== option.user_id) ?? [],
									});
							}}
						/>
					))}
				</div>
			)}
		/>
	);
}

//
