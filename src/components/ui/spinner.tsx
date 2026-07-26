import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '../../lib/utils';

/** Replaces MUI CircularProgress. */
function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
	return <Loader2 className={cn('animate-spin text-primary', className)} style={{ width: size, height: size }} aria-label='Loading' />;
}

/** Full-screen loading overlay — replaces MUI Backdrop + CircularProgress. */
function Backdrop({ open, className }: { open: boolean; className?: string }) {
	if (!open) return null;
	return (
		<div className={cn('fixed inset-0 z-[1000] flex items-center justify-center bg-black/50', className)}>
			<Spinner size={40} className='text-white' />
		</div>
	);
}

/** Indeterminate horizontal bar — replaces MUI LinearProgress. */
function LinearProgress({ className }: { className?: string }) {
	return (
		<div className={cn('relative h-1 w-full overflow-hidden rounded-full bg-primary/20', className)}>
			<div className='absolute inset-y-0 w-1/3 animate-[linear-progress_1.2s_ease-in-out_infinite] rounded-full bg-primary' />
			<style>{`@keyframes linear-progress { 0% { left: -35%; } 60% { left: 100%; } 100% { left: 100%; } }`}</style>
		</div>
	);
}

export { Spinner, Backdrop, LinearProgress };
