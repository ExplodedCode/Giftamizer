import { supabase } from '..';

export const signInWithGoogle = async (redirectTo?: string) => {
	await supabase.auth.signInWithOAuth({
		provider: 'google',

		options: {
			redirectTo: redirectTo ? `https://${window.location.host}${redirectTo}` : '/',

			queryParams: {
				client_id: '219912566294-33apmu8ciuc5mcvsn3khr66l4klhs97v.apps.googleusercontent.com',
			},
		},
	});
};

export const signInWithFacebook = async (redirectTo?: string) => {
	await supabase.auth.signInWithOAuth({
		provider: 'facebook',
		options: {
			redirectTo: redirectTo ? `https://${window.location.host}${redirectTo}` : '/',
		},
	});
};
