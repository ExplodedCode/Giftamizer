import React from 'react';

import { NavigateFunction, useLocation, useNavigate, useParams } from 'react-router-dom';
import { UseMutationResult } from '@tanstack/react-query';

import { groupTourProgress, useActiveTourLeg, useGetGroups, useGetTour, useUpdateTour } from '../lib/useSupabase';
import { GroupType, TourSteps } from '../lib/useSupabase/types';

import GroupCreate from '../components/GroupCreate';
import TourTooltip from '../components/TourTooltip';

import { PageHeader } from '../components/ui/page-header';
import { Spinner } from '../components/ui/spinner';

interface RenderGroupProps {
	index: number;
	group: GroupType;
	navigate: NavigateFunction;

	tour: TourSteps | undefined;
	updateTour: UseMutationResult<TourSteps, unknown, TourSteps, unknown>;
}
function RenderGroup({ index, group, navigate, tour, updateTour }: RenderGroupProps) {
	return (
		<div {...({ 'tour-element': index === 0 ? 'group_card' : undefined } as object)} className='w-full sm:w-[250px]'>
			<button
				type='button'
				onClick={() => {
					navigate(`/groups/${group.id}`);
					if (!tour?.group_card) {
						updateTour.mutateAsync({
							group_card: true,
						});
					}
				}}
				className='group block w-full animate-in cursor-pointer overflow-hidden rounded-xl border border-border bg-card text-left shadow-xs backdrop-blur-none transition-all outline-none fade-in zoom-in-95 fill-mode-backwards hover:shadow-md hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring'
				style={{ animationDelay: `${index * 25}ms` }}
			>
				<div className='flex h-[250px] w-full items-center justify-center overflow-hidden bg-primary'>
					{group.image ? (
						<img src={group.image} alt={group.name} className='size-full object-cover transition-transform duration-300 group-hover:scale-105' />
					) : (
						<span className='text-[150px] leading-none font-medium text-primary-foreground'>{Array.from(String(group.name).toUpperCase())[0]}</span>
					)}
				</div>

				<div className='p-4'>
					<p className='truncate text-lg font-semibold'>{group.name}</p>
				</div>
			</button>
		</div>
	);
}

export default function Groups() {
	const navigate = useNavigate();
	const location = useLocation();
	const { group: groupID, user: userID } = useParams();

	const { data: groups, isLoading } = useGetGroups();

	//
	// User tour
	const [showTour, setShowTour] = React.useState<boolean>(false);
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const activeTourLeg = useActiveTourLeg();

	React.useEffect(() => {
		if (!isLoading) {
			setTimeout(() => {
				setShowTour(true);
			}, 400);
		}
	}, [isLoading]);

	return (
		<>
			<PageHeader crumbs={!userID && groupID ? [{ label: 'Groups', to: '/groups' }, { label: groups?.find((g) => g.id === groupID)?.name }] : [{ label: 'Groups' }]} />

			<div className='mx-auto max-w-6xl px-4 pt-4 pb-12'>
				<div className='flex flex-wrap justify-center gap-4'>
					{groups
						?.filter((g) => !g.my_membership[0].invite)
						.map((group, index) => (
							<RenderGroup key={group.id} index={index} group={group} navigate={navigate} tour={tour} updateTour={updateTour} />
						))}
				</div>

				{groups?.filter((g) => !g.my_membership[0].invite)?.length === 0 && (
					<div className='mt-24 text-center'>
						<p className='mb-1 text-xl font-medium'>You don't have any groups!</p>
						<p className='text-muted-foreground'>Create or join a group with your friends and family.</p>
					</div>
				)}

				{isLoading && (
					<div className='mt-32 flex justify-center'>
						<Spinner size={32} />
					</div>
				)}
			</div>

			<GroupCreate />

			{groups && groups?.filter((g) => g.my_membership[0].invite).length === 0 && showTour && tour && activeTourLeg === 'group' && location.hash === '' && (
				<>
					<TourTooltip
						open={groupTourProgress(tour, false) === 'group_card'}
						anchorEl={document.querySelector('[tour-element="group_card"]')}
						placement='bottom'
						content={<p className='text-base font-semibold'>Open a group to see who's in it.</p>}
						mask
						allowClick
					/>
				</>
			)}
		</>
	);
}
