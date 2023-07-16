import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';

import { useSupabase } from './useSupabase';
import { ExternalInvite, GroupType, Member, Profile } from '../types';

export const GROUPS_QUERY_KEY = ['groups'];

export const useGetGroups = () => {
	const { client, user } = useSupabase();

	const refreshGroup = useRefreshGroup();
	const queryClient = useQueryClient();
	client
		.channel(`public:group_members:user_id=eq.${user.id}`)
		.on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` }, async (payload) => {
			console.log(payload);
			switch (payload.eventType) {
				case 'INSERT':
					if (payload.new.user_id == user.id) await refreshGroup.mutateAsync(payload.new.group_id);
					break;
				case 'UPDATE':
					if (payload.new.user_id == user.id) await refreshGroup.mutateAsync(payload.new.group_id);
					break;
				case 'DELETE':
					if (payload.old.user_id == user.id)
						queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) =>
							prevGroups ? prevGroups.filter((group) => group.id !== payload.old.group_id) : prevGroups
						);
					break;
			}
		})
		.subscribe();

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

export const useRefreshGroup = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (group_id: string): Promise<GroupType> => {
			const { data, error } = await client
				.from('groups')
				.select(
					`id,
					name,
					image_token,
					my_membership:group_members!inner(*)`
				)
				.eq('id', group_id)
				.eq('my_membership.user_id', user.id)
				.single();

			return data as GroupType;
		},
		{
			onSuccess: (update: GroupType) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => {
					if (prevGroups) {
						var updatedGroups: GroupType[];
						if (prevGroups.find((g) => g.id === update.id)) {
							updatedGroups = prevGroups.map((group) => {
								return group.id === update.id ? update : group;
							});
						} else {
							updatedGroups = [...prevGroups, update];
						}
						return updatedGroups;
					}
					return prevGroups;
				});
			},
		}
	);
};

export const useCreateGroup = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (group: Omit<GroupType, 'id' | 'image_token' | 'my_membership'>): Promise<GroupType> => {
			var { data, error } = await client
				.from('groups')
				.insert({
					name: group.name,
				})
				.select(`*`)
				.single();

			if (error) throw error;

			// Add fake member relationships
			var newGroup = data as any;
			newGroup.my_membership = [
				{
					user_id: user.id,
					group_id: newGroup.id,
					owner: true,
					pinned: false,
					invite: false,
				},
			];

			return newGroup as GroupType;
		},
		{
			onSuccess: (group: GroupType) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => (prevGroups ? [...prevGroups, group] : [group]));
			},
		}
	);
};

export const useGetGroupMembers = (group_id: string) => {
	const { client, user } = useSupabase();

	const refreshGroup = useRefreshGroup();
	const refreshGroupMembers = useRefreshGroupMembers(group_id);
	const queryClient = useQueryClient();

	// group members
	client
		.channel(`public:group_members:group_id=eq.${group_id}`)
		.on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${group_id}` }, async (payload) => {
			// console.log(payload);
			switch (payload.eventType) {
				case 'INSERT':
					await refreshGroupMembers.mutateAsync(payload.new as Member);
					// if (payload.new.user_id == user.id) await refreshGroup.mutateAsync(payload.new.group_id);
					break;
				case 'UPDATE':
					await refreshGroupMembers.mutateAsync(payload.new as Member);
					// if (payload.new.user_id == user.id) await refreshGroup.mutateAsync(payload.new.group_id);
					break;
				case 'DELETE':
					queryClient.setQueryData([...GROUPS_QUERY_KEY, group_id, 'members'], (prevGroupMember: Member[] | undefined) =>
						prevGroupMember ? prevGroupMember.filter((member) => member.user_id !== payload.old.user_id) : prevGroupMember
					);
					if (payload.old.user_id == user.id)
						queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) =>
							prevGroups ? prevGroups.filter((group) => group.id !== payload.old.group_id) : prevGroups
						);
					break;
			}
		})
		.subscribe();

	// External invites
	client
		.channel(`public:external_invites:group_id=eq.${group_id}`)
		.on('postgres_changes', { event: '*', schema: 'public', table: 'external_invites', filter: `group_id=eq.${group_id}` }, async (payload) => {
			// console.log(payload);
			switch (payload.eventType) {
				case 'INSERT':
					await refreshGroupMembers.mutateAsync({
						user_id: payload.new.email,
						owner: payload.new.owner,
						invite: true,
						profile: { first_name: '', last_name: '', email: payload.new.email, bio: '', avatar_token: null },
						external: true,
					} as Member);
					// if (payload.new.user_id == user.id) await refreshGroup.mutateAsync(payload.new.group_id);
					break;
				case 'UPDATE':
					await refreshGroupMembers.mutateAsync({
						user_id: payload.new.email,
						owner: payload.new.owner,
						invite: true,
						profile: { first_name: '', last_name: '', email: payload.new.email, bio: '', avatar_token: null },
						external: true,
					} as Member);
					// if (payload.new.user_id == user.id) await refreshGroup.mutateAsync(payload.new.group_id);
					break;
				case 'DELETE':
					queryClient.setQueryData([...GROUPS_QUERY_KEY, group_id, 'members'], (prevGroupMember: Member[] | undefined) =>
						prevGroupMember ? prevGroupMember.filter((member) => member.user_id !== payload.old.email) : prevGroupMember
					);
					if (payload.old.email == user.id)
						queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) =>
							prevGroups ? prevGroups.filter((group) => group.id !== payload.old.group_id) : prevGroups
						);
					break;
			}
		})
		.subscribe();

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
					user_id: i.email,
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

