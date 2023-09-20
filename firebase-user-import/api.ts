import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

require('dotenv').config();

export const supabase = createClient<Database>(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '', {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});
