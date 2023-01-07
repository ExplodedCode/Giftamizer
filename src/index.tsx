import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

import { SnackbarProvider } from 'notistack';

import Theme from './Theme';

import { supabase, SupabaseContextProvider } from './lib/useSupabase';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<SupabaseContextProvider client={supabase}>
		<SnackbarProvider maxSnack={3}>
			<Theme />
		</SnackbarProvider>
	</SupabaseContextProvider>
);

reportWebVitals();
