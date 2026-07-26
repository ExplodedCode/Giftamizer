import React from 'react';
import { useSnackbar } from '../lib/snackbar';

import { useGetItems } from '../lib/useSupabase';

import ItemCreate from '../components/ItemCreate';
import ItemCard, { ItemCardSkeletonList } from '../components/ItemCard';

export default function Items() {
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
						?.filter((i) => !i.archived && !i.deleted)
						.map((item, index) => (
							<ItemCard index={index} key={item.id} item={item} editable />
						))}

					{items?.filter((i) => !i.archived && !i.deleted).length === 0 && (
						<div className='mt-24 text-center'>
							<p className='mb-1 text-xl font-medium'>You don't have any items!</p>
							<p className='text-muted-foreground'>Add some gift ideas to share with your friends and family!</p>
						</div>
					)}
				</div>

				{isLoading && <ItemCardSkeletonList />}
			</div>

			<ItemCreate />
		</>
	);
}
