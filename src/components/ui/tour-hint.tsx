import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '../../lib/utils';

type MuiPlacement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end';

function toSideAlign(placement: MuiPlacement): { side: 'top' | 'bottom' | 'left' | 'right'; align: 'start' | 'center' | 'end' } {
	const [side, alignRaw] = placement.split('-') as ['top' | 'bottom' | 'left' | 'right', 'start' | 'end' | undefined];
	return { side, align: alignRaw ?? 'center' };
}

type TourHintProps = {
	/** Callout content (may include buttons). */
	title: React.ReactNode;
	open: boolean;
	placement?: MuiPlacement;
	children: React.ReactNode;
	className?: string;
};

/**
 * Always-open rich callout anchored to its child — replaces the old
 * `HtmlTooltip` (styled MUI Tooltip) used for guided-tour hints. Keeps the
 * same prop names (title/open/placement) so call sites translate 1:1.
 * Non-modal and focus-neutral: it never traps focus or blocks the page.
 */
function TourHint({ title, open, placement = 'bottom', children, className }: TourHintProps) {
	const { side, align } = toSideAlign(placement);

	return (
		<PopoverPrimitive.Root open={open} modal={false}>
			<PopoverPrimitive.Anchor asChild>{children}</PopoverPrimitive.Anchor>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					side={side}
					align={align}
					sideOffset={8}
					onOpenAutoFocus={(e) => e.preventDefault()}
					onCloseAutoFocus={(e) => e.preventDefault()}
					onEscapeKeyDown={(e) => e.preventDefault()}
					onPointerDownOutside={(e) => e.preventDefault()}
					onInteractOutside={(e) => e.preventDefault()}
					className={cn(
						// pointer-events-auto: Radix's dismissable layer disables pointer
						// events on <body> while a modal Dialog/menu is open, which would
						// otherwise make hints rendered over them unclickable.
						'pointer-events-auto z-[1400] max-w-xs rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-lg outline-none',
						'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
						className
					)}
				>
					{title}
					<PopoverPrimitive.Arrow className='fill-primary' width={14} height={7} />
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}

export { TourHint };
export type { MuiPlacement };
