import * as React from 'react';

import { cn } from '../../lib/utils';
import { Label } from './label';

type FormFieldProps = {
	label?: React.ReactNode;
	htmlFor?: string;
	required?: boolean;
	error?: boolean;
	helperText?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
};

/**
 * Label + control + helper/error text wrapper — replaces the MUI
 * TextField/FormControl/FormHelperText composition.
 */
function FormField({ label, htmlFor, required, error, helperText, className, children }: FormFieldProps) {
	return (
		<div className={cn('flex w-full flex-col gap-1.5', className)}>
			{label !== undefined && (
				<Label htmlFor={htmlFor} className={cn(error && 'text-destructive')}>
					{label}
					{required && <span className='text-destructive'>*</span>}
				</Label>
			)}
			{children}
			{helperText !== undefined && helperText !== null && helperText !== '' && (
				<p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{helperText}</p>
			)}
		</div>
	);
}

export { FormField };
