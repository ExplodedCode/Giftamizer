import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const getSupabaseUrl = () => {
	let splits = window.location.hostname.split('.');

	if (splits.length > 2) {
		return `.${splits[0]}`;
	} else {
		return '';
	}
};

export let SUPABASE_URL = `https://api${getSupabaseUrl()}.giftamizer.com`;
let SUPABASE_ANON_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNjk1MDIwNDAwLAogICJleHAiOiAxODUyODczMjAwCn0.iMJi-OrGmLKRQfxxXma-OnOXEstXpo9cZhj9zmtpr2w';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