export const useRefreshGroupMembers = (group_id: string) => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (update: Member): Promise<Member> => {
			if ((moment(update.updated_at).diff(moment()) > 10000 || update.created_at === update.updated_at) && !update.external) {
				console.log('Refresh from DB');

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
					)`
					)
					.eq('user_id', update.user_id)
					.eq('group_id', group_id)
					.single();
				if (error) throw error;
				update = data as unknown as Member;
			}

			return update;
		},
		{
			onSuccess: (update: Member) => {
				queryClient.setQueryData([...GROUPS_QUERY_KEY, group_id, 'members'], (prevGroupMembers: Member[] | undefined) => {
					if (prevGroupMembers) {
						var updatedGroupMembers: Member[];
						if (!update.external) {
							if (prevGroupMembers.find((m) => m.user_id === update.user_id)) {
								updatedGroupMembers = prevGroupMembers.map((member) => {
									return member.user_id === update.user_id ? { ...member, ...update } : member;
								});
							} else {
								updatedGroupMembers = [...prevGroupMembers, update];
							}
							return updatedGroupMembers.filter((m) => m.user_id !== user.id);
						} else {
							if (prevGroupMembers.find((m) => m.profile.email === update.profile.email)) {
								updatedGroupMembers = prevGroupMembers.map((member) => {
									return member.profile.email === update.profile.email ? { ...member, ...update } : member;
								});
							} else {
								updatedGroupMembers = [...prevGroupMembers, update];
							}
							return updatedGroupMembers.filter((m) => m.user_id !== user.id);
						}
					}
					return prevGroupMembers;
				});
			},
		}
	);
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
							group_id: update.group.id,
							email: m.profile.email,
							// invite_id: m.user_id,
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
						const { error } = await client.from('external_invites').delete().eq('group_id', update.group.id).eq('email', deletedUser.profile.email);
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
		invites: Profile[];
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
									first_name: i.first_name,
									last_name: i.last_name,
									email: i.email,
									bio: '',
									avatar_token: null,
								},
								external: i.user_id ? false : true,
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
		async (group: GroupType): Promise<GroupType> => {
			const { error } = await client.from('group_members').update({ invite: false }).eq('group_id', group.id).eq('user_id', user.id);
			if (error) throw error;

			return group;
		},
		{
			onSuccess: (newGroup: GroupType) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => {
					if (prevGroups) {
						const updatedGroups = prevGroups.map((group) => {
							return group.id === newGroup.id
								? {
										...group,
										my_membership: [
											{
												...group.my_membership[0],
												invite: false,
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
