import ReactDOM from 'react-dom/client';

import '@fontsource-variable/inter';
import './index.css';

// Google Analytics
import ReactGA from 'react-ga4';

import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase, SupabaseContextProvider } from './lib/useSupabase';
import { ThemeProvider, useTheme } from './components/theme/ThemeProvider';
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

function AppToaster() {
	const { resolvedTheme } = useTheme();
	return <Toaster richColors closeButton position='bottom-left' theme={resolvedTheme} />;
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<QueryClientProvider client={queryClient}>
		<SupabaseContextProvider client={supabase}>
			<ThemeProvider>
				<Theme />
				<AppToaster />
			</ThemeProvider>
		</SupabaseContextProvider>
	</QueryClientProvider>
);
