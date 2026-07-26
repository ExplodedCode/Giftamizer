import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '../../lib/utils';

const chipVariants = cva('inline-flex max-w-full items-center gap-1.5 rounded-full border font-medium transition-colors', {
	variants: {
		variant: {
			default: 'border-transparent bg-secondary text-secondary-foreground',
			outline: 'border-border bg-transparent text-foreground',
			primary: 'border-primary/25 bg-primary/10 text-primary',
			festive: 'border-festive/40 bg-festive/15 text-festive-foreground dark:text-festive',
			destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
			/* Item claim statuses — tinted chips, same semantics as the old outlined chips. */
			available: 'border-status-available/30 bg-status-available/10 text-status-available',
			planned: 'border-status-planned/30 bg-status-planned/10 text-status-planned',
			purchased: 'border-status-purchased/30 bg-status-purchased/10 text-status-purchased',
		},
		size: {
			sm: 'h-6 px-2.5 text-xs',
			default: 'h-7 px-3 text-xs',
		},
		clickable: {
			true: 'cursor-pointer hover:opacity-80',
			false: '',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'default',
		clickable: false,
	},
});

export interface ChipProps extends React.ComponentProps<'div'>, VariantProps<typeof chipVariants> {
	/** Small leading element (avatar/icon). */
	icon?: React.ReactNode;
	onDelete?: () => void;
}

function Chip({ className, variant, size, icon, onDelete, onClick, children, ...props }: ChipProps) {
	return (
		<div className={cn(chipVariants({ variant, size, clickable: !!onClick }), className)} onClick={onClick} {...props}>
			{icon && <span className='-ml-1 flex shrink-0 items-center [&_svg]:size-3.5'>{icon}</span>}
			<span className='truncate'>{children}</span>
			{onDelete && (
				<button
					type='button'
					className='-mr-1 flex shrink-0 cursor-pointer items-center rounded-full opacity-60 transition-opacity outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50'
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
				>
					<X className='size-3.5' />
					<span className='sr-only'>Remove</span>
				</button>
			)}
		</div>
	);
}

export { Chip, chipVariants };
