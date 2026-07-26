import { SnackbarAction, VariantType } from './lib/snackbar';

export type SnackbarAlert = {
	text: string;
	options?: SnackbarOptions;
};
export type SnackbarOptions = {
	variant?: VariantType;
	action?: SnackbarAction;
};
