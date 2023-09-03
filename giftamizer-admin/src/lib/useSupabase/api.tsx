import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

import Service from '../../SUPABASE_SERVICE_ROLE_KEY.json';

export let SUPABASE_URL = 'https://api.dev.giftamizer.com';
let SUPABASE_SERVICE_ROLE_KEY = Service.key;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});
