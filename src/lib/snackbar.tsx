import * as React from 'react';
import { toast } from 'sonner';

/**
 * notistack-compatible façade over sonner.
 *
 * The app's ~60 call sites (and src/types.tsx) were written against
 * notistack's API. This shim preserves that API so call sites only change
 * their import path. enqueueSnackbar/closeSnackbar are module-level constants,
 * matching notistack's stable identities — several effects (e.g. the realtime
 * subscription in Notifications.tsx) list them in dependency arrays.
 */

export type SnackbarKey = string | number;
export type VariantType = 'default' | 'error' | 'success' | 'warning' | 'info';
export type SnackbarMessage = string | React.ReactNode;
export type SnackbarAction = React.ReactNode | ((key: SnackbarKey) => React.ReactNode);

export interface OptionsObject {
	variant?: VariantType;
	persist?: boolean;
	key?: SnackbarKey;
	action?: SnackbarAction;
	/** null = never auto-hide (notistack semantics) */
	autoHideDuration?: number | null;
}

let counter = 0;

export function enqueueSnackbar(message: SnackbarMessage, options?: OptionsObject): SnackbarKey {
	const key: SnackbarKey = options?.key ?? `snackbar-${++counter}`;

	const duration = options?.persist || options?.autoHideDuration === null ? Infinity : options?.autoHideDuration ?? undefined;

	const action = typeof options?.action === 'function' ? options.action(key) : options?.action;

	const toastOptions = {
		id: key,
		duration,
		action: action ? <span className='flex items-center gap-1'>{action}</span> : undefined,
	};

	switch (options?.variant) {
		case 'error':
			toast.error(message, toastOptions);
			break;
		case 'success':
			toast.success(message, toastOptions);
			break;
		case 'warning':
			toast.warning(message, toastOptions);
			break;
		case 'info':
			toast.info(message, toastOptions);
			break;
		default:
			toast(message, toastOptions);
	}

	return key;
}

export function closeSnackbar(key?: SnackbarKey): void {
	if (key !== undefined) {
		toast.dismiss(key);
	} else {
		toast.dismiss();
	}
}

const snackbarApi = { enqueueSnackbar, closeSnackbar };

export function useSnackbar(): typeof snackbarApi {
	return snackbarApi;
}
