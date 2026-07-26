/// <reference types="vite/client" />

declare module '*.css';

interface ImportMetaEnv {
	readonly REACT_APP_SUPABASE_URL?: string;
	readonly REACT_APP_SUPABASE_ANON_KEY?: string;
	readonly REACT_APP_SUPABASE_SERVICE_ROLE_KEY?: string;
	readonly REACT_APP_IMGBB_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
