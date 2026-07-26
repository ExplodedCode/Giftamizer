import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '../../lib/utils';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot='checkbox'
			className={cn(
				'peer size-4 shrink-0 cursor-pointer rounded-[4px] border border-input shadow-xs transition-colors outline-none',
				'focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
				'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
				className
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator data-slot='checkbox-indicator' className='flex items-center justify-center text-current'>
				<Check className='size-3.5' />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

/** Checkbox + label row — replaces MUI's FormControlLabel(control=Checkbox). */
function LabeledCheckbox({ label, className, id, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root> & { label: React.ReactNode }) {
	const generatedId = React.useId();
	const checkboxId = id ?? generatedId;
	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Checkbox id={checkboxId} {...props} />
			<label htmlFor={checkboxId} className='cursor-pointer select-none text-sm'>
				{label}
			</label>
		</div>
	);
}

export { Checkbox, LabeledCheckbox };
