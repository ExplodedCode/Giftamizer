import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

import Service from '../../SUPABASE_SERVICE_ROLE_KEY.json';

const getSupabaseUrl = () => {
	let splits = window.location.hostname.split('.');

	if (splits.length > 2) {
		return `.${splits[0]}`;
	} else {
		return '';
	}
};

export let SUPABASE_URL = `https://api${getSupabaseUrl()}.giftamizer.com`;
let SUPABASE_SERVICE_ROLE_KEY = Service.key;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});
