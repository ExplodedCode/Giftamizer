import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const getSupabaseUrl = () => {
	return process.env.REACT_APP_SUPABASE_URL ?? 'https://gift-api.trowbridge.tech';
};
export let SUPABASE_URL = getSupabaseUrl();

let SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
