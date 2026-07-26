import React from 'react';
import { useSnackbar } from '../lib/snackbar';

import { useEmptyTrash, useGetItems } from '../lib/useSupabase';

import { Trash2 } from 'lucide-react';

import ItemCard from '../components/ItemCard';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/ui/spinner';

export default function ItemsTrash() {
	const { enqueueSnackbar } = useSnackbar();

	const { data: items, isLoading, isError, error } = useGetItems();

	React.useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get items! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	const emptyTrash = useEmptyTrash();
	const handleEmptyTrash = async () => {
		await emptyTrash.mutateAsync(items?.filter((i) => i.deleted).map((i) => i.id)!).catch((err) => {
			enqueueSnackbar(`Unable to restore item! ${err.message}`, { variant: 'error' });
		});
	};

	return (
		<>
			<div className='mx-auto max-w-5xl px-4 pt-4 pb-12'>
				{items?.filter((i) => i.deleted).length !== 0 && (
					<div className='mb-6 flex justify-center'>
						<Button variant='outline' className='border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive' onClick={handleEmptyTrash}>
							Empty Trash
							<Trash2 />
						</Button>
					</div>
				)}

				<div className='flex flex-col gap-3'>
					{items
						?.filter((i) => i.deleted)
						.map((item, index) => (
							<ItemCard index={index} key={item.id} item={item} editable />
						))}

					{items?.filter((i) => i.deleted).length === 0 && (
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
		</>
	);
}
