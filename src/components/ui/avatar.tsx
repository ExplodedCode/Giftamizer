import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '../../lib/utils';

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
	return <AvatarPrimitive.Root data-slot='avatar' className={cn('relative flex size-10 shrink-0 overflow-hidden rounded-full', className)} {...props} />;
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
	return <AvatarPrimitive.Image data-slot='avatar-image' className={cn('aspect-square size-full object-cover', className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
	return (
		<AvatarPrimitive.Fallback
			data-slot='avatar-fallback'
			className={cn('flex size-full items-center justify-center rounded-full bg-primary font-medium text-primary-foreground', className)}
			{...props}
		/>
	);
}

/**
 * Convenience component matching the app's common MUI Avatar usage:
 * shows the image when a src is available, otherwise the first letter(s).
 */
function UserAvatar({ src, alt, fallback, className }: { src?: string | null; alt?: string; fallback?: React.ReactNode; className?: string }) {
	return (
		<Avatar className={className}>
			{src ? <AvatarImage src={src} alt={alt} /> : null}
			<AvatarFallback>{fallback ?? (alt ? alt.charAt(0).toUpperCase() : '?')}</AvatarFallback>
		</Avatar>
	);
}

/** Overlapping avatar stack — replaces MUI AvatarGroup. */
function AvatarGroup({ children, max, className }: { children: React.ReactNode; max?: number; className?: string }) {
	const items = React.Children.toArray(children);
	const visible = max !== undefined && items.length > max ? items.slice(0, max) : items;
	const overflow = items.length - visible.length;

	return (
		<div className={cn('flex items-center -space-x-2', className)}>
			{visible.map((child, i) => (
				<div key={i} className='rounded-full ring-2 ring-background'>
					{child}
				</div>
			))}
			{overflow > 0 && (
				<div className='flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground ring-2 ring-background'>+{overflow}</div>
			)}
		</div>
	);
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar, AvatarGroup };
