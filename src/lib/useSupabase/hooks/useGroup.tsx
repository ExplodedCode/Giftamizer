import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';

import { useSupabase } from './useSupabase';
import { ExternalInvite, GroupType, ListType, Member, Profile } from '../types';
import { dataUrlToFile } from '../../../components/ImageCropper';
import { LISTS_QUERY_KEY } from './useLists';
import { FakeDelay, useGetProfile } from '.';

export const GROUPS_QUERY_KEY = ['groups'];

export const useGetGroups = () => {
	const { client, user } = useSupabase();

	const refreshGroup = useRefreshGroup();
	const queryClient = useQueryClient();
	client
		.channel(`public:group_members:user_id=eq.${user.id}`)
		.on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` }, async (payload) => {
			switch (payload.eventType) {
				case 'INSERT':
					if (payload.new.user_id === user.id) await refreshGroup.mutateAsync(payload.new.group_id);
					break;
				case 'UPDATE':
					if (payload.new.user_id === user.id) await refreshGroup.mutateAsync(payload.new.group_id);
					break;
				case 'DELETE':
					if (payload.old.user_id === user.id)
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
					invite_link,
					secret_santa,
					image_token,
					my_membership:group_members!inner(*)`
				)
				.eq('my_membership.user_id', user.id)
				.order('name', { ascending: true });
			if (error) throw error;

			return data.map((g) => {
				// @ts-ignore
				return { ...g, image: g.image_token && `${client.supabaseUrl}/storage/v1/object/public/groups/${g.id}?${g.image_token}` };
			}) as GroupType[];
		},
	});
};

export const useRefreshGroup = () => {
	const queryClient = useQueryClient();
	const { client, user } = useSupabase();

	return useMutation(
		async (group_id: string): Promise<GroupType> => {
			const { data } = await client
				.from('groups')
				.select(
					`id,
					name,
					invite_link,
					secret_santa,
					image_token,
					my_membership:group_members!inner(*)`
				)
				.eq('id', group_id)
				.eq('my_membership.user_id', user.id)
				.single();

			// @ts-ignore
			return { ...data, image: data.image_token && `${client.supabaseUrl}/storage/v1/object/public/groups/${data.id}?${data.image_token}` } as GroupType;
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
		async (group: Omit<GroupType, 'id' | 'secret_santa' | 'image_token' | 'my_membership'>): Promise<GroupType> => {
			var { data, error } = await client
				.from('groups')
				.insert({
					name: group.name,
					image_token: group.image ? Date.now() : null,
				})
				.select(`*`)
				.single();

			if (error) throw error;
			var newGroup = data;

			// upload image if exists
			if (group.image?.startsWith('data:')) {
				const { error: imageError } = await client.storage.from('groups').upload(`${data.id}`, await dataUrlToFile(group.image, 'avatar'), {
					cacheControl: '3600',
					upsert: true,
				});
				if (imageError) throw imageError;

				// @ts-ignore
				newGroup.image = `${client.supabaseUrl}/storage/v1/object/public/groups/${data.id}?${data.image_token}`;
			}

			// Add fake member relationships
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
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => (prevGroups ? [group, ...prevGroups] : [group]));
			},
		}
	);
};

