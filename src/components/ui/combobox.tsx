import * as React from 'react';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Chip } from './chip';
import { Spinner } from './spinner';

/**
 * Replaces the app's MUI Autocomplete variants. Business rules port as props:
 * - getOptionDisabled → ListSelector child-list exclusivity, SecretSanta
 *   exclusion cap
 * - filterOptions + onInputChange → UserSearch debounced RPC search and
 *   invite-by-raw-email pseudo-profile synthesis
 * - groupBy → HomeSelector sections
 */
type ComboboxBaseProps<T> = {
	options: T[];
	getOptionKey: (option: T) => string;
	getOptionLabel: (option: T) => string;
	getOptionDisabled?: (option: T) => boolean;
	renderOption?: (option: T, selected: boolean) => React.ReactNode;
	groupBy?: (option: T) => string;
	/** Custom filter; defaults to case-insensitive label match. Receives the raw input text. */
	filterOptions?: (options: T[], inputValue: string) => T[];
	/** Controlled search input (for async search fields). */
	inputValue?: string;
	onInputChange?: (value: string) => void;
	loading?: boolean;
	placeholder?: string;
	searchPlaceholder?: string;
	noOptionsText?: React.ReactNode;
	disabled?: boolean;
	className?: string;
	id?: string;
	/** Forwarded as the tour-element DOM attribute for the guided tour. */
	tourElement?: string;
};

function defaultFilter<T>(options: T[], input: string, getLabel: (o: T) => string): T[] {
	if (!input.trim()) return options;
	const query = input.trim().toLowerCase();
	return options.filter((o) => getLabel(o).toLowerCase().includes(query));
}

type ComboboxListProps<T> = ComboboxBaseProps<T> & {
	isSelected: (option: T) => boolean;
	onSelectOption: (option: T) => void;
};

function ComboboxList<T>(props: ComboboxListProps<T>) {
	const { options, getOptionKey, getOptionLabel, getOptionDisabled, renderOption, groupBy, filterOptions, inputValue, onInputChange, loading, searchPlaceholder, noOptionsText, isSelected, onSelectOption } = props;

	const [internalInput, setInternalInput] = React.useState('');
	const input = inputValue ?? internalInput;
	const setInput = (value: string) => {
		setInternalInput(value);
		onInputChange?.(value);
	};

	const filtered = filterOptions ? filterOptions(options, input) : defaultFilter(options, input, getOptionLabel);

	const grouped = React.useMemo(() => {
		if (!groupBy) return null;
		const map = new Map<string, T[]>();
		for (const option of filtered) {
			const group = groupBy(option);
			if (!map.has(group)) map.set(group, []);
			map.get(group)!.push(option);
		}
		return map;
	}, [filtered, groupBy]);

	const renderItem = (option: T) => {
		const selected = isSelected(option);
		return (
			<Command.Item
				key={getOptionKey(option)}
				value={getOptionKey(option)}
				disabled={getOptionDisabled?.(option)}
				onSelect={() => onSelectOption(option)}
				className={cn(
					'flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none',
					'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50'
				)}
			>
				{renderOption ? (
					renderOption(option, selected)
				) : (
					<>
						<Check className={cn('size-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
						<span className='truncate'>{getOptionLabel(option)}</span>
					</>
				)}
			</Command.Item>
		);
	};

	return (
		<Command shouldFilter={false} className='flex w-full flex-col'>
			<div className='flex items-center gap-2 border-b border-border px-3 pb-2'>
				<Command.Input
					value={input}
					onValueChange={setInput}
					placeholder={searchPlaceholder ?? 'Search...'}
					className='h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground'
				/>
				{loading && <Spinner size={16} />}
			</div>
			<Command.List className='max-h-64 overflow-y-auto p-1'>
				<Command.Empty className='px-2 py-3 text-center text-sm text-muted-foreground'>{noOptionsText ?? 'No options'}</Command.Empty>
				{grouped
					? Array.from(grouped.entries()).map(([group, groupOptions]) => (
							<Command.Group key={group} heading={group} className='[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground'>
								{groupOptions.map(renderItem)}
							</Command.Group>
					  ))
					: filtered.map(renderItem)}
			</Command.List>
		</Command>
	);
}

const triggerClasses = cn(
	'flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-1.5 text-left text-sm shadow-xs transition-colors outline-none',
	'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'
);

type SingleComboboxProps<T> = ComboboxBaseProps<T> & {
	value: T | null;
	onChange: (value: T | null) => void;
};

function Combobox<T>({ value, onChange, ...props }: SingleComboboxProps<T>) {
	const [open, setOpen] = React.useState(false);
	const { getOptionKey, getOptionLabel, placeholder, disabled, className, id, tourElement } = props;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button type='button' role='combobox' aria-expanded={open} id={id} disabled={disabled} className={cn(triggerClasses, className)} {...({ 'tour-element': tourElement } as object)}>
					<span className={cn('truncate', !value && 'text-muted-foreground')}>{value ? getOptionLabel(value) : placeholder ?? 'Select...'}</span>
					<ChevronsUpDown className='size-4 shrink-0 opacity-50' />
				</button>
			</PopoverTrigger>
			<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0 pt-2' align='start'>
				<ComboboxList
					{...props}
					isSelected={(option) => !!value && getOptionKey(option) === getOptionKey(value)}
					onSelectOption={(option) => {
						onChange(option);
						setOpen(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}

type MultiComboboxProps<T> = ComboboxBaseProps<T> & {
	value: T[];
	onChange: (value: T[]) => void;
	renderChipIcon?: (option: T) => React.ReactNode;
	chipVariant?: React.ComponentProps<typeof Chip>['variant'];
};

function MultiCombobox<T>({ value, onChange, renderChipIcon, chipVariant = 'default', ...props }: MultiComboboxProps<T>) {
	const [open, setOpen] = React.useState(false);
	const { getOptionKey, getOptionLabel, placeholder, disabled, className, id, tourElement } = props;

	const toggle = (option: T) => {
		const key = getOptionKey(option);
		const exists = value.some((v) => getOptionKey(v) === key);
		onChange(exists ? value.filter((v) => getOptionKey(v) !== key) : [...value, option]);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button type='button' role='combobox' aria-expanded={open} id={id} disabled={disabled} className={cn(triggerClasses, 'h-auto', className)} {...({ 'tour-element': tourElement } as object)}>
					{value.length > 0 ? (
						<span className='flex flex-1 flex-wrap items-center gap-1'>
							{value.map((option) => (
								<Chip key={getOptionKey(option)} size='sm' variant={chipVariant} icon={renderChipIcon?.(option)} onDelete={disabled ? undefined : () => toggle(option)}>
									{getOptionLabel(option)}
								</Chip>
							))}
						</span>
					) : (
						<span className='truncate text-muted-foreground'>{placeholder ?? 'Select...'}</span>
					)}
					<ChevronsUpDown className='size-4 shrink-0 opacity-50' />
				</button>
			</PopoverTrigger>
			<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0 pt-2' align='start'>
				<ComboboxList {...props} isSelected={(option) => value.some((v) => getOptionKey(v) === getOptionKey(option))} onSelectOption={toggle} />
			</PopoverContent>
		</Popover>
	);
}

export { Combobox, MultiCombobox };
