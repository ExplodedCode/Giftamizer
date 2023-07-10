import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { ExternalInvite, GroupType, Member } from '../types';
import { InviteUserType } from '../../../components/UserSearch';

export const GROUPS_QUERY_KEY = ['groups'];

export const useGetGroups = () => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: GROUPS_QUERY_KEY,
		queryFn: async (): Promise<GroupType[]> => {
			const { data, error } = await client
				.from('groups')
				.select(
					`id,
					name,
					image_token,
					my_membership:group_members!inner(*)`
				)
				.eq('my_membership.user_id', user.id);
			if (error) throw error;

			return data as GroupType[];
		},
	});
};

export const useGetGroupMembers = (group_id: string) => {
	const { client, user } = useSupabase();

	return useQuery({
		queryKey: [...GROUPS_QUERY_KEY, group_id, 'members'],
		queryFn: async (): Promise<Member[]> => {
			const { data, error } = await client
				.from('group_members')
				.select(
					`user_id,
					owner,
					invite,
					profile:profiles(
							email,
							first_name,
							last_name,
							bio,
							avatar_token
						)
					)
					`
				)
				.neq('user_id', user.id)
				.eq('group_id', group_id);
			if (error) throw error;

			// get and merge external invites
			const { data: invites, error: externalInvitesError } = await client.from('external_invites').select('*').eq('group_id', group_id);
			if (externalInvitesError) throw error;
			var externalInvites: Member[] = (invites as ExternalInvite[]).map((i) => {
				return {
					user_id: i.invite_id,
					owner: i.owner,
					invite: true,
					profile: {
						first_name: '',
						last_name: '',
						email: i.email,
						bio: '',
						avatar_token: null,
					},
					external: true,
				};
			}) as Member[];

			return [...data, ...externalInvites] as any as Member[];
		},
	});
};

export const useSetGroupPin = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	interface PinUpdate {
		id: string;
		pinned: boolean;
	}

	return useMutation(
		async (pinUpdate: PinUpdate): Promise<PinUpdate> => {
			const { error } = await client.from('group_members').update({ pinned: pinUpdate.pinned }).eq('group_id', pinUpdate.id).eq('user_id', user.id);
			if (error) throw error;

			return pinUpdate;
		},
		{
			onSuccess: (pinUpdate: PinUpdate) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => {
					if (prevGroups) {
						const updatedGroups = prevGroups.map((group) => {
							return group.id === pinUpdate.id
								? {
										...group,
										my_membership: [
											{
												...group.my_membership[0],
												pinned: pinUpdate.pinned,
											},
										],
								  }
								: group;
						});
						return updatedGroups;
					}
					return prevGroups;
				});
			},
		}
	);
};

export const useUpdateGroup = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	interface GroupUpdate {
		group: Omit<GroupType, 'image_token'>;
		members: Member[];
	}

	return useMutation(
		async (update: GroupUpdate): Promise<GroupUpdate> => {
			const { error: groupError } = await client.from('groups').update({ name: update.group.name }).eq('id', update.group.id);
			if (groupError) throw groupError;

			// Update Members
			const { error: memberError } = await client.from('group_members').upsert(
				update.members
					?.filter((m) => !m.deleted && !m.external)
					.map((m) => {
						return {
							group_id: update.group.id,
							user_id: m.user_id,
							owner: m.owner,
						};
					})
			);
			if (memberError) throw memberError;

			// Update External Invites
			const { error: inviteError } = await client.from('external_invites').upsert(
				update.members
					?.filter((m) => !m.deleted && m.external)
					.map((m) => {
						return {
							invite_id: m.user_id,
							group_id: update.group.id,
							email: m.profile.email,
							owner: m.owner,
						};
					}) as ExternalInvite[]
			);
			if (inviteError) throw inviteError;

			update.members
				.filter((m) => m.deleted)
				.forEach(async (deletedUser) => {
					if (!deletedUser.external) {
						const { error } = await client.from('group_members').delete().eq('group_id', update.group.id).eq('user_id', deletedUser.user_id);
						if (error) throw error;
					} else {
						const { error } = await client.from('external_invites').delete().eq('group_id', update.group.id).eq('invite_id', deletedUser.user_id);
						if (error) throw error;
					}
				});

			return update;
		},
		{
			onSuccess: (update: GroupUpdate) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => {
					if (prevGroups) {
						const updatedGroups = prevGroups.map((group) => {
							return group.id === update.group.id
								? {
										...group,
										name: update.group.name,
								  }
								: group;
						});
						return updatedGroups;
					}
					return prevGroups;
				});
			},
		}
	);
};

