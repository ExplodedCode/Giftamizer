import { Autocomplete, CircularProgress, TextField } from '@mui/material';

import { useGetLists } from '../lib/useSupabase';
import { ListType } from '../lib/useSupabase/types';

type ListSelectorProps = {
	value?: ListType[];
	onChange?: (value: ListType[]) => void;
	disabled?: boolean;
};

export default function ListSelector({ value, onChange, disabled }: ListSelectorProps) {
	const { data: lists, isLoading, isError, error } = useGetLists();

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
			getOptionLabel={(option) => option.name}
			renderInput={(params) => <TextField {...params} label='Lists' />}
			disabled={disabled}
		/>
	) : (
		<CircularProgress />
	);
}
