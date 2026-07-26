import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '../../lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			data-slot='dialog-overlay'
			className={cn(
				'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
				className
			)}
			{...props}
		/>
	);
}

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
	/**
	 * When false, the dialog cannot be dismissed via Esc / outside click and the
	 * X button is hidden — used while a mutation is in flight (replaces the old
	 * `onClose={isLoading ? undefined : handleClose}` MUI pattern).
	 */
	dismissible?: boolean;
	/** Fullscreen below the md (900px) breakpoint — matches the old MUI `fullScreen={useMediaQuery(breakpoints.down('md'))}` dialogs. */
	fullScreenOnMobile?: boolean;
	/** Hide the corner X entirely (for confirm dialogs with explicit buttons). */
	hideCloseButton?: boolean;
	size?: 'sm' | 'default' | 'lg' | 'xl';
};

function DialogContent({ className, children, dismissible = true, fullScreenOnMobile = false, hideCloseButton = false, size = 'default', ...props }: DialogContentProps) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot='dialog-content'
				onEscapeKeyDown={dismissible ? props.onEscapeKeyDown : (e) => e.preventDefault()}
				onPointerDownOutside={dismissible ? props.onPointerDownOutside : (e) => e.preventDefault()}
				onInteractOutside={dismissible ? props.onInteractOutside : (e) => e.preventDefault()}
				className={cn(
					'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg',
					'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
					size === 'sm' && 'max-w-sm',
					size === 'default' && 'max-w-lg',
					size === 'lg' && 'max-w-2xl',
					size === 'xl' && 'max-w-4xl',
					fullScreenOnMobile &&
						'max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-h-dvh max-md:w-screen max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:border-0',
					className
				)}
				{...props}
			>
				{children}
				{!hideCloseButton && dismissible && (
					<DialogPrimitive.Close
						data-slot='dialog-close'
						className='absolute top-4 right-4 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer'
					>
						<X className='size-4' />
						<span className='sr-only'>Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot='dialog-header' className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot='dialog-footer' className={cn('mt-auto flex flex-row items-center justify-end gap-2 pt-2', className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return <DialogPrimitive.Title data-slot='dialog-title' className={cn('text-lg leading-none font-semibold tracking-tight', className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return <DialogPrimitive.Description data-slot='dialog-description' className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
