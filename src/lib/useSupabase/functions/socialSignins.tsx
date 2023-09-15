import { supabase } from '..';

export const signInWithGoogle = async () => {
	await supabase.auth.signInWithOAuth({
		provider: 'google',

		options: {
			queryParams: {
				client_id: '219912566294-33apmu8ciuc5mcvsn3khr66l4klhs97v.apps.googleusercontent.com',
			},
		},
	});
};

export const signInWithFacebook = async () => {
	await supabase.auth.signInWithOAuth({
		provider: 'facebook',
	});
};
