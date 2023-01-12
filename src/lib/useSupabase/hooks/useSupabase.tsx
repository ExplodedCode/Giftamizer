import type { SupabaseClient, User } from '@supabase/supabase-js';
import { useSnackbar } from 'notistack';
import * as React from 'react';
import { SupabaseContext } from '../context';
import { GroupType, ProfileType } from '../types';

/**
 * useSupabase returns the Supabase client
 * ```typescript
 * // get full client instance
 * const supabase = useSupabase();
 * // or specific members of the SupabaseClient class
 * const { client, user, profile } = useSupabase();
 * ```
 */
export const useSupabase = () => {
	const { enqueueSnackbar } = useSnackbar();

	const context = React.useContext(SupabaseContext);

	if (context === undefined) {
		throw new Error('useSupabase must be used within a SupabaseContext.Provider');
	}

	const updateProfile = async (profile: any) => {
		if (context.sb) {
			try {
				const { error, data } = await context.sb
					.from('profiles')
					.update({ ...profile })
					.eq('user_id', context.profile?.user_id)
					.select();

				if (error) {
					console.log(error);
					enqueueSnackbar(error.message, { variant: 'error' });
				}
				if (data?.length === 0) {
					enqueueSnackbar('Unabled to update record.', { variant: 'error' });
				}
			} catch (error) {
				console.log(error);
			}
		}
	};

	return {
		client: context.sb as SupabaseClient,
		error: context.error,
		user: context.user as User,
		profile: context.profile as ProfileType,
		groups: context.groups as GroupType[],
		updateProfile: updateProfile,
	};
};