export const useInviteToGroup = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	interface GroupInvite {
		group: Omit<GroupType, 'image_token'>;
		members: Member[];
		invites: InviteUserType[];
		inviteUsersOwner: boolean;
	}

	return useMutation(
		async (update: GroupInvite): Promise<GroupInvite> => {
			for (const inviteUser of update.invites) {
				if (inviteUser.user_id) {
					const { error } = await client.from('group_members').insert({ group_id: update.group.id, user_id: inviteUser.user_id, owner: update.inviteUsersOwner });
					if (error) throw error;
				} else {
					const { error: inviteError } = await client.from('external_invites').insert({ group_id: update.group.id, email: inviteUser.email, owner: update.inviteUsersOwner });
					if (inviteError) {
						throw inviteError;
					} else {
						const { error } = await client.functions.invoke('groups/invite', {
							body: {
								group: {
									name: update.group.name,
									id: update.group.id,
								},
								user: inviteUser,
							},
						});
						if (error) throw error;
					}
				}
			}

			return update;
		},
		{
			onSuccess: (update: GroupInvite) => {
				queryClient.setQueryData<Member[]>(
					[...GROUPS_QUERY_KEY, update.group.id, 'members'],

					[
						...update.members,
						...update.invites.map((i) => {
							return {
								user_id: i.user_id!,
								owner: update.inviteUsersOwner,
								invite: true,
								profile: {
									first_name: '',
									last_name: '',
									email: i.email,
									bio: '',
									avatar_token: null,
								},
								external: true,
							};
						}),
					]
				);
			},
		}
	);
};

export const useAcceptGroupInvite = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (id: string): Promise<string> => {
			const { error } = await client.from('group_members').update({ invite: false }).eq('group_id', id).eq('user_id', user.id);
			if (error) throw error;
			return id;
		},
		{
			onSuccess: (id) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => {
					if (prevGroups) {
						const updatedGroups = prevGroups.map((group) => {
							return group.id === id
								? {
										...group,
										invite: false,
								  }
								: group;
						});
						return updatedGroups;
					}
					return prevGroups;
				});
			},
		}
	);
};

export const useDeclineGroupInvite = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (id: string): Promise<string> => {
			const { error } = await client.from('group_members').delete().eq('group_id', id).eq('user_id', user.id);
			if (error) throw error;
			return id;
		},
		{
			onSuccess: (id) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => (prevGroups ? prevGroups.filter((group) => group.id !== id) : prevGroups));
			},
		}
	);
};

export const useLeaveGroup = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (id: string): Promise<string> => {
			const { error } = await client.from('group_members').delete().eq('group_id', id).eq('user_id', user.id);
			if (error) throw error;
			return id;
		},
		{
			onSuccess: (id) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => (prevGroups ? prevGroups.filter((group) => group.id !== id) : prevGroups));
			},
		}
	);
};

export const useDeleteGroup = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	return useMutation(
		async (id: string): Promise<string> => {
			const { error: avatarError } = await client.storage.from('groups').remove([`${id}`]);
			if (avatarError) console.log(`Unable to delete group avater.`, avatarError);

			const { error } = await client.from('groups').delete().eq('id', id);
			if (error) throw error;

			return id;
		},
		{
			onSuccess: (id) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => (prevGroups ? prevGroups.filter((group) => group.id !== id) : prevGroups));
			},
		}
	);
};
