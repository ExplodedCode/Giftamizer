import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { CalendarDays } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type DatePickerProps = {
	value: Date | undefined;
	onChange: (date: Date | undefined) => void;
	placeholder?: string;
	disablePast?: boolean;
	disabled?: boolean;
	className?: string;
	id?: string;
};

/**
 * Calendar picker in a popover — replaces @mui/x-date-pickers MobileDatePicker
 * (only consumer: SecretSantaSetup event date).
 */
function DatePicker({ value, onChange, placeholder = 'Pick a date', disablePast = false, disabled, className, id }: DatePickerProps) {
	const [open, setOpen] = React.useState(false);

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					id={id}
					disabled={disabled}
					className={cn(
						'flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm shadow-xs transition-colors outline-none',
						'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
						className
					)}
				>
					<CalendarDays className='size-4 shrink-0 opacity-60' />
					<span className={cn('truncate', !value && 'text-muted-foreground')}>
						{value ? value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : placeholder}
					</span>
				</button>
			</PopoverTrigger>
			<PopoverContent className='w-auto p-2' align='start'>
				<DayPicker
					mode='single'
					selected={value}
					onSelect={(date) => {
						onChange(date ?? undefined);
						setOpen(false);
					}}
					disabled={disablePast ? { before: today } : undefined}
					className='[--rdp-accent-color:var(--primary)] [--rdp-accent-background-color:color-mix(in_srgb,var(--primary)_15%,transparent)] [--rdp-today-color:var(--primary)]'
				/>
			</PopoverContent>
		</Popover>
	);
}

export { DatePicker };
