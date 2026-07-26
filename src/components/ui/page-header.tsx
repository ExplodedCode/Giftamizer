import * as React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { cn } from '../../lib/utils';

type Crumb = {
	label: React.ReactNode;
	to?: string;
};

/**
 * Per-page sub-header bar — replaces the old dense secondary AppBar +
 * MUI Breadcrumbs pattern used on Lists/Groups/Member/Shopping/Account pages.
 * `actions` renders right-aligned (filters, manage buttons, pins).
 */
function PageHeader({ crumbs, actions, className }: { crumbs: Crumb[]; actions?: React.ReactNode; className?: string }) {
	return (
		<div className={cn('sticky top-0 z-10 flex h-12 items-center justify-between gap-2 border-b border-border bg-background/95 px-4 backdrop-blur-sm', className)}>
			<nav className='flex min-w-0 items-center gap-1 text-sm'>
				{crumbs.map((crumb, index) => {
					const last = index === crumbs.length - 1;
					return (
						<React.Fragment key={index}>
							{index > 0 && <ChevronRight className='size-3.5 shrink-0 text-muted-foreground' />}
							{crumb.to && !last ? (
								<Link to={crumb.to} className='truncate text-muted-foreground transition-colors hover:text-foreground'>
									{crumb.label}
								</Link>
							) : (
								<span className={cn('truncate', last ? 'font-medium text-foreground' : 'text-muted-foreground')}>{crumb.label}</span>
							)}
						</React.Fragment>
					);
				})}
			</nav>
			{actions && <div className='flex shrink-0 items-center gap-1'>{actions}</div>}
		</div>
	);
}

export { PageHeader };
export type { Crumb };
