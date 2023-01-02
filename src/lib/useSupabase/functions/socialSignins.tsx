import { supabase } from '..';

export const signInWithGoogle = async () => {
	const response = await supabase.auth.signInWithOAuth({
		provider: 'google',
	});

	console.log(response);
};

export const signInWithFacebook = async () => {
	const response = await supabase.auth.signInWithOAuth({
		provider: 'facebook',
	});

	console.log(response);
};
