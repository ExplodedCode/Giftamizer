import { supabase } from '..';

export const signInWithGoogle = async () => {
	await supabase.auth.signInWithOAuth({
		provider: 'google',
	});
};

export const signInWithFacebook = async () => {
	await supabase.auth.signInWithOAuth({
		provider: 'facebook',
	});
};
