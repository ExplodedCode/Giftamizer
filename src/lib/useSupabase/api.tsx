import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

export let SUPABASE_URL = 'https://api.dev.giftamizer.com';
let SUPABASE_ANON_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICAgInJvbGUiOiAiYW5vbiIsCiAgICAiaXNzIjogInN1cGFiYXNlIiwKICAgICJpYXQiOiAxNjczMTU0MDAwLAogICAgImV4cCI6IDE4MzA5MjA0MDAKfQ.I4w9kivih-1NEOTXy4f4CJI2VebzCFp384yeZrFQSts';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
