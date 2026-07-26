import React from 'react';
import { useSnackbar } from '../lib/snackbar';

import { useGetItems } from '../lib/useSupabase';

import ItemCard from '../components/ItemCard';
import { Spinner } from '../components/ui/spinner';

export default function ItemArchive() {
	const { enqueueSnackbar } = useSnackbar();

	const { data: items, isLoading, isError, error } = useGetItems();

	React.useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get items! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	return (
		<>
			<div className='mx-auto max-w-5xl px-4 pt-4 pb-12'>
				<div className='flex flex-col gap-3'>
					{items
						?.filter((i) => i.archived)
						.map((item, index) => (
							<ItemCard index={index} key={item.id} item={item} editable />
						))}

					{items?.filter((i) => i.archived).length === 0 && (
						<div className='mt-24 text-center'>
							<p className='text-xl font-medium'>Archive is empty!</p>
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
