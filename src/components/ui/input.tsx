import * as React from 'react';

import { cn } from '../../lib/utils';

/**
 * Plain native <input>. IMPORTANT: several call sites inspect the native event
 * (e.g. ItemCreate/ItemUpdate check e.nativeEvent.inputType === 'insertFromPaste'
 * to trigger URL-metadata import) — never wrap or synthesize the change event.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot='input'
			className={cn(
				'flex h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none',
				'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
				'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
				'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
				'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
				'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
				className
			)}
			{...props}
		/>
	);
}

export { Input };
