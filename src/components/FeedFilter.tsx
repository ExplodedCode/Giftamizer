import * as React from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { useGetProfile, useUpdateFeedHidden } from '../lib/useSupabase';
import { FEED_CATEGORIES } from '../lib/useSupabase/types';
import { cn, useIsMobile } from '../lib/utils';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';

// forwardRef + prop spread: Radix triggers (asChild) attach their ref and handlers to this element
const FilterTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'> & { active: boolean }>(({ active, ...props }, ref) => (
	<button
		ref={ref}
		type='button'
		aria-label='Choose what shows in your feed'
		{...props}
		className='relative flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
	>
		<SlidersHorizontal className={cn('size-5', active && 'text-primary')} />
		{active && <span className='absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive' />}
	</button>
));
FilterTrigger.displayName = 'FilterTrigger';

/**
 * Per-user feed categories. A switch is ON when the category is shown;
 * hidden categories are stored in profiles.feed_hidden.
 */
function FeedFilterBody() {
	const { data: profile } = useGetProfile();
	const updateHidden = useUpdateFeedHidden();
	const hidden = profile?.feed_hidden ?? [];

	const setShown = (key: string, shown: boolean) => {
		updateHidden.mutate(shown ? hidden.filter((k) => k !== key) : [...hidden.filter((k) => k !== key), key]);
	};

	return (
		<div className='flex flex-col gap-3'>
			{FEED_CATEGORIES.map((category) => {
				const id = `feed-category-${category.key}`;
				return (
					<div key={category.key} className='flex items-start justify-between gap-4'>
						<label htmlFor={id} className='min-w-0 cursor-pointer select-none'>
							<span className='block text-sm font-medium'>{category.label}</span>
							<span className='block text-xs text-muted-foreground'>{category.description}</span>
						</label>
						<Switch id={id} className='mt-0.5' checked={!hidden.includes(category.key)} onCheckedChange={(checked) => setShown(category.key, checked === true)} />
					</div>
				);
			})}
		</div>
	);
}

export default function FeedFilter() {
	const { data: profile } = useGetProfile();
	const isMobile = useIsMobile();
	const active = (profile?.feed_hidden?.length ?? 0) > 0;

	if (isMobile) {
		return (
			<Dialog>
				<DialogTrigger asChild>
					<FilterTrigger active={active} />
				</DialogTrigger>
				{/* bottom sheet on phones */}
				<DialogContent size='sm' className='max-md:top-auto max-md:bottom-0 max-md:max-w-none max-md:translate-y-0 max-md:rounded-b-none'>
					<DialogHeader>
						<DialogTitle>Feed filters</DialogTitle>
						<DialogDescription>Choose what shows up in your feed.</DialogDescription>
					</DialogHeader>
					<FeedFilterBody />
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<FilterTrigger active={active} />
			</PopoverTrigger>
			<PopoverContent align='end' className='w-80'>
				<p className='mb-3 text-sm font-semibold'>Show in my feed</p>
				<FeedFilterBody />
			</PopoverContent>
		</Popover>
	);
}
