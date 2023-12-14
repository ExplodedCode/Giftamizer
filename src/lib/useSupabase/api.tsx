import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const getSupabaseUrl = () => {
	return window.location.origin;
};
export let SUPABASE_URL = getSupabaseUrl();

let SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
