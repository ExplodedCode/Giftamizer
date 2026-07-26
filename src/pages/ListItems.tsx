import React from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from '../lib/snackbar';

import { useGetItems, useGetLists, useSetListPin } from '../lib/useSupabase';

import { Pin } from 'lucide-react';

import ItemCreate from '../components/ItemCreate';
import ItemCard from '../components/ItemCard';
import NotFound from '../components/NotFound';

import { cn } from '../lib/utils';
import { PageHeader } from '../components/ui/page-header';
import { Spinner } from '../components/ui/spinner';
import { SimpleTooltip } from '../components/ui/tooltip';

export default function ListItems() {
	const { list: listID } = useParams();
	const { enqueueSnackbar } = useSnackbar();

	const { data: lists, isLoading: loadingLists } = useGetLists();
	const { data: items, isLoading, isError, error } = useGetItems();
	const setListPin = useSetListPin();

	React.useEffect(() => {
		if (isError) {
			enqueueSnackbar(`Unable to get items! ${(error as any).message}`, { variant: 'error' });
		}
	}, [isError, error, enqueueSnackbar]);

	const pinned = lists?.find((l) => l.id === listID)?.pinned;

	return (
		<>
			{loadingLists || isLoading ? (
				<div className='mt-32 flex justify-center'>
					<Spinner size={32} />
				</div>
			) : (
				<>
					{lists?.find((l) => l.id === listID) ? (
						<>
							<PageHeader
								crumbs={[{ label: 'Lists', to: '/lists' }, { label: lists?.find((l) => l.id === listID)?.name }]}
								actions={
									<SimpleTooltip title={pinned ? 'Unpin' : 'Pin'}>
										<button
											type='button'
											onClick={() => {
												setListPin.mutateAsync({ id: listID!, pinned: !pinned });
											}}
											disabled={setListPin.isLoading}
											className={cn(
												'hidden size-9 cursor-pointer items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:flex',
												pinned ? 'text-festive hover:bg-festive/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
												setListPin.isLoading && 'pointer-events-none opacity-50'
											)}
										>
											{setListPin.isLoading ? <Spinner size={18} /> : <Pin className={cn('size-5', pinned && 'fill-current')} />}
										</button>
									</SimpleTooltip>
								}
							/>

							<div className='mx-auto max-w-5xl px-4 pt-4 pb-12'>
								<div className='flex flex-col gap-3'>
									{items
										?.filter((i) => i.lists?.find((l) => l.list_id === listID))
										?.filter((i) => !i.archived && !i.deleted)
										.map((item, index) => (
											<ItemCard index={index} key={item.id} item={item} editable />
										))}

									{items?.filter((i) => i.lists?.find((l) => l.list_id === listID)).length === 0 && (
										<div className='mt-24 text-center'>
											<p className='mb-1 text-xl font-medium'>This list does not have any items!</p>
											<p className='text-muted-foreground'>Add some gift ideas to share with your friends and family!</p>
										</div>
									)}
								</div>

								{isLoading && (
									<div className='mt-32 flex justify-center'>
										<Spinner size={32} />
									</div>
								)}
							</div>

							<ItemCreate defaultList={lists.find((l) => l.id === listID)!} />
						</>
					) : (
						<NotFound />
					)}
				</>
			)}
		</>
	);
}