export const useGetGroupMembers = (group_id: string) => {
	const { client, user } = useSupabase();

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
					break;
				case 'UPDATE':
					await refreshGroupMembers.mutateAsync(payload.new as Member);
					break;
				case 'DELETE':
					queryClient.setQueryData([...GROUPS_QUERY_KEY, group_id, 'members'], (prevGroupMember: Member[] | undefined) =>
						prevGroupMember ? prevGroupMember.filter((member) => member.user_id !== payload.old.user_id) : prevGroupMember
					);
					if (payload.old.user_id === user.id)
						queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) =>
							prevGroups ? prevGroups.filter((group) => group.id !== payload.old.group_id) : prevGroups
						);
					break;
			}
		})
		.subscribe();

	// child lists
	client
		.channel(`public:lists_groups:group_id=eq.${group_id}`)
		.on('postgres_changes', { event: '*', schema: 'public', table: 'lists_groups', filter: `group_id=eq.${group_id}` }, async (payload) => {
			console.log(payload);
			switch (payload.eventType) {
				case 'INSERT':
					await refreshGroupMembers.mutateAsync({
						user_id: `${payload.new.user_id}_${payload.new.list_id}`,
						owner: false,
						invite: false,
						profile: {
							first_name: '',
							last_name: '',
							email: '',
							bio: '',
							avatar_token: null,
							enable_lists: false,
						},
						child_list: true,
					});
					break;
				case 'UPDATE':
					await refreshGroupMembers.mutateAsync({
						user_id: `${payload.new.user_id}_${payload.new.list_id}`,
						owner: false,
						invite: false,
						profile: {
							first_name: '',
							last_name: '',
							email: '',
							bio: '',
							avatar_token: null,
							enable_lists: false,
						},
						child_list: true,
					});
					break;
				case 'DELETE':
					queryClient.setQueryData([...GROUPS_QUERY_KEY, group_id, 'members'], (prevGroupMember: Member[] | undefined) =>
						prevGroupMember ? prevGroupMember.filter((member) => member.user_id !== `${payload.old.user_id}_${payload.old.list_id}`) : prevGroupMember
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
					break;
				case 'UPDATE':
					await refreshGroupMembers.mutateAsync({
						user_id: payload.new.email,
						owner: payload.new.owner,
						invite: true,
						profile: { first_name: '', last_name: '', email: payload.new.email, bio: '', avatar_token: null },
						external: true,
					} as Member);
					break;
				case 'DELETE':
					queryClient.setQueryData([...GROUPS_QUERY_KEY, group_id, 'members'], (prevGroupMember: Member[] | undefined) =>
						prevGroupMember ? prevGroupMember.filter((member) => member.user_id !== payload.old.email) : prevGroupMember
					);
					if (payload.old.email === user.id)
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
							enable_lists,
							avatar_token
						)
					)
					`
				)
				.neq('user_id', user.id)
				.eq('group_id', group_id);
			if (error) throw error;
			var memberList: Member[] = (data as unknown as Member[]).map((m) => {
				return {
					...m,
					profile: {
						...m.profile,
						// @ts-ignore
						image: m.profile.avatar_token && m.profile.avatar_token !== -1 && `${client.supabaseUrl}/storage/v1/object/public/avatars/${m.user_id}?${m.profile.avatar_token}`,
					},
				};
			}) as Member[];

			// get and merge child lists
			const { data: lists, error: ListsError } = await client
				.from('lists')
				.select(
					`*,
					lists_groups!inner(
						group_id
					),
					profile:profiles(
						first_name,
						last_name
					)`
				)
				.eq('lists_groups.group_id', group_id)
				.eq('child_list', true);
			if (ListsError) throw ListsError;
			var childLists: Member[] = (lists as any[]).map((l) => {
				return {
					user_id: `${l.user_id}_${l.id}`,
					owner: false,
					invite: false,
					profile: {
						first_name: l.name,
						last_name: '',
						email: `${l.profile.first_name} ${l.profile.last_name}`,
						// @ts-ignore
						image: l.avatar_token ? `${client.supabaseUrl}/storage/v1/object/public/lists/${l.id}?${l.avatar_token}` : undefined,
						bio: l.bio,
						avatar_token: null,
					},
					child_list: true,
				};
			}) as Member[];

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

			return sortMembers([...memberList, ...childLists, ...externalInvites] as any as Member[]);
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

				if (update.user_id.includes('_')) {
					// child list
					const { data, error } = await client
						.from('lists')
						.select(
							`*,
							lists_groups!inner(
								group_id
							),
							profile:profiles(
								first_name,
								last_name
							)`
						)
						.eq('lists_groups.group_id', group_id)
						.eq('id', update.user_id!.split('_')[1])
						.eq('user_id', update.user_id!.split('_')[0])
						.single();
					if (error) throw error;
					update = {
						user_id: `${data.user_id}_${data.id}`,
						owner: false,
						invite: false,
						profile: {
							first_name: data.name,
							last_name: '',
							email: `${data.profile.first_name} ${data.profile.last_name}`,
							// @ts-ignore
							image: data.avatar_token && `${client.supabaseUrl}/storage/v1/object/public/lists/${data.id}?${data.avatar_token}`,
							bio: data.bio,
							avatar_token: null,
							enable_lists: false,
						},
						child_list: true,
					};
				} else {
					// user member
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
					update = {
						...update,
						profile: {
							...update.profile,
							// @ts-ignore
							image: update.profile.avatar_token ? `${client.supabaseUrl}/storage/v1/object/public/avatars/${update.user_id}?${update.profile.avatar_token}` : '',
						},
					};
				}
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
							return sortMembers(updatedGroupMembers.filter((m) => m.user_id !== user.id));
						} else {
							if (prevGroupMembers.find((m) => m.profile.email === update.profile.email)) {
								updatedGroupMembers = prevGroupMembers.map((member) => {
									return member.profile.email === update.profile.email ? { ...member, ...update } : member;
								});
							} else {
								updatedGroupMembers = [...prevGroupMembers, update];
							}
							return sortMembers(updatedGroupMembers.filter((m) => m.user_id !== user.id));
						}
					}
					return sortMembers(prevGroupMembers ?? []);
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
			await FakeDelay(); // fake delay

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
		members?: Member[];
	}

	return useMutation(
		async (update: GroupUpdate): Promise<GroupUpdate> => {
			console.log(update);

			const { data, error: groupError } = await client
				.from('groups')
				.update({
					name: update.group.name,
					invite_link: update.group.invite_link,
					secret_santa: update.group.secret_santa,
					image_token: update.group.image ? Date.now() : null,
				})
				.eq('id', update.group.id)
				.select()
				.single();
			if (groupError) throw groupError;

			// upload image if exists
			if (update.group.image?.startsWith('data:') && data) {
				const { error: imageError } = await client.storage.from('groups').upload(`${update.group.id}`, await dataUrlToFile(update.group.image, 'avatar'), {
					cacheControl: '3600',
					upsert: true,
				});
				if (imageError) throw imageError;

				// @ts-ignore
				update.group.image = `${client.supabaseUrl}/storage/v1/object/public/groups/${data.id}?${data.image_token}`;
			} else if (data.image_token === null) {
				update.group.image = undefined;
			}

			if (update.members) {
				// Update Members
				const { error: memberError } = await client.from('group_members').upsert(
					update.members
						?.filter((m) => !m.deleted && !m.external && !m?.user_id?.includes('_'))
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
						?.filter((m) => !m.deleted && m.external && !m?.user_id?.includes('_'))
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
						if (deletedUser.external) {
							const { error } = await client.from('external_invites').delete().eq('group_id', update.group.id).eq('email', deletedUser.profile.email);
							if (error) throw error;
						} else if (deletedUser.child_list) {
							const { error } = await client
								.from('lists_groups')
								.delete()
								.eq('group_id', update.group.id)
								.eq('user_id', deletedUser.user_id.split('_')[0])
								.eq('list_id', deletedUser.user_id.split('_')[1]);
							if (error) throw error;
						} else {
							const { error } = await client.from('group_members').delete().eq('group_id', update.group.id).eq('user_id', deletedUser.user_id);
							if (error) throw error;
						}
					});
			}

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
										image: update.group.image,
										secret_santa: update.group.secret_santa,
								  }
								: group;
						});
						return updatedGroups;
					}
					return prevGroups;
				});

				queryClient.setQueryData(LISTS_QUERY_KEY, (prevLists: ListType[] | undefined) => {
					if (prevLists) {
						const updatedLists = prevLists.map((list) => {
							list.groups = list.groups?.map((g) => {
								return g.id === update.group.id
									? {
											...g,
											name: update.group.name,
									  }
									: g;
							});

							return list;
						});
						return updatedLists;
					}
					return prevLists;
				});
			},
		}
	);
};

export const useInviteToGroup = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();
	const { data: profile } = useGetProfile();

	interface GroupInvite {
		group: Omit<GroupType, 'image_token'>;
		members: Member[];
		invites: Profile[];
		inviteUsersOwner: boolean;
	}

	return useMutation(
		async (update: GroupInvite): Promise<GroupInvite> => {
			const { data, error: groupError } = await client
				.from('groups')
				.update({
					name: update.group.name,
					invite_link: update.group.invite_link,
					image_token: update.group.image ? Date.now() : null,
				})
				.eq('id', update.group.id)
				.select()
				.single();
			if (groupError) throw groupError;

			// upload image if exists
			if (update.group.image?.startsWith('data:') && data) {
				const { error: imageError } = await client.storage.from('groups').upload(`${update.group.id}`, await dataUrlToFile(update.group.image, 'avatar'), {
					cacheControl: '3600',
					upsert: true,
				});
				if (imageError) throw imageError;

				// @ts-ignore
				update.group.image = `${client.supabaseUrl}/storage/v1/object/public/groups/${data.id}?${data.image_token}`;
			} else if (data.image_token === null) {
				update.group.image = undefined;
			}

			for (const inviteUser of update.invites) {
				if (inviteUser.user_id) {
					const { error } = await client.from('group_members').insert({ group_id: update.group.id, user_id: inviteUser.user_id, owner: update.inviteUsersOwner });
					if (error) {
						throw error;
					} else {
						const { error } = await client.functions.invoke('invite/internal', {
							body: {
								group: {
									name: update.group.name,
									id: update.group.id,
								},
								user: inviteUser,
								invited_by: `${profile?.first_name} ${profile?.last_name} `,
							},
						});
						if (error) console.error(error);
					}
				} else {
					const { error: inviteError } = await client.from('external_invites').insert({ group_id: update.group.id, email: inviteUser.email, owner: update.inviteUsersOwner });
					if (inviteError) {
						throw inviteError;
					} else {
						const { error } = await client.functions.invoke('invite/external', {
							body: {
								group: {
									name: update.group.name,
									id: update.group.id,
								},
								user: inviteUser,
								invited_by: `${profile?.first_name} ${profile?.last_name} `,
							},
						});
						if (error) console.error(error);
					}
				}
			}

			return update;
		},
		{
			onSuccess: (update: GroupInvite) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => {
					if (prevGroups) {
						const updatedGroups = prevGroups.map((group) => {
							return group.id === update.group.id
								? {
										...group,
										name: update.group.name,
										image: update.group.image,
								  }
								: group;
						});
						return updatedGroups;
					}
					return prevGroups;
				});

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
									enable_lists: i.enable_lists,
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

				// update lists
				queryClient.setQueryData(LISTS_QUERY_KEY, (prevLists: ListType[] | undefined) => {
					if (prevLists) {
						return prevLists.map((list) => {
							list.groups = list.groups?.filter((g) => g.id !== id);
							return list;
						});
					}
					return prevLists;
				});
			},
		}
	);
};

export const useDeleteGroup = () => {
	const queryClient = useQueryClient();
	const { client } = useSupabase();

	return useMutation(
		async (id: string): Promise<string> => {
			const { error } = await client.from('groups').delete().eq('id', id);
			if (error) throw error;

			return id;
		},
		{
			onSuccess: (id) => {
				queryClient.setQueryData(GROUPS_QUERY_KEY, (prevGroups: GroupType[] | undefined) => (prevGroups ? prevGroups.filter((group) => group.id !== id) : prevGroups));

				// update lists
				queryClient.setQueryData(LISTS_QUERY_KEY, (prevLists: ListType[] | undefined) => {
					if (prevLists) {
						return prevLists.map((list) => {
							list.groups = list.groups?.filter((g) => g.id !== id);
							return list;
						});
					}
					return prevLists;
				});
			},
		}
	);
};

const sortMembers = (members: Member[]) => {
	return members.sort((a, b) => (`${a.profile.first_name} ${a.profile.last_name}` > `${b.profile.first_name} ${b.profile.last_name}` ? 1 : -1));
};
