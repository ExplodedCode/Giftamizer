import React from 'react';

import { useParams, useNavigate, NavigateFunction, useLocation } from 'react-router-dom';
import { groupTourProgress, useGetGroupMembers, useGetGroups, useGetLists, useGetProfile, useGetTour, useSetGroupPin, useUpdateTour } from '../lib/useSupabase';
import { UseMutationResult } from '@tanstack/react-query';
import { Member, TourSteps } from '../lib/useSupabase/types';

import { Baby, Pin } from 'lucide-react';

import GroupSettingsDialog from '../components/GroupSettingsDialog';
import NotFound from '../components/NotFound';
import TourTooltip from '../components/TourTooltip';
import SecretSanta from '../components/SecretSanta';

import { cn, useMediaQuery } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Collapse } from '../components/ui/collapse';
import { PageHeader } from '../components/ui/page-header';
import { Spinner } from '../components/ui/spinner';
import { SimpleTooltip } from '../components/ui/tooltip';

interface RenderMemberProps {
	index: number;
	member: Member;
	navigate: NavigateFunction;

	tour: TourSteps | undefined;
	updateTour: UseMutationResult<TourSteps, unknown, TourSteps, unknown>;
}
function RenderMember({ index, member, navigate, tour, updateTour }: RenderMemberProps) {
	const { group: groupID } = useParams();

	return (
		<div {...({ 'tour-element': index === 0 ? 'group_member_card' : undefined } as object)} className='w-full sm:w-[250px]'>
			<button
				type='button'
				onClick={() => {
					navigate(`/groups/${groupID}/${member.user_id}`);

					if (!tour?.group_member_card) {
						updateTour.mutateAsync({
							group_member_card: true,
						});
					}
				}}
				className='group block w-full animate-in cursor-pointer overflow-hidden rounded-xl border border-border bg-card text-left shadow-xs transition-all outline-none fade-in zoom-in-95 fill-mode-backwards hover:shadow-md hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring'
				style={{ animationDelay: `${index * 25}ms` }}
			>
				<div className='flex h-[250px] w-full items-center justify-center overflow-hidden bg-primary'>
					{member.profile.image ? (
						<img src={member.profile.image} alt={`${member.profile.first_name} ${member.profile.last_name}`} className='size-full object-cover transition-transform duration-300 group-hover:scale-105' />
					) : (
						<span className='text-[150px] leading-none font-medium text-primary-foreground'>{Array.from(String(member.profile.first_name + member.profile.last_name).toUpperCase())[0]}</span>
					)}
				</div>

				<div className='flex items-center justify-between gap-2 p-4'>
					<p className='truncate text-lg font-semibold'>
						{member.profile.first_name} {member.profile.last_name}
					</p>

					{member.child_list && <Baby className='size-5 shrink-0 text-muted-foreground' />}
				</div>
			</button>
		</div>
	);
}

