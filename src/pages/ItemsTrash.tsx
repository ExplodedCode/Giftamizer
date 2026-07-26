import React from 'react';
import { useSnackbar } from '../lib/snackbar';

import { useEmptyTrash, useGetItems } from '../lib/useSupabase';

import { Trash2 } from 'lucide-react';

import ItemCard from '../components/ItemCard';
import { Button } from '../components/ui/button';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Spinner } from '../components/ui/spinner';

export default function ItemsTrash() {
	const { enqueueSnackbar } = useSnackbar();

	const { data: items, isLoading, isError, error } = useGetItems();

	const [confirmEmptyOpen, setConfirmEmptyOpen] = React.useState(false);

	React.useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get items! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	const deletedItems = items?.filter((i) => i.deleted);

	const emptyTrash = useEmptyTrash();
	const handleEmptyTrash = async () => {
		await emptyTrash
			.mutateAsync(deletedItems?.map((i) => i.id)!)
			.then(() => {
				setConfirmEmptyOpen(false);
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to empty trash! ${err.message}`, { variant: 'error' });
			});
	};

	return (
		<>
			<div className='mx-auto max-w-5xl px-4 pt-4 pb-12'>
				{deletedItems?.length !== 0 && (
					<div className='mb-6 flex justify-center'>
						<Button
							variant='outline'
							className='border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive'
							onClick={() => setConfirmEmptyOpen(true)}
							loading={emptyTrash.isLoading}
						>
							Empty Trash
							<Trash2 />
						</Button>
					</div>
				)}

				<div className='flex flex-col gap-3'>
					{deletedItems?.map((item, index) => (
						<ItemCard index={index} key={item.id} item={item} editable />
					))}

					{deletedItems?.length === 0 && (
						<div className='mt-24 text-center'>
							<p className='text-xl font-medium'>Trash is empty!</p>
						</div>
					)}
				</div>

				{isLoading && (
					<div className='mt-32 flex justify-center'>
						<Spinner size={32} />
					</div>
				)}
			</div>

			<ConfirmDialog
				open={confirmEmptyOpen}
				onOpenChange={setConfirmEmptyOpen}
				title='Empty Trash?'
				description={`This action is permanent! ${deletedItems?.length === 1 ? 'The item' : `All ${deletedItems?.length} items`} in the trash will be deleted and cannot be recovered.`}
				confirmText='Yes, Empty it'
				destructive
				loading={emptyTrash.isLoading}
				onConfirm={handleEmptyTrash}
			/>
		</>
	);
}
