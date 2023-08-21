import { Autocomplete, CircularProgress, TextField } from '@mui/material';

import { useGetLists } from '../lib/useSupabase';
import { ListType } from '../lib/useSupabase/types';

type ListSelectorProps = {
	value?: ListType[];
	onChange?: (value: ListType[]) => void;
	disabled?: boolean;
};

export default function ListSelector({ value, onChange, disabled }: ListSelectorProps) {
	const { data: lists } = useGetLists();

	const listTypeSelected = value?.length == 0 ? undefined : value?.[0]?.child_list ? 'child' : 'list';

	return lists ? (
		<Autocomplete
			value={value as ListType[]}
			onChange={(event: any, value: ListType[]) => {
				if (onChange) onChange(value);
			}}
			fullWidth
			multiple
			options={lists}
			isOptionEqualToValue={(option, value) => option.id === value.id}
			getOptionDisabled={(option) =>
				// prevent bad assignments
				// only allow one child list to be selected
				// only allow lists if a list is selected
				listTypeSelected === undefined ? false : listTypeSelected === 'list' && option?.child_list ? true : listTypeSelected === 'child' && value?.[0].id !== option.id ? true : false
			}
			getOptionLabel={(option) => option.name}
			renderInput={(params) => <TextField {...params} label='Lists' />}
			disabled={disabled}
		/>
	) : (
		<CircularProgress />
	);
}
