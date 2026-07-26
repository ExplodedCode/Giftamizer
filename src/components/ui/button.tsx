import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 cursor-pointer",
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs',
				destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs',
				outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				'ghost-primary': 'text-primary hover:bg-primary/10',
				'ghost-destructive': 'text-destructive hover:bg-destructive/10',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-9 px-4 py-2',
				sm: 'h-8 rounded-md px-3 text-xs',
				lg: 'h-10 rounded-lg px-6',
				icon: 'size-9 rounded-lg',
				'icon-sm': 'size-8 rounded-md',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

export interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	loading?: boolean;
}

function Button({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }: ButtonProps) {
	// Slot requires exactly one child, and `disabled` is not valid on the
	// elements asChild renders into (e.g. an anchor), so the spinner and
	// disabled state only apply to the real <button>.
	if (asChild) {
		return (
			<Slot data-slot='button' className={cn(buttonVariants({ variant, size, className }))} {...props}>
				{children}
			</Slot>
		);
	}

	return (
		<button data-slot='button' className={cn(buttonVariants({ variant, size, className }))} disabled={disabled || loading} {...props}>
			{loading && <Loader2 className='animate-spin' aria-hidden />}
			{children}
		</button>
	);
}

export { Button, buttonVariants };
