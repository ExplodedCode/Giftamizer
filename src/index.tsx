import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

import { SnackbarProvider } from 'notistack';

import Theme from './Theme';

import { supabase, SupabaseContextProvider } from './lib/useSupabase';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			retry: 3,
		},
	},
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<QueryClientProvider client={queryClient}>
		<SupabaseContextProvider client={supabase}>
			<SnackbarProvider maxSnack={3}>
				<Theme />
			</SnackbarProvider>
		</SupabaseContextProvider>
	</QueryClientProvider>
);

reportWebVitals();
