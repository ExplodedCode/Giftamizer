import { SnackbarAction, VariantType } from 'notistack';

export type SnackbarAlert = {
	text: string;
	options?: SnackbarOptions;
};
export type SnackbarOptions = {
	variant?: VariantType;
	action?: SnackbarAction;
};
