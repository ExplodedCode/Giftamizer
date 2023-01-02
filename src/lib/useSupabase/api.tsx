import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

let SUPABASE_URL = 'https://api.dev.giftamizer.com/';
let SUPABASE_ANON_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICAgInJvbGUiOiAiYW5vbiIsCiAgICAiaXNzIjogInN1cGFiYXNlIiwKICAgICJpYXQiOiAxNjY4MTQyODAwLAogICAgImV4cCI6IDE4MjU5MDkyMDAKfQ.a4KRkGyPw_xgjecc2uKJNj-cFw6sRgTJMoLqKEkZFSs';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);