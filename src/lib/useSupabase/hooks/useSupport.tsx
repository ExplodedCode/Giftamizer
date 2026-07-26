import { useQuery } from '@tanstack/react-query';

import { useSupabase } from './useSupabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const ISSUES_QUERY_KEY = ['issues'];
const SUPPORT_CONFIGURED_QUERY_KEY = ['support-configured'];

// Used by Navigation to show/hide the Support nav item - the github function
// returns { configured: false } (without calling the GitHub API) when
// GITHUB_TOKEN/GITHUB_OWNER/GITHUB_REPO aren't set on the backend.
export const useGetSupportConfigured = () => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: SUPPORT_CONFIGURED_QUERY_KEY,
		queryFn: async (): Promise<boolean> => {
			const { data, error } = await client.functions.invoke('github/status', { body: {} });

			if (error) throw error;

			return Boolean(data?.configured);
		},
		retry: 0,
		staleTime: 5 * 60 * 1000,
	});
};

export const useGetIssues = () => {
	const { client } = useSupabase();

	return useQuery({
		queryKey: ISSUES_QUERY_KEY,
		queryFn: async (): Promise<any[]> => {
			const { data, error } = await client.functions.invoke('github/issues', {
				body: {
					// url: url,
				},
			});

			if (error) throw error;

			return data.filter((issue: any) => !issue.draft);
		},
		retry: 0,
	});
};

type CreateIssueInput = {
	title: string;
	body: string;
	labels: string[];
};

export const useCreateIssue = () => {
	const { client } = useSupabase();
	const queryClient = useQueryClient();

	return useMutation(
		async (issue: CreateIssueInput): Promise<any> => {
			const { data, error } = await client.functions.invoke('github/issues/create', {
				body: issue,
			});

			if (error) throw error;

			return data;
		},
		{
			onSuccess: (issue: any) => {
				queryClient.setQueryData(ISSUES_QUERY_KEY, (prevIssues: any[] | undefined) => (prevIssues ? [issue, ...prevIssues] : [issue]));
			},
		}
	);
};
