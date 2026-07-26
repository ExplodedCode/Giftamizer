import * as React from 'react';

import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';

type ConfirmDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: React.ReactNode;
	description?: React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	destructive?: boolean;
	loading?: boolean;
	onConfirm: () => void;
	children?: React.ReactNode;
};

/** Confirmation dialog (delete group/list/account, leave group, empty trash...). */
function ConfirmDialog({ open, onOpenChange, title, description, confirmText = 'Confirm', cancelText = 'Cancel', destructive = false, loading = false, onConfirm, children }: ConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
			<DialogContent size='sm' dismissible={!loading} hideCloseButton>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				{children}
				<DialogFooter>
					<Button variant='ghost' disabled={loading} onClick={() => onOpenChange(false)}>
						{cancelText}
					</Button>
					<Button variant={destructive ? 'destructive' : 'default'} loading={loading} onClick={onConfirm}>
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { ConfirmDialog };
