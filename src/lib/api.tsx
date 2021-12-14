import { createClient, OAuthResponse, Provider } from '@supabase/supabase-js';
import { Database } from './database.types';

let SUPABASE_URL = 'http://localhost:54321';
let SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export const signInWithSocial = (provider: Provider) => {
	return new Promise<OAuthResponse>(async (resolve) => {
		const responese: OAuthResponse = await supabase.auth.signInWithOAuth({
			provider: provider,
		});

		resolve(responese);
	});
};

export const validateEmail = (email: string) => {
	var regex = /\S+@\S+\.\S+/;
	return regex.test(email);
};
