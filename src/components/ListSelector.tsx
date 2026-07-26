import { useGetLists } from '../lib/useSupabase';
import { ListType } from '../lib/useSupabase/types';

import { MultiCombobox } from './ui/combobox';
import { FormField } from './ui/form-field';
import { Spinner } from './ui/spinner';

type ListSelectorProps = {
	value?: ListType[];
	onChange?: (value: ListType[]) => void;
	disabled?: boolean;
	/** Forwarded as the tour-element DOM attribute for the guided tour. */
	tourElement?: string;
};

export default function ListSelector({ value, onChange, disabled, tourElement }: ListSelectorProps) {
	const { data: lists } = useGetLists();

	const listTypeSelected = value?.length === 0 ? undefined : value?.[0]?.child_list ? 'child' : 'list';

	return lists ? (
		<FormField label='Lists'>
			<MultiCombobox<ListType>
				tourElement={tourElement}
				value={(value as ListType[]) ?? []}
				onChange={(v) => {
					if (onChange) onChange(v);
				}}
				options={lists}
				getOptionKey={(option) => option.id}
				getOptionLabel={(option) => option.name}
				getOptionDisabled={(option) =>
					// prevent bad assignments
					// only allow one child list to be selected
					// only allow lists if a list is selected
					listTypeSelected === undefined ? false : listTypeSelected === 'list' && option?.child_list ? true : listTypeSelected === 'child' && value?.[0].id !== option.id ? true : false
				}
				placeholder='Select lists...'
				disabled={disabled}
			/>
		</FormField>
	) : (
		<Spinner />
	);
}
