import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

// Google Analytics
import ReactGA from 'react-ga4';

import { SnackbarProvider } from 'notistack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase, SupabaseContextProvider } from './lib/useSupabase';
import Theme from './Theme';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			retry: 3,
		},
	},
});

// Google Analytics
const TRACKING_ID = 'G-3YQD49G7SD';
ReactGA.initialize(TRACKING_ID);

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
