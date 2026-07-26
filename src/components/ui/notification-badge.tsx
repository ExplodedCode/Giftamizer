import * as React from 'react';

import { cn } from '../../lib/utils';

/**
 * Count bubble anchored to the top-right of its child — replaces MUI Badge
 * (Notifications bell, invites button).
 */
function NotificationBadge({ count, children, className, max = 99 }: { count: number; children: React.ReactNode; className?: string; max?: number }) {
	return (
		<span className={cn('relative inline-flex', className)}>
			{children}
			{count > 0 && (
				<span className='pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-background'>
					{count > max ? `${max}+` : count}
				</span>
			)}
		</span>
	);
}

export { NotificationBadge };
