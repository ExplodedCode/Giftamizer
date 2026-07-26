import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Media-query hook for the few places responsive behavior must branch in JS
 * (ItemCard's desktop/mobile trees, dialog fullscreen handling, etc.).
 * Breakpoint values mirror MUI's: sm 600, md 900, lg 1200, xl 1536.
 */
export function useMediaQuery(query: string): boolean {
	const subscribe = React.useCallback(
		(callback: () => void) => {
			const mql = window.matchMedia(query);
			mql.addEventListener('change', callback);
			return () => mql.removeEventListener('change', callback);
		},
		[query]
	);

	return React.useSyncExternalStore(
		subscribe,
		() => window.matchMedia(query).matches,
		() => false
	);
}

/** Matches MUI's theme.breakpoints.down('md') — used by fullscreen dialogs. */
export function useIsMobile(): boolean {
	return useMediaQuery('(max-width: 899.95px)');
}