export default function Group() {
	const navigate = useNavigate();
	const location = useLocation();
	const { group: groupID, user: userID } = useParams();

	const { data: profile } = useGetProfile();
	const { data: lists } = useGetLists();
	const { data: groups, isLoading: groupsLoading } = useGetGroups();
	const { data: members, isLoading: membersLoading } = useGetGroupMembers(groupID!);
	const setGroupPin = useSetGroupPin();

	//
	// User tour
	const [showTour, setShowTour] = React.useState<boolean>(false);
	const { data: tour } = useGetTour();
	const updateTour = useUpdateTour();
	const isMobile = useMediaQuery('(max-width: 899.95px)');

	React.useEffect(() => {
		setTimeout(() => {
			setShowTour(true);
		}, 500);
	}, []);

	const pinned = groups?.find((g) => g.id === groupID)?.my_membership[0].pinned;

	// Memoized so children (Secret Santa) get a stable array reference.
	const visibleMembers = React.useMemo(() => members?.filter((m) => !m.invite) ?? [], [members]);

	return (
		<>
			{groupsLoading || membersLoading ? (
				<div className='mt-32 flex justify-center'>
					<Spinner size={32} />
				</div>
			) : (
				<>
					{!userID && groups?.find((g) => g.id === groupID && !g.my_membership[0].invite) ? (
						<>
							<PageHeader
								crumbs={[{ label: 'Groups', to: '/groups' }, { label: groups?.find((g) => g.id === groupID)?.name }]}
								actions={
									<>
										<SimpleTooltip title={pinned ? 'Unpin' : 'Pin'}>
											<button
												type='button'
												{...({ 'tour-element': 'group_pin' } as object)}
												onClick={() => {
													setGroupPin.mutateAsync({ id: groupID!, pinned: !pinned });
												}}
												disabled={setGroupPin.isLoading}
												className={cn(
													'hidden size-9 cursor-pointer items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:flex',
													pinned ? 'text-festive hover:bg-festive/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
													setGroupPin.isLoading && 'pointer-events-none opacity-50'
												)}
											>
												{setGroupPin.isLoading ? <Spinner size={18} /> : <Pin className={cn('size-5', pinned && 'fill-current')} />}
											</button>
										</SimpleTooltip>

										<GroupSettingsDialog group={groups?.find((g) => g.id === groupID)!} owner={groups?.find((g) => g.id === groupID)?.my_membership[0].owner!} />
									</>
								}
							/>

							<ListUnassignedAlert open={profile?.enable_lists && lists?.filter((l) => !l.child_list && l.groups.find((g) => g.id === groupID)).length === 0} />

							<div className='mx-auto max-w-6xl px-4 pt-4 pb-12'>
								{visibleMembers.length > 1 && <SecretSanta group={groups?.find((g) => g.id === groupID)!} members={visibleMembers} />}

								<div className='flex flex-wrap justify-center gap-4'>
									{visibleMembers.map((member, index) => (
										<RenderMember key={member.user_id} index={index} member={member} navigate={navigate} tour={tour} updateTour={updateTour} />
									))}
								</div>

								{visibleMembers.length === 0 && (!groupsLoading || !membersLoading) && (
									<p className='mt-24 text-center text-xl font-medium'>This group has no members, invite some friends and family!</p>
								)}
							</div>

							{groups && showTour && tour && (
								<>
									<TourTooltip
										open={groupTourProgress(tour, isMobile) === 'group_settings' && location.hash === ''}
										anchorEl={document.querySelector('[tour-element="group_settings"]')}
										placement='bottom-end'
										content={
											<div>
												<p>{groups?.find((g) => g.id === groupID)?.my_membership[0].owner ? 'Manage your group members and settings here.' : 'Manage your group here.'}</p>
												<div className='mt-1 flex justify-end'>
													<Button
														variant='secondary'
														size='sm'
														onClick={() => {
															updateTour.mutateAsync({
																group_settings: true,
															});
														}}
														loading={updateTour.isLoading}
													>
														Next
													</Button>
												</div>
											</div>
										}
										allowClick
									/>
									<TourTooltip
										open={groupTourProgress(tour, isMobile) === 'group_pin' && !isMobile && location.hash === ''}
										anchorEl={document.querySelector('[tour-element="group_pin"]')}
										placement='bottom-end'
										content={
											<div>
												<p>Pin groups to the side navigation.</p>
												<div className='mt-1 flex justify-end'>
													<Button
														variant='secondary'
														size='sm'
														onClick={() => {
															updateTour.mutateAsync({
																group_pin: true,
															});
														}}
														loading={updateTour.isLoading}
													>
														Next
													</Button>
												</div>
											</div>
										}
										allowClick
									/>

									<TourTooltip
										open={groupTourProgress(tour, isMobile) === 'group_member_card' && location.hash === ''}
										anchorEl={document.querySelector('[tour-element="group_member_card"]')}
										placement='bottom'
										content={<p className='text-base font-semibold'>View items your friends and family shared!</p>}
										mask
										allowClick
									/>
								</>
							)}
						</>
					) : (
						<NotFound />
					)}
				</>
			)}
		</>
	);
}

interface ListUnassignedAlertProps {
	open?: boolean;
}
function ListUnassignedAlert({ open }: ListUnassignedAlertProps) {
	return (
		<Collapse in={!!open}>
			<div className='bg-status-planned/10 px-4 py-2.5 text-sm text-status-planned'>You are not sharing any lists with this group!</div>
		</Collapse>
	);
}
