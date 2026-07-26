import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '../../lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
	return (
		<TooltipPrimitive.Provider delayDuration={300}>
			<TooltipPrimitive.Root data-slot='tooltip' {...props} />
		</TooltipPrimitive.Provider>
	);
}

const TooltipTrigger = TooltipPrimitive.Trigger;

function TooltipContent({ className, sideOffset = 4, children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				data-slot='tooltip-content'
				sideOffset={sideOffset}
				className={cn(
					'z-50 w-fit max-w-xs rounded-md bg-foreground px-3 py-1.5 text-xs text-background',
					'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
					className
				)}
				{...props}
			>
				{children}
				<TooltipPrimitive.Arrow className='fill-foreground' />
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	);
}

/**
 * Convenience wrapper matching the common `<Tooltip title=...><child/></Tooltip>`
 * usage pattern from MUI.
 */
function SimpleTooltip({ title, children, side }: { title: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
	if (!title) return <>{children}</>;
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side={side}>{title}</TooltipContent>
		</Tooltip>
	);
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, SimpleTooltip };
